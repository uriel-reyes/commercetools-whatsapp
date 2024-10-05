import axios from 'axios';
import apiRoot from './src/BuildClient';
import * as dotenv from 'dotenv';

dotenv.config();

// Get Categories from commercetools
async function getCategories() {
  try {
    const response = await apiRoot.categories().get().execute();
    return response.body.results; // List of categories
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

// Get Products by Category ID
async function getProductsByCategory(categoryId: string) {
  try {
    const response = await apiRoot.products()
      .get({ queryArgs: { where: `categories(id="${categoryId}")` } })
      .execute();
    return response.body.results; // List of products
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

// Send message to WhatsApp
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

// WhatsApp Webhook Function
export const whatsappWebhook = async (req: any, res: any) => {
  try {
    const message = req.body.entry[0].changes[0].value.messages[0];
    const from = message.from; // Customer's WhatsApp number
    const body = message.text.body; // Message content

    // Fetch categories once at the beginning
    const categories = await getCategories();

    // If the user says "categories", send category options
    if (body.toLowerCase() === 'categories') {
      const categoryNames = categories.map((cat: any) => cat.name.en).join('\n');
      await sendMessageToWhatsApp(from, `Please choose a category:\n${categoryNames}`);
    } else {
      // Find the selected category and send products from that category
      const selectedCategory = categories.find((cat: any) => cat.name.en.toLowerCase() === body.toLowerCase());

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
    console.error("Error in WhatsApp webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};
