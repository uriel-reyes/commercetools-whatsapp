import * as express from 'express';
import axios from 'axios';
import apiRoot from './BuildClient'; // Assuming BuildClient is set up to configure commercetools client
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Use Express's built-in middleware for parsing JSON
app.use(express.json());

// Root route to respond to GET requests at the homepage
app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Server is running! Welcome to the WhatsApp & commercetools integration.');
});

// Webhook route for WhatsApp messages
app.post('/webhook', async (req: express.Request, res: express.Response) => {
    try {
        const body = req.body as any;
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from; // Customer's WhatsApp number
        const text = message.text.body; // Message content

        // Fetch categories from commercetools
        if (text.toLowerCase() === 'categories') {
            const categories = await getCategories();
            const categoryNames = categories.map((cat: any) => cat.name.en).join('\n');
            await sendMessageToWhatsApp(from, `Please choose a category:\n${categoryNames}`);
        } else {
            // Match category name and send products from that category
            const categories = await getCategories();
            const selectedCategory = categories.find((cat: any) => cat.name.en.toLowerCase() === text.toLowerCase());

            if (selectedCategory) {
                const products = await getProductsByCategory(selectedCategory.id);
                const productNames = products.map((prod: any) => prod.name.en).join('\n');
                await sendMessageToWhatsApp(from, `Here are the products:\n${productNames}`);
            } else {
                await sendMessageToWhatsApp(from, "Category not found. Please select a valid category.");
            }
        }

        res.status(200).send('Message processed');
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

async function getProductsByCategory(categoryId: string) {
    try {
        const response = await apiRoot.products()
            .get({ queryArgs: { where: `categories(id="${categoryId}")` } })
            .execute();
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

app.get('/webhook', (req: express.Request, res: express.Response) => {
    const verifyToken = process.env.VERIFY_TOKEN;  // Set this in .env
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`mode: ${mode}`);
    console.log(`token: ${token}`);
    console.log(`challenge: ${challenge}`);
    console.log(`verifyToken: ${verifyToken}`);

    if (mode && token === verifyToken) {
        res.status(200).send(challenge); // Respond with the challenge to verify webhook
    } else {
        res.sendStatus(403);  // Forbidden if verification fails
    }
});

