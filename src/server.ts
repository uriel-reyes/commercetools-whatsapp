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

                // Skip processing message status updates
                if (value.statuses && value.statuses.length > 0) {
                    res.status(200).send('Status update received');
                    return;
                }

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
                                const productNames = products.map((prod: any) => prod.name['en-US']).join('\n');

                                conversationState[from] = {
                                    state: 'awaiting-product-selection',
                                    products: products.map((prod: any) => ({ name: prod.name['en-US'].toLowerCase(), id: prod.id })),
                                };

                                await sendMessageToWhatsApp(from, `Here are the products:\n${productNames}`);
                                await sendMessageToWhatsApp(from, 'Let me know which product you would like more information on.');
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
                                    await sendMediaMessageToWhatsApp(from, productImageUrl, `${selectedProduct.name}`, price);
                                    // Update the conversation state for the next expected input
                                    conversationState[from].state = 'awaiting-add-or-browse';
                                } else {
                                    await sendMessageToWhatsApp(from, "Sorry, I couldn't find an image for this product.");
                                }
                            }
                             else {
                                await sendMessageToWhatsApp(from, "Product not found. Please reply with a valid product name.");
                            }
                        } else if (currentState === 'awaiting-add-or-browse') {
                            if (text === 'add to cart') {
                                // Existing add-to-cart logic
                                let cartId = conversationState[from].cartId;
                                if (!cartId) {
                                    const cart = await createCart();
                                    cartId = cart.id;
                                    conversationState[from].cartId = cartId;
                                }
                        
                                const selectedProduct = conversationState[from].products?.find(prod => text.includes(prod.name));
                                if (selectedProduct) {
                                    await addProductToCart(cartId, selectedProduct.id);
                                    await sendMessageToWhatsApp(from, `Product added to cart. Your cart ID is ${cartId}.`);
                                    conversationState[from].state = null; // Reset state
                                }
                            } else if (text === 'continue browsing') {
                                // Go back to category product list
                                const currentCategoryProducts = conversationState[from].products || [];
                                const productNames = currentCategoryProducts.map(prod => prod.name).join('\n');
                                await sendMessageToWhatsApp(from, `Here are the products:\n${productNames}`);
                                conversationState[from].state = 'awaiting-product-selection';
                            } else if (text === 'new category') {
                                // Return the user to the category list
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

        // Assuming the price is located in the masterVariant
        const price = product.masterVariant?.prices?.[0]?.value?.centAmount / 100 || 'N/A'; // Adjust currency formatting as needed

        return {
            productDetails: product,
            price: `${product.masterVariant?.prices?.[0]?.value?.currencyCode} ${price}` // Format price with currency
        };
    } catch (error) {
        console.error("Error fetching product details:", error);
        throw new Error("Failed to fetch product details");
    }
}

async function createCart() {
    try {
        const response = await apiRoot.carts().post({
            body: {
                currency: 'USD',
                store:{
                    typeId: 'store',
                    key: 'whatsapp'
                }
            }
        }).execute();
        return response.body;
    } catch (error) {
        console.error("Error creating cart:", error);
        throw new Error("Failed to create cart");
    }
}

async function addProductToCart(cartId: string, productId: string) {
    try {
        await apiRoot.carts().withId({ ID: cartId }).post({
            body: {
                version: 1, // Assuming the initial version; you may need to track cart version
                actions: [{
                    action: 'addLineItem',
                    productId
                }]
            }
        }).execute();
    } catch (error) {
        console.error("Error adding product to cart:", error);
        throw new Error("Failed to add product to cart");
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
