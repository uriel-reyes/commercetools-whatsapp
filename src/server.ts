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
const conversationState: { [key: string]: string } = {}; // Keyed by WhatsApp number (from)
const processedMessageIds = new Set<string>(); // Track processed message IDs
const messageTimestamps: { [key: string]: number } = {}; // Store message timestamps

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

                // Check if the webhook event is a message status update and ignore it
                if (value.statuses && value.statuses.length > 0) {
                    const status = value.statuses[0].status;
                    console.log("Message status update received:", status);
                    res.status(200).send('Status update received');
                    return; // Exit early to prevent further processing of status updates
                }

                // Check if there are messages to process
                if (value.messages && value.messages.length > 0) {
                    const message = value.messages[0];

                    // Check if the message ID has already been processed
                    if (processedMessageIds.has(message.id)) {
                        console.log('Message already processed:', message.id);
                        res.status(200).send('Duplicate message ignored');
                        return;
                    }

                    // Check if the message was received within a short timeframe (e.g., 60 seconds)
                    const currentTime = Date.now();
                    if (messageTimestamps[message.id] && (currentTime - messageTimestamps[message.id]) < 60000) {
                        console.log('Duplicate message received within a short timeframe, skipping:', message.id);
                        res.status(200).send('Duplicate message ignored');
                        return;
                    }

                    // Mark message as processed and store the timestamp
                    processedMessageIds.add(message.id);
                    messageTimestamps[message.id] = currentTime;

                    if (message && message.type === 'text' && message.text && message.text.body) {
                        const from = message.from;
                        const text = message.text.body.toLowerCase();

                        // Check the current state of the conversation for the user
                        const currentState = conversationState[from];

                        if (!currentState || currentState === 'asking-for-category') {
                            if (text === 'categories') {
                                const categories = await getCategories();
                                const validCategories = categories.filter((cat: any) => cat.slug && cat.slug['en-US']);
                                const categoryNames = validCategories.map((cat: any) => cat.name['en-US']).join('\n');

                                // Update state: user needs to select a category
                                conversationState[from] = 'awaiting-category-selection';

                                await sendMessageToWhatsApp(from, `Please choose a category:\n${categoryNames}`);
                            }
                        } else if (currentState === 'awaiting-category-selection') {
                            // Process category selection
                            const categories = await getCategories();
                            const selectedCategory = categories.find(
                                (cat: any) => cat.name['en-US'].toLowerCase() === text && cat.slug && cat.slug['en-US']
                            );

                            if (selectedCategory) {
                                const products = await getProductsByCategoryId(selectedCategory.id);
                                const productNames = products.map((prod: any) => prod.name['en-US']).join('\n');

                                // Reset conversation state after sending the product list
                                conversationState[from] = null;

                                await sendMessageToWhatsApp(from, `Here are the products:\n${productNames}`);
                            } else {
                                await sendMessageToWhatsApp(from, "Category not found. Please select a valid category.");
                            }
                        } else {
                            // Default fallback, send a message if no state is set
                            await sendMessageToWhatsApp(from, 'Please type "categories" to see the available options.');
                        }
                    } else {
                        console.log("Received a non-text message or the message body was not found.");
                        res.status(200).send('Non-text message received.');
                    }
                } else {
                    console.log("No messages found in the request.");
                    res.status(200).send('No messages found.');
                }
            } else {
                console.log("No changes found in the request.");
                res.status(200).send('No changes found.');
            }
        } else {
            console.log("No entry found in the request.");
            res.status(200).send('No entry found.');
        }
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
        console.log("Categories response:", JSON.stringify(response.body.results, null, 2));
        return response.body.results;
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw new Error("Failed to fetch categories");
    }
}

async function getProductsByCategoryId(categoryId: string) {
    try {
        if (!categoryId) {
            throw new Error("Category ID is undefined.");
        }

        // Using product-projections search endpoint and filter query for categories
        const response = await apiRoot.productProjections()
            .search()
            .get({ queryArgs: { "filter.query": `categories.id:"${categoryId}"` } })
            .execute();

        // Returning the search results
        return response.body.results;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
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
