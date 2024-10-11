"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var axios_1 = require("axios");
var BuildClient_1 = require("./BuildClient"); // Assuming BuildClient is set up to configure commercetools client
var dotenv = require("dotenv");
dotenv.config(); // Load environment variables
var app = express();
var PORT = process.env.PORT || 3000;
// Use Express's built-in middleware for parsing JSON
app.use(express.json());
// Example to track conversation state in-memory (use a database for persistence)
var conversationState = {};
// Root route to respond to GET requests at the homepage
app.get('/', function (req, res) {
    res.send('Server is running! Welcome to the WhatsApp & commercetools integration.');
});
// Webhook route for WhatsApp messages
app.post('/webhook', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var body, entry, changes, value, message, from, text_1, currentState, categories, validCategories, categoryNames, categories, selectedCategory, products, productNames, customerProducts, selectedProduct, _a, productDetails, price, productImageUrl, customerProducts, selectedProduct, cartId, cart, cartContents, cartSummary, currentCategoryProducts, productNames, categories, validCategories, categoryNames, error_1;
    var _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 39, , 40]);
                body = req.body;
                console.log(JSON.stringify(body, null, 2));
                if (!(body.entry && body.entry.length > 0)) return [3 /*break*/, 38];
                entry = body.entry[0];
                if (!(entry.changes && entry.changes.length > 0)) return [3 /*break*/, 38];
                changes = entry.changes[0];
                value = changes.value;
                // Skip processing message status updates
                if (value.statuses && value.statuses.length > 0) {
                    res.status(200).send('Status update received');
                    return [2 /*return*/];
                }
                if (!(value.messages && value.messages.length > 0)) return [3 /*break*/, 38];
                message = value.messages[0];
                if (!(message && message.type === 'text' && message.text && message.text.body)) return [3 /*break*/, 38];
                from = message.from;
                text_1 = message.text.body.toLowerCase();
                currentState = (_b = conversationState[from]) === null || _b === void 0 ? void 0 : _b.state;
                if (!(!currentState || currentState === 'asking-for-category')) return [3 /*break*/, 4];
                if (!(text_1 === 'categories')) return [3 /*break*/, 3];
                return [4 /*yield*/, getCategories()];
            case 1:
                categories = _h.sent();
                validCategories = categories.filter(function (cat) { return cat.slug && cat.slug['en-US']; });
                categoryNames = validCategories.map(function (cat) { return cat.name['en-US']; }).join('\n');
                conversationState[from] = { state: 'awaiting-category-selection' };
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Please choose a category:\n".concat(categoryNames))];
            case 2:
                _h.sent();
                _h.label = 3;
            case 3: return [3 /*break*/, 38];
            case 4:
                if (!(currentState === 'awaiting-category-selection')) return [3 /*break*/, 12];
                return [4 /*yield*/, getCategories()];
            case 5:
                categories = _h.sent();
                selectedCategory = categories.find(function (cat) { return cat.name['en-US'].toLowerCase() === text_1 && cat.slug && cat.slug['en-US']; });
                if (!selectedCategory) return [3 /*break*/, 9];
                return [4 /*yield*/, getProductsByCategoryId(selectedCategory.id)];
            case 6:
                products = _h.sent();
                productNames = products.map(function (prod) { return prod.name['en-US']; }).join('\n');
                conversationState[from] = {
                    state: 'awaiting-product-selection',
                    products: products.map(function (prod) { return ({ name: prod.name['en-US'].toLowerCase(), id: prod.id }); }),
                };
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Here are the products:\n".concat(productNames))];
            case 7:
                _h.sent();
                return [4 /*yield*/, sendMessageToWhatsApp(from, 'Let me know which product you would like more information on.')];
            case 8:
                _h.sent();
                return [3 /*break*/, 11];
            case 9: return [4 /*yield*/, sendMessageToWhatsApp(from, "Category not found. Please select a valid category.")];
            case 10:
                _h.sent();
                _h.label = 11;
            case 11: return [3 /*break*/, 38];
            case 12:
                if (!(currentState === 'awaiting-product-selection')) return [3 /*break*/, 21];
                customerProducts = ((_c = conversationState[from]) === null || _c === void 0 ? void 0 : _c.products) || [];
                selectedProduct = customerProducts.find(function (prod) { return text_1.includes(prod.name); });
                if (!selectedProduct) return [3 /*break*/, 18];
                return [4 /*yield*/, getProductDetailsById(selectedProduct.id)];
            case 13:
                _a = _h.sent(), productDetails = _a.productDetails, price = _a.price;
                productImageUrl = (_f = (_e = (_d = productDetails === null || productDetails === void 0 ? void 0 : productDetails.masterVariant) === null || _d === void 0 ? void 0 : _d.images) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.url;
                if (!productImageUrl) return [3 /*break*/, 15];
                return [4 /*yield*/, sendMediaMessageToWhatsApp(from, productImageUrl, "".concat(selectedProduct.name), price)];
            case 14:
                _h.sent();
                // Update the conversation state for the next expected input
                conversationState[from].state = 'awaiting-add-or-browse';
                return [3 /*break*/, 17];
            case 15: return [4 /*yield*/, sendMessageToWhatsApp(from, "Sorry, I couldn't find an image for this product.")];
            case 16:
                _h.sent();
                _h.label = 17;
            case 17: return [3 /*break*/, 20];
            case 18: return [4 /*yield*/, sendMessageToWhatsApp(from, "Product not found. Please reply with a valid product name.")];
            case 19:
                _h.sent();
                _h.label = 20;
            case 20: return [3 /*break*/, 38];
            case 21:
                if (!(currentState === 'awaiting-add-or-browse')) return [3 /*break*/, 38];
                customerProducts = ((_g = conversationState[from]) === null || _g === void 0 ? void 0 : _g.products) || [];
                selectedProduct = customerProducts.find(function (prod) { return text_1.includes(prod.name); });
                if (!(text_1 === 'add to cart')) return [3 /*break*/, 31];
                if (!selectedProduct) return [3 /*break*/, 28];
                cartId = conversationState[from].cartId;
                if (!!cartId) return [3 /*break*/, 23];
                return [4 /*yield*/, createCart(selectedProduct.id, 1)];
            case 22:
                cart = _h.sent();
                cartId = cart.id;
                conversationState[from].cartId = cartId;
                return [3 /*break*/, 25];
            case 23: 
            // If a cart exists, just add the product to it
            return [4 /*yield*/, addProductToCart(cartId, selectedProduct.id)];
            case 24:
                // If a cart exists, just add the product to it
                _h.sent();
                _h.label = 25;
            case 25: return [4 /*yield*/, getCartContents(cartId)];
            case 26:
                cartContents = _h.sent();
                cartSummary = cartContents.lineItems
                    .map(function (item) { return "".concat(item.name.en, " - Quantity: ").concat(item.quantity); })
                    .join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Product added to cart. Here is your current cart:\n".concat(cartSummary))];
            case 27:
                _h.sent();
                conversationState[from].state = null; // Reset state after adding to cart
                return [3 /*break*/, 30];
            case 28: return [4 /*yield*/, sendMessageToWhatsApp(from, "Product not found for adding to cart.")];
            case 29:
                _h.sent();
                _h.label = 30;
            case 30: return [3 /*break*/, 38];
            case 31:
                if (!(text_1 === 'continue browsing')) return [3 /*break*/, 33];
                currentCategoryProducts = conversationState[from].products || [];
                productNames = currentCategoryProducts.map(function (prod) { return prod.name; }).join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Here are the products:\n".concat(productNames))];
            case 32:
                _h.sent();
                conversationState[from].state = 'awaiting-product-selection';
                return [3 /*break*/, 38];
            case 33:
                if (!(text_1 === 'new category')) return [3 /*break*/, 36];
                return [4 /*yield*/, getCategories()];
            case 34:
                categories = _h.sent();
                validCategories = categories.filter(function (cat) { return cat.slug && cat.slug['en-US']; });
                categoryNames = validCategories.map(function (cat) { return cat.name['en-US']; }).join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Please choose a new category:\n".concat(categoryNames))];
            case 35:
                _h.sent();
                conversationState[from].state = 'awaiting-category-selection';
                return [3 /*break*/, 38];
            case 36: return [4 /*yield*/, sendMessageToWhatsApp(from, 'Please type "Add to cart", "Continue browsing", or "New category".')];
            case 37:
                _h.sent();
                _h.label = 38;
            case 38:
                res.sendStatus(200);
                return [3 /*break*/, 40];
            case 39:
                error_1 = _h.sent();
                console.error("Error processing WhatsApp message:", error_1);
                res.status(500).send("Internal Server Error");
                return [3 /*break*/, 40];
            case 40: return [2 /*return*/];
        }
    });
}); });
// Start the server
app.listen(PORT, function () {
    console.log("Server is running on port ".concat(PORT));
});
// Helper functions
function getCategories() {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.categories().get().execute()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.body.results];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error fetching categories:", error_2);
                    throw new Error("Failed to fetch categories");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getProductsByCategoryId(categoryId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.productProjections()
                            .search()
                            .get({ queryArgs: { "filter.query": "categories.id:\"".concat(categoryId, "\"") } })
                            .execute()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.body.results];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error fetching products:", error_3);
                    throw new Error("Failed to fetch products");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getProductDetailsById(productId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, product, price, error_4;
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    _j.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.productProjections().withId({ ID: productId }).get().execute()];
                case 1:
                    response = _j.sent();
                    product = response.body;
                    price = ((_d = (_c = (_b = (_a = product.masterVariant) === null || _a === void 0 ? void 0 : _a.prices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.value) === null || _d === void 0 ? void 0 : _d.centAmount) / 100 || 'N/A';
                    return [2 /*return*/, {
                            productDetails: product,
                            price: "".concat((_h = (_g = (_f = (_e = product.masterVariant) === null || _e === void 0 ? void 0 : _e.prices) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.value) === null || _h === void 0 ? void 0 : _h.currencyCode, " ").concat(price) // Format price with currency
                        }];
                case 2:
                    error_4 = _j.sent();
                    console.error("Error fetching product details:", error_4);
                    throw new Error("Failed to fetch product details");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createCart(productId_1) {
    return __awaiter(this, arguments, void 0, function (productId, quantity) {
        var response, error_5;
        if (quantity === void 0) { quantity = 1; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.carts().post({
                            body: {
                                currency: 'USD',
                                store: {
                                    typeId: 'store',
                                    key: 'whatsapp'
                                },
                                lineItems: [
                                    {
                                        productId: productId, // Product ID passed in
                                        quantity: quantity, // Default quantity is 1
                                    }
                                ]
                            }
                        }).execute()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.body];
                case 2:
                    error_5 = _a.sent();
                    console.error("Error creating cart:", error_5);
                    throw new Error("Failed to create cart");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function addProductToCart(cartId, productId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.carts().withId({ ID: cartId }).post({
                            body: {
                                version: 1, // Assuming the initial version; you may need to track cart version
                                actions: [{
                                        action: 'addLineItem',
                                        productId: productId
                                    }]
                            }
                        }).execute()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    console.error("Error adding product to cart:", error_6);
                    throw new Error("Failed to add product to cart");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getCartContents(cartId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.carts().withId({ ID: cartId }).get().execute()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.body];
                case 2:
                    error_7 = _a.sent();
                    console.error("Error retrieving cart contents:", error_7);
                    throw new Error("Failed to retrieve cart contents");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function sendMessageToWhatsApp(to, message) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    data = {
                        messaging_product: 'whatsapp',
                        to: to,
                        text: { body: message },
                    };
                    return [4 /*yield*/, axios_1.default.post("https://graph.facebook.com/v17.0/".concat(process.env.PHONE_NUMBER_ID, "/messages"), data, {
                            headers: {
                                Authorization: "Bearer ".concat(process.env.ACCESS_TOKEN),
                                'Content-Type': 'application/json',
                            },
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    console.error("Error sending message to WhatsApp:", error_8);
                    throw new Error("Failed to send message to WhatsApp");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function sendMediaMessageToWhatsApp(to, mediaUrl, productName, price) {
    return __awaiter(this, void 0, void 0, function () {
        var caption, mediaMessage, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    caption = "\nPrice: ".concat(price);
                    mediaMessage = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: to,
                        type: 'image',
                        image: {
                            link: mediaUrl,
                            caption: caption // Pass the caption with product price
                        },
                    };
                    return [4 /*yield*/, axios_1.default.post("https://graph.facebook.com/v17.0/".concat(process.env.PHONE_NUMBER_ID, "/messages"), mediaMessage, {
                            headers: {
                                Authorization: "Bearer ".concat(process.env.ACCESS_TOKEN),
                                'Content-Type': 'application/json',
                            },
                        })];
                case 1:
                    _a.sent();
                    // Add a small delay to ensure the image message is delivered before the prompt
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // Add a small delay to ensure the image message is delivered before the prompt
                    _a.sent();
                    // Send the updated prompt
                    return [4 /*yield*/, sendMessageToWhatsApp(to, 'Add to cart, continue browsing, or new category?')];
                case 3:
                    // Send the updated prompt
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_9 = _a.sent();
                    console.error("Error sending media message or follow-up text:", error_9);
                    throw new Error("Failed to send media and options message");
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Webhook verification
app.get('/webhook', function (req, res) {
    var verifyToken = process.env.VERIFY_TOKEN;
    var mode = req.query['hub.mode'];
    var token = req.query['hub.verify_token'];
    var challenge = req.query['hub.challenge'];
    if (mode && token === verifyToken) {
        res.status(200).send(challenge); // Respond with the challenge to verify webhook
    }
    else {
        res.sendStatus(403); // Forbidden if verification fails
    }
});
