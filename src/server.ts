import * as express from 'express';
import axios from 'axios';
import apiRoot from './BuildClient'; // Assuming BuildClient is set up to configure commercetools client
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const conversationState: {
    [key: string]: {
        state: string;
        products?: { name: string; id: string }[]; // Store product names and IDs
    };
} = {};

// Track processed message IDs
const processedMessageIds = new Set<string>();

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
                    const status = value.statuses[0].status;
                    console.log('Message status update received:', status);
                    res.status(200).send('Status update received'); // Acknowledge status update
                    return;
                }

                if (value.messages && value.messages.length > 0) {
                    const message = value.messages[0];
                    const messageId = message.id;

                    // Check if the message has already been processed
                    if (processedMessageIds.has(messageId)) {
                        console.log('Message already processed:', messageId);
                        res.status(200).send('Message already processed');
                        return;
                    }

                    if (message && message.type === 'text' && message.text && message.text.body) {
                        const from = message.from;
                        const text = message.text.body.toLowerCase();

                        // Get current conversation state
                        const currentState = conversationState[from]?.state;

                        if (!currentState || currentState === 'asking-for-category') {
                            if (text === 'categories') {
                                const categories = await getCategories();
                                const validCategories = categories.filter(
                                    (cat: any) => cat.slug && cat.slug['en-US']
                                );
                                const categoryNames = validCategories
                                    .map((cat: any) => cat.name['en-US'])
                                    .join('\n');

                                conversationState[from] = { state: 'awaiting-category-selection' };

                                await sendMessageToWhatsApp(from, `Please choose a category:\n${categoryNames}`);
                            }
                        } else if (currentState === 'awaiting-category-selection') {
                            const categories = await getCategories();
                            const selectedCategory = categories.find(
                                (cat: any) =>
                                    cat.name['en-US'].toLowerCase() === text && cat.slug && cat.slug['en-US']
                            );

                            if (selectedCategory) {
                                const products = await getProductsByCategoryId(selectedCategory.id);
                                const productNames = products
                                    .map((prod: any) => prod.name['en-US'])
                                    .join('\n');

                                conversationState[from] = {
                                    state: 'awaiting-product-selection',
                                    products: products.map((prod: any) => ({
                                        name: prod.name['en-US'].toLowerCase(),
                                        id: prod.id,
                                    })),
                                };

                                await sendMessageToWhatsApp(from, `Here are the products:\n${productNames}`);
                                // Send separate message asking for product selection
                                await sendMessageToWhatsApp(from, 'Let me know which product you would like more information on.');
                            } else {
                                await sendMessageToWhatsApp(from, 'Category not found. Please select a valid category.');
                            }
                        } else if (currentState === 'awaiting-product-selection') {
                            const customerProducts = conversationState[from]?.products || [];
                            const selectedProduct = customerProducts.find((prod: any) =>
                                text.includes(prod.name)
                            );

                            if (selectedProduct) {
                                const productDetails = await getProductDetailsById(selectedProduct.id);
                                const productImageUrl = productDetails?.masterVariant?.images?.[0]?.url;

                                if (productImageUrl) {
                                    await sendImageToWhatsApp(from, productImageUrl, `Here is a picture of the ${selectedProduct.name}`);
                                } else {
                                    await sendMessageToWhatsApp(from, "Sorry, I couldn't find an image for this product.");
                                }

                                // Reset conversation state after sending product info
                                conversationState[from] = { state: null };
                            } else {
                                await sendMessageToWhatsApp(from, 'Product not found. Please reply with a valid product name.');
                            }
                        } else {
                            await sendMessageToWhatsApp(from, 'Please type "categories" to see the available options.');
                        }

                        // Mark the message as processed
                        processedMessageIds.add(messageId);
                    } else {
                        console.log('Received a non-text message or the message body was not found.');
                        res.status(200).send('Non-text message received.');
                    }
                } else {
                    console.log('No messages found in the request.');
                    res.status(200).send('No messages found.');
                }
            } else {
                console.log('No changes found in the request.');
                res.status(200).send('No changes found.');
            }
        } else {
            console.log('No entry found in the request.');
            res.status(200).send('No entry found.');
        }
    } catch (error) {
        console.error('Error processing WhatsApp message:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Ensure a 200 OK is always returned for Webhook verification
app.get('/webhook', (req: express.Request, res: express.Response) => {
    const verifyToken = process.env.VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === verifyToken) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
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
        console.log('Categories response:', JSON.stringify(response.body.results, null, 2));
        return response.body.results;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw new Error('Failed to fetch categories');
    }
}

async function getProductsByCategoryId(categoryId: string) {
    try {
        if (!categoryId) {
            throw new Error('Category ID is undefined.');
        }

        const response = await apiRoot.productProjections()
            .search()
            .get({ queryArgs: { 'filter.query': `categories.id:"${categoryId}"` } })
            .execute();

        return response.body.results;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products');
    }
}

async function getProductDetailsById(productId: string) {
    try {
        if (!productId) {
            throw new Error('Product ID is undefined.');
        }

        const response = await apiRoot.productProjections().withId({ ID: productId }).get().execute();
        return response.body;
    } catch (error) {
        console.error('Error fetching product details:', error);
        throw new Error('Failed to fetch product details');
    }
}

// Function to send a text message via WhatsApp
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
        console.error('Error sending message to WhatsApp:', error);
        throw new Error('Failed to send message to WhatsApp');
    }
}

// Function to send an image via WhatsApp
async function sendImageToWhatsApp(to: string, imageUrl: string, caption: string) {
    try {
        const data = {
            messaging_product: 'whatsapp',
            to,
            type: 'image',
            image: {
                link: imageUrl,
                caption: caption,
            },
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
        console.error('Error sending image to WhatsApp:', error);
        throw new Error('Failed to send image to WhatsApp');
    }
}
