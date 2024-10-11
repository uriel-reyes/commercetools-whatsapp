import * as express from 'express';
import axios from 'axios';
import apiRoot from './BuildClient'; // Assuming BuildClient is set up to configure commercetools client
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Use Express's built-in middleware for parsing JSON
app.use(express.json());

// Example to track conversation state in-memory (use a database for persistence)
const conversationState: {
    [key: string]: {
        state: string;
        products?: { name: string, id: string }[]; // Store product names and IDs
        cartId?: string; // Store the cart ID for the user session
        cartVersion?: number; // Store the cart version for the user session
        selectedProduct?: { name: string, id: string }; // Store the selected product
    }
} = {};


// Root route to respond to GET requests at the homepage
app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Server is running! Welcome to the WhatsApp & commercetools integration.');
});

// Webhook route for WhatsApp messages
app.post('/webhook', async (req: express.Request, res: express.Response) => {
    try {
        const body = req.body as any;
        console.log(JSON.stringify(body, null, 2));

        if (body.entry && body.entry.length > 0) {
            const entry = body.entry[0];
            if (entry.changes && entry.changes.length > 0) {
                const changes = entry.changes[0];
                const value = changes.value;

                if (value.messages && value.messages.length > 0) {
                    const message = value.messages[0];
                    if (message && message.type === 'text' && message.text && message.text.body) {
                        const from = message.from;
                        const text = message.text.body.toLowerCase();

                        const currentState = conversationState[from]?.state;

                        if (!currentState || currentState === 'asking-for-category') {
                            if (text === 'categories') {
                                const categories = await getCategories();
                                const validCategories = categories.filter((cat: any) => cat.slug && cat.slug['en-US']);
                                const categoryNames = validCategories.map((cat: any) => cat.name['en-US']).join('\n');

                                conversationState[from] = { state: 'awaiting-category-selection' };
                                await sendMessageToWhatsApp(from, `Please choose a category:\n${categoryNames}`);
                            }
                        } else if (currentState === 'awaiting-category-selection') {
                            const categories = await getCategories();
                            const selectedCategory = categories.find(
                                (cat: any) => cat.name['en-US'].toLowerCase() === text && cat.slug && cat.slug['en-US']
                            );

                            if (selectedCategory) {
                                const products = await getProductsByCategoryId(selectedCategory.id);
                                if (products.length > 0) {
                                    const productNames = products.map((prod: any) => prod.name['en-US']).join('\n');

                                    conversationState[from] = {
                                        state: 'awaiting-product-selection',
                                        products: products.map((prod: any) => ({ name: prod.name['en-US'].toLowerCase(), id: prod.id })),
                                    };

                                    await sendMessageToWhatsApp(from, `Here are the products:\n${productNames}`);
                                    await sendMessageToWhatsApp(from, 'Let me know which product you would like more information on.');
                                } else {
                                    await sendMessageToWhatsApp(from, "Sorry, there are no products available in this category.");
                                }
                            } else {
                                await sendMessageToWhatsApp(from, "Category not found. Please select a valid category.");
                            }
                        } else if (currentState === 'awaiting-product-selection') {
                            const customerProducts = conversationState[from]?.products || [];
                            const selectedProduct = customerProducts.find((prod: any) => text.includes(prod.name));

                            if (selectedProduct) {
                                const { productDetails, price } = await getProductDetailsById(selectedProduct.id);
                                const productImageUrl = productDetails?.masterVariant?.images?.[0]?.url;

                                if (productImageUrl) {
                                    // Create a cart with the selected product
                                    let cartId = conversationState[from].cartId;
                                    let cartVersion = conversationState[from].cartVersion;
                                    if (!cartId) {
                                        const cart = await createCart(selectedProduct.id, 1); // Pass selected product ID and quantity
                                        cartId = cart.id;
                                        cartVersion = cart.version; // Capture the cart version for future updates
                                        conversationState[from].cartId = cartId;
                                        conversationState[from].cartVersion = cartVersion;
                                        conversationState[from].selectedProduct = selectedProduct;
                                    }

                                    await sendMediaMessageToWhatsApp(from, productImageUrl, `${selectedProduct.name}`, price);
                                    conversationState[from].state = 'awaiting-add-or-browse';
                                } else {
                                    await sendMessageToWhatsApp(from, "Sorry, I couldn't find an image for this product.");
                                }
                            } else {
                                await sendMessageToWhatsApp(from, "Product not found. Please reply with a valid product name.");
                            }
                        } else if (currentState === 'awaiting-add-or-browse') {
                            const selectedProduct = conversationState[from]?.selectedProduct;
                            const cartId = conversationState[from]?.cartId;
                            let cartVersion = conversationState[from]?.cartVersion;

                            if (text === 'add to cart') {
                                if (selectedProduct && cartId) {
                                    const cartContents = await getCartContents(cartId);
                                    cartVersion = cartContents.version; // Ensure we always have the latest cart version

                                    const cartSummary = cartContents.lineItems
                                        .map((item: any) => `${item.name.en_US} - Quantity: ${item.quantity}`)
                                        .join('\n');
                                    await sendMessageToWhatsApp(from, `Product added to cart. Here is your current cart:\n${cartSummary}`);
                                    conversationState[from].state = null; // Reset state after adding to cart
                                } else {
                                    await sendMessageToWhatsApp(from, "Product not found for adding to cart.");
                                }
                            } else if (text === 'continue browsing') {
                                if (cartId && selectedProduct) {
                                    await removeLineItemFromCart(cartId, selectedProduct.id, cartVersion);
                                    cartVersion++; // Increment the version after updating the cart
                                    conversationState[from].cartVersion = cartVersion; // Update the cart version in state
                                }

                                const currentCategoryProducts = conversationState[from].products || [];
                                const productNames = currentCategoryProducts.map(prod => prod.name).join('\n');
                                await sendMessageToWhatsApp(from, `Here are the products:\n${productNames}`);
                                conversationState[from].state = 'awaiting-product-selection';
                            } else if (text === 'new category') {
                                const categories = await getCategories();
                                const validCategories = categories.filter((cat: any) => cat.slug && cat.slug['en-US']);
                                const categoryNames = validCategories.map((cat: any) => cat.name['en-US']).join('\n');
                                await sendMessageToWhatsApp(from, `Please choose a new category:\n${categoryNames}`);
                                conversationState[from].state = 'awaiting-category-selection';
                            } else {
                                await sendMessageToWhatsApp(from, 'Please type "Add to cart", "Continue browsing", or "New category".');
                            }
                        }
                    }
                }
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("Error processing WhatsApp message:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Helper functions

async function getCategories() {
    try {
        const response = await apiRoot.categories().get().execute();
        return response.body.results;
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw new Error("Failed to fetch categories");
    }
}

async function getProductsByCategoryId(categoryId: string) {
    try {
        const response = await apiRoot.productProjections()
            .search()
            .get({ queryArgs: { "filter.query": `categories.id:"${categoryId}"` } })
            .execute();

        return response.body.results;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
    }
}

async function getProductDetailsById(productId: string) {
    try {
        const response = await apiRoot.productProjections().withId({ ID: productId }).get().execute();
        const product = response.body;

        // Filter to ensure we only pick the price in USD
        const usdPrice = product.masterVariant?.prices?.find(price => price.value.currencyCode === 'USD');

        // If a USD price is found, use it; otherwise, handle the case where no USD price is available
        const price = usdPrice ? (usdPrice.value.centAmount / 100).toFixed(2) : 'N/A'; // Format to 2 decimal places

        return {
            productDetails: product,
            price: `USD ${price}` // Always return the price formatted in USD
        };
    } catch (error) {
        console.error("Error fetching product details:", error);
        throw new Error("Failed to fetch product details");
    }
}

async function addProductToCart(cartId: string, productId: string) {
    try {
        const response = await apiRoot.carts().withId({ ID: cartId }).post({
            body: {
                version: 1, // Assuming the initial version; you may need to track cart version
                actions: [{
                    action: 'addLineItem',
                    productId
                }]
            }
        }).execute();

        console.log("Product added to cart. Cart ID:", cartId);
        console.log("Updated Cart:", response.body.lineItems);
    } catch (error) {
        console.error("Error adding product to cart:", error.response ? error.response.data : error.message);
        throw new Error("Failed to add product to cart");
    }
}

// Create cart function now returns the cart version and ID
async function createCart(productId: string, quantity: number = 1) {
    try {
        const response = await apiRoot.carts().post({
            body: {
                currency: 'USD',
                store: {
                    typeId: 'store',
                    key: 'whatsapp'
                },
                lineItems: [
                    {
                        productId: productId,  // Product ID passed in
                        quantity: quantity,    // Default quantity is 1
                    }
                ]
            }
        }).execute();

        console.log("Cart created successfully with ID:", response.body.id);
        console.log("Cart version:", response.body.version);
        return response.body; // Return both the cart ID and version
    } catch (error) {
        console.error("Error creating cart:", error.response ? error.response.data : error.message);
        throw new Error("Failed to create cart");
    }
}

// Helper function to remove a line item from the cart with version tracking
async function removeLineItemFromCart(cartId: string, productId: string, version: number) {
    try {
        const response = await apiRoot.carts().withId({ ID: cartId }).post({
            body: {
                version: version, // Use the current version of the cart
                actions: [{
                    action: 'removeLineItem',
                    lineItemId: productId
                }]
            }
        }).execute();

        console.log(`Removed product ${productId} from cart ${cartId}. New version: ${response.body.version}`);
        return response.body.version; // Return updated version
    } catch (error) {
        console.error("Error removing product from cart:", error.response ? error.response.data : error.message);
        throw new Error("Failed to remove product from cart");
    }
}

async function getCartContents(cartId: string) {
    try {
        const response = await apiRoot.carts().withId({ ID: cartId }).get().execute();
        return response.body;
    } catch (error) {
        console.error("Error retrieving cart contents:", error);
        throw new Error("Failed to retrieve cart contents");
    }
}

async function sendMessageToWhatsApp(to: string, message: string) {
    try {
        const data = {
            messaging_product: 'whatsapp',
            to,
            text: { body: message },
        };

        await axios.post(
            `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        console.error("Error sending message to WhatsApp:", error);
        throw new Error("Failed to send message to WhatsApp");
    }
}

async function sendMediaMessageToWhatsApp(to: string, mediaUrl: string, productName: string, price: string) {
    try {
        // Format the caption to include both the product name and price
        const caption = `\nPrice: ${price}`;

        const mediaMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'image',
            image: {
                link: mediaUrl,
                caption // Pass the caption with product price
            },
        };

        await axios.post(
            `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
            mediaMessage,
            {
                headers: {
                    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Add a small delay to ensure the image message is delivered before the prompt
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Send the updated prompt
        await sendMessageToWhatsApp(to, 'Add to cart, continue browsing, or new category?');
    } catch (error) {
        console.error("Error sending media message or follow-up text:", error);
        throw new Error("Failed to send media and options message");
    }
}

// Webhook verification
app.get('/webhook', (req: express.Request, res: express.Response) => {
    const verifyToken = process.env.VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === verifyToken) {
        res.status(200).send(challenge); // Respond with the challenge to verify webhook
    } else {
        res.sendStatus(403);  // Forbidden if verification fails
    }
});
