import * as express from 'express';
import axios from 'axios';
import apiRoot from './BuildClient'; // Assuming BuildClient is set up to configure commercetools client
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Use Express's built-in middleware for parsing JSON
app.use(express.json());

// Update the conversationState to include lineItemId
const conversationState: {
    [key: string]: {
        state: string;
        products?: { name: string, id: string }[]; // Store product names and IDs
        cartId?: string; // Store the cart ID for the user session
        cartVersion?: number; // Store the cart version for the user session
        lineItemId?: string; // Store the line item ID for the user session
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
                                    let lineItemId;

                                    if (!cartId) {
                                        const cart = await createCart(selectedProduct.id, 1); // Pass selected product ID and quantity
                                        cartId = cart.id;
                                        cartVersion = cart.version; // Capture the cart version for future updates
                                        lineItemId = cart.lineItems?.[0]?.id; // Capture the lineItemId from the cart
                                        conversationState[from].cartId = cartId;
                                        conversationState[from].cartVersion = cartVersion;
                                        conversationState[from].lineItemId = lineItemId;
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
                            const lineItemId = conversationState[from]?.lineItemId; // Track the lineItemId
                        
                            if (text === 'add to cart') {
                                if (selectedProduct && cartId) {
                                    const cartContents = await getCartContents(cartId);
                                
                                    // Check if the product is already in the cart
                                    const lineItem = cartContents.lineItems.find((item: any) => item.productId === selectedProduct.id);
                                
                                    if (lineItem) {
                                        // Product is already in the cart, change the quantity to 1 silently
                                        const updatedCart = await changeLineItemQuantity(cartId, lineItem.id, 1, conversationState[from].cartVersion);
                                        conversationState[from].cartVersion = updatedCart.version;
                                    } else {
                                        // Product is not in the cart, add it to the cart
                                        const { version, lineItemId } = await addProductToCart(cartId, selectedProduct.id, conversationState[from].cartVersion);
                                        
                                        // Update conversation state with new cart version and line item ID
                                        conversationState[from].cartVersion = version;
                                        conversationState[from].lineItemId = lineItemId;
                                        
                                        // Only inform the user when adding a new product, not when updating
                                        await sendMessageToWhatsApp(from, `Product added to your cart.`);
                                    }
                                
                                    // Get updated cart info and inform the user
                                    const updatedCartContents = await getCartContents(cartId);
                                    await sendMessageToWhatsApp(from, `You now have ${updatedCartContents.totalLineItemQuantity} product(s) in your cart with a total of ${updatedCartContents.totalPrice.centAmount / 100} USD.`);
                                
                                    // Ask if the customer wants to place the order
                                    await sendMessageToWhatsApp(from, `Would you like to place the order? Reply with 'Yes' to confirm.`);
                                
                                    // Set the state to awaiting-order-confirmation
                                    conversationState[from].state = 'awaiting-order-confirmation';
                                } else {
                                    await sendMessageToWhatsApp(from, "Product not found for adding to cart.");
                                }
                            }                                                       
                            else if (text === 'continue browsing') {
                                if (cartId && conversationState[from].lineItemId) {
                                    // Remove the currently selected product's line item
                                    const updatedVersion = await removeLineItemFromCart(cartId, conversationState[from].lineItemId, conversationState[from].cartVersion);
                                    
                                    // Update the conversation state with the new cart version
                                    conversationState[from].cartVersion = updatedVersion;
                                    
                                    // Clear selected product and lineItemId since the user is continuing to browse
                                    conversationState[from].selectedProduct = null;
                                    conversationState[from].lineItemId = null;
                                    
                                    // Send the updated product list
                                    const currentCategoryProducts = conversationState[from].products || [];
                                    const productNames = currentCategoryProducts.map(prod => prod.name).join('\n');
                                    await sendMessageToWhatsApp(from, `Here are the products:\n${productNames}`);
                                    conversationState[from].state = 'awaiting-product-selection';
                                } else {
                                    await sendMessageToWhatsApp(from, "No product found in the cart to remove.");
                                }
                            } else if (text === 'new category') {
                                // Fetch and display new categories
                                const categories = await getCategories();
                                const validCategories = categories.filter((cat: any) => cat.slug && cat.slug['en-US']);
                                const categoryNames = validCategories.map((cat: any) => cat.name['en-US']).join('\n');
                                
                                // Clear selected product and lineItemId when browsing a new category
                                conversationState[from].selectedProduct = null;
                                conversationState[from].lineItemId = null;
                        
                                await sendMessageToWhatsApp(from, `Please choose a new category:\n${categoryNames}`);
                                conversationState[from].state = 'awaiting-category-selection';
                            } else {
                                await sendMessageToWhatsApp(from, 'Please type "Add to cart", "Continue browsing", or "New category".');
                            }
                        }                        
                        else if (currentState === 'awaiting-order-confirmation') {
                            const cartId = conversationState[from]?.cartId;  // Retrieve cartId from the conversation state
                        
                            if (text.toLowerCase() === 'yes' && cartId) {
                                const cartVersion = conversationState[from]?.cartVersion;
                        
                                if (cartId && cartVersion) {
                                    // Make the API call to create the order
                                    try {
                                        const order = await createOrder(cartId, cartVersion);
                        
                                        // Notify customer of the successful order
                                        await sendMessageToWhatsApp(from, `Your order has been placed successfully! Your order ID is ${order.id}.`);
                                        conversationState[from].state = null; // Reset the conversation state
                                    } catch (error) {
                                        // Handle any error from the order creation
                                        await sendMessageToWhatsApp(from, `Sorry, we couldn't place your order. Please try again.`);
                                        console.error("Error placing order:", error);
                                    }
                                } else {
                                    await sendMessageToWhatsApp(from, "Cart information is missing. Unable to place the order.");
                                }
                            } else {
                                await sendMessageToWhatsApp(from, "Order not confirmed. Please type 'Yes' if you'd like to place the order.");
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
                ],
                shippingAddress: {
                    country: "US"
                }
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
async function removeLineItemFromCart(cartId: string, lineItemId: string, version: number) {
    try {
        const response = await apiRoot.carts().withId({ ID: cartId }).post({
            body: {
                version: version, // Use the current cart version
                actions: [{
                    action: 'removeLineItem',
                    lineItemId: lineItemId
                }]
            }
        }).execute();

        console.log(`Removed product ${lineItemId} from cart ${cartId}. New version: ${response.body.version}`);
        
        // Return the updated cart version
        return response.body.version;
    } catch (error) {
        console.error("Error removing product from cart:", error.response ? error.response.data : error.message);
        throw new Error("Failed to remove product from cart");
    }
}

async function addProductToCart(cartId: string, productId: string, version: number) {
    try {
        const response = await apiRoot.carts().withId({ ID: cartId }).post({
            body: {
                version: version, // Pass the current version of the cart
                actions: [{
                    action: 'addLineItem',
                    productId: productId
                }]
            }
        }).execute();

        console.log(`Product added to cart. Cart ID: ${cartId}`);
        console.log(`Updated Cart:`, response.body.lineItems);

        // Return the updated cart version and the new line item ID
        const newLineItemId = response.body.lineItems[response.body.lineItems.length - 1].id;
        return { version: response.body.version, lineItemId: newLineItemId };
    } catch (error) {
        console.error("Error adding product to cart:", error.response ? error.response.data : error.message);
        throw new Error("Failed to add product to cart");
    }
}

async function changeLineItemQuantity(cartId: string, lineItemId: string, quantity: number, version: number) {
    try {
        const response = await apiRoot.carts().withId({ ID: cartId }).post({
            body: {
                version: version,
                actions: [{
                    action: 'changeLineItemQuantity',
                    lineItemId: lineItemId,
                    quantity: quantity
                }]
            }
        }).execute();

        console.log(`Updated quantity of line item ${lineItemId} in cart ${cartId} to ${quantity}.`);
        return response.body; // Return the updated cart
    } catch (error) {
        console.error("Error changing line item quantity:", error.response ? error.response.data : error.message);
        throw new Error("Failed to change line item quantity");
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

async function createOrder(cartId: string, cartVersion: number) {
    try {
        const response = await apiRoot.orders().post({
            body: {
                cart: {
                    id: cartId,
                    typeId: 'cart'
                },
                version: cartVersion
            }
        }).execute();

        console.log(`Order created successfully with ID: ${response.body.id}`);
        return response.body; // Return order object
    } catch (error) {
        console.error("Error creating order:", error.response ? error.response.data : error.message);
        throw new Error("Failed to create order");
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
