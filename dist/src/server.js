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
// Update the conversationState to include lineItemId
var conversationState = {};
// Root route to respond to GET requests at the homepage
app.get('/', function (req, res) {
    res.send('Server is running! Welcome to the WhatsApp & commercetools integration.');
});
// Webhook route for WhatsApp messages
app.post('/webhook', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var body, entry, changes, value, message, from, text_1, currentState, categories, validCategories, categoryNames, categories, selectedCategory, products, productNames, customerProducts, selectedProduct, _a, productDetails, price, productImageUrl, cartId, cartVersion, lineItemId, cart, selectedProduct_1, cartId, cartVersion, lineItemId, cartContents, lineItem, updatedCart, _b, version, lineItemId_1, updatedCartContents, updatedVersion, currentCategoryProducts, productNames, categories, validCategories, categoryNames, cartId, cartVersion, order, error_1, error_2;
    var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    return __generator(this, function (_r) {
        switch (_r.label) {
            case 0:
                _r.trys.push([0, 64, , 65]);
                body = req.body;
                console.log(JSON.stringify(body, null, 2));
                if (!(body.entry && body.entry.length > 0)) return [3 /*break*/, 63];
                entry = body.entry[0];
                if (!(entry.changes && entry.changes.length > 0)) return [3 /*break*/, 63];
                changes = entry.changes[0];
                value = changes.value;
                if (!(value.messages && value.messages.length > 0)) return [3 /*break*/, 63];
                message = value.messages[0];
                if (!(message && message.type === 'text' && message.text && message.text.body)) return [3 /*break*/, 63];
                from = message.from;
                text_1 = message.text.body.toLowerCase();
                currentState = (_c = conversationState[from]) === null || _c === void 0 ? void 0 : _c.state;
                if (!(!currentState || currentState === 'asking-for-category')) return [3 /*break*/, 4];
                if (!(text_1 === 'categories')) return [3 /*break*/, 3];
                return [4 /*yield*/, getCategories()];
            case 1:
                categories = _r.sent();
                validCategories = categories.filter(function (cat) { return cat.slug && cat.slug['en-US']; });
                categoryNames = validCategories.map(function (cat) { return cat.name['en-US']; }).join('\n');
                conversationState[from] = { state: 'awaiting-category-selection' };
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Please choose a category:\n".concat(categoryNames))];
            case 2:
                _r.sent();
                _r.label = 3;
            case 3: return [3 /*break*/, 63];
            case 4:
                if (!(currentState === 'awaiting-category-selection')) return [3 /*break*/, 15];
                return [4 /*yield*/, getCategories()];
            case 5:
                categories = _r.sent();
                selectedCategory = categories.find(function (cat) { return cat.name['en-US'].toLowerCase() === text_1 && cat.slug && cat.slug['en-US']; });
                if (!selectedCategory) return [3 /*break*/, 12];
                return [4 /*yield*/, getProductsByCategoryId(selectedCategory.id)];
            case 6:
                products = _r.sent();
                if (!(products.length > 0)) return [3 /*break*/, 9];
                productNames = products.map(function (prod) { return prod.name['en-US']; }).join('\n');
                conversationState[from] = {
                    state: 'awaiting-product-selection',
                    products: products.map(function (prod) { return ({ name: prod.name['en-US'].toLowerCase(), id: prod.id }); }),
                };
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Here are the products:\n".concat(productNames))];
            case 7:
                _r.sent();
                return [4 /*yield*/, sendMessageToWhatsApp(from, 'Let me know which product you would like more information on.')];
            case 8:
                _r.sent();
                return [3 /*break*/, 11];
            case 9: return [4 /*yield*/, sendMessageToWhatsApp(from, "Sorry, there are no products available in this category.")];
            case 10:
                _r.sent();
                _r.label = 11;
            case 11: return [3 /*break*/, 14];
            case 12: return [4 /*yield*/, sendMessageToWhatsApp(from, "Category not found. Please select a valid category.")];
            case 13:
                _r.sent();
                _r.label = 14;
            case 14: return [3 /*break*/, 63];
            case 15:
                if (!(currentState === 'awaiting-product-selection')) return [3 /*break*/, 26];
                customerProducts = ((_d = conversationState[from]) === null || _d === void 0 ? void 0 : _d.products) || [];
                selectedProduct = customerProducts.find(function (prod) { return text_1.includes(prod.name); });
                if (!selectedProduct) return [3 /*break*/, 23];
                return [4 /*yield*/, getProductDetailsById(selectedProduct.id)];
            case 16:
                _a = _r.sent(), productDetails = _a.productDetails, price = _a.price;
                productImageUrl = (_g = (_f = (_e = productDetails === null || productDetails === void 0 ? void 0 : productDetails.masterVariant) === null || _e === void 0 ? void 0 : _e.images) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.url;
                if (!productImageUrl) return [3 /*break*/, 20];
                cartId = conversationState[from].cartId;
                cartVersion = conversationState[from].cartVersion;
                lineItemId = void 0;
                if (!!cartId) return [3 /*break*/, 18];
                return [4 /*yield*/, createCart(selectedProduct.id, 1)];
            case 17:
                cart = _r.sent();
                cartId = cart.id;
                cartVersion = cart.version; // Capture the cart version for future updates
                lineItemId = (_j = (_h = cart.lineItems) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.id; // Capture the lineItemId from the cart
                conversationState[from].cartId = cartId;
                conversationState[from].cartVersion = cartVersion;
                conversationState[from].lineItemId = lineItemId;
                conversationState[from].selectedProduct = selectedProduct;
                _r.label = 18;
            case 18: return [4 /*yield*/, sendMediaMessageToWhatsApp(from, productImageUrl, "".concat(selectedProduct.name), price)];
            case 19:
                _r.sent();
                conversationState[from].state = 'awaiting-add-or-browse';
                return [3 /*break*/, 22];
            case 20: return [4 /*yield*/, sendMessageToWhatsApp(from, "Sorry, I couldn't find an image for this product.")];
            case 21:
                _r.sent();
                _r.label = 22;
            case 22: return [3 /*break*/, 25];
            case 23: return [4 /*yield*/, sendMessageToWhatsApp(from, "Product not found. Please reply with a valid product name.")];
            case 24:
                _r.sent();
                _r.label = 25;
            case 25: return [3 /*break*/, 63];
            case 26:
                if (!(currentState === 'awaiting-add-or-browse')) return [3 /*break*/, 51];
                selectedProduct_1 = (_k = conversationState[from]) === null || _k === void 0 ? void 0 : _k.selectedProduct;
                cartId = (_l = conversationState[from]) === null || _l === void 0 ? void 0 : _l.cartId;
                cartVersion = (_m = conversationState[from]) === null || _m === void 0 ? void 0 : _m.cartVersion;
                lineItemId = (_o = conversationState[from]) === null || _o === void 0 ? void 0 : _o.lineItemId;
                if (!(text_1 === 'add to cart')) return [3 /*break*/, 39];
                if (!(selectedProduct_1 && cartId)) return [3 /*break*/, 36];
                return [4 /*yield*/, getCartContents(cartId)];
            case 27:
                cartContents = _r.sent();
                lineItem = cartContents.lineItems.find(function (item) { return item.productId === selectedProduct_1.id; });
                if (!lineItem) return [3 /*break*/, 29];
                return [4 /*yield*/, changeLineItemQuantity(cartId, lineItem.id, 1, conversationState[from].cartVersion)];
            case 28:
                updatedCart = _r.sent();
                conversationState[from].cartVersion = updatedCart.version;
                return [3 /*break*/, 32];
            case 29: return [4 /*yield*/, addProductToCart(cartId, selectedProduct_1.id, conversationState[from].cartVersion)];
            case 30:
                _b = _r.sent(), version = _b.version, lineItemId_1 = _b.lineItemId;
                // Update conversation state with new cart version and line item ID
                conversationState[from].cartVersion = version;
                conversationState[from].lineItemId = lineItemId_1;
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Product added to your cart.")];
            case 31:
                _r.sent();
                _r.label = 32;
            case 32: return [4 /*yield*/, getCartContents(cartId)];
            case 33:
                updatedCartContents = _r.sent();
                return [4 /*yield*/, sendMessageToWhatsApp(from, "You now have ".concat(updatedCartContents.totalLineItemQuantity, " product(s) in your cart with a total of ").concat(updatedCartContents.totalPrice.centAmount / 100, " USD."))];
            case 34:
                _r.sent();
                // Ask if the customer wants to place the order
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Would you like to place the order? Reply with 'Yes' to confirm.")];
            case 35:
                // Ask if the customer wants to place the order
                _r.sent();
                // Set the state to awaiting-order-confirmation
                conversationState[from].state = 'awaiting-order-confirmation';
                return [3 /*break*/, 38];
            case 36: return [4 /*yield*/, sendMessageToWhatsApp(from, "Product not found for adding to cart.")];
            case 37:
                _r.sent();
                _r.label = 38;
            case 38: return [3 /*break*/, 50];
            case 39:
                if (!(text_1 === 'continue browsing')) return [3 /*break*/, 45];
                if (!(cartId && conversationState[from].lineItemId)) return [3 /*break*/, 42];
                return [4 /*yield*/, removeLineItemFromCart(cartId, conversationState[from].lineItemId, conversationState[from].cartVersion)];
            case 40:
                updatedVersion = _r.sent();
                // Update the conversation state with the new cart version
                conversationState[from].cartVersion = updatedVersion;
                currentCategoryProducts = conversationState[from].products || [];
                productNames = currentCategoryProducts.map(function (prod) { return prod.name; }).join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Here are the products:\n".concat(productNames))];
            case 41:
                _r.sent();
                conversationState[from].state = 'awaiting-product-selection';
                return [3 /*break*/, 44];
            case 42: return [4 /*yield*/, sendMessageToWhatsApp(from, "No product found in the cart to remove.")];
            case 43:
                _r.sent();
                _r.label = 44;
            case 44: return [3 /*break*/, 50];
            case 45:
                if (!(text_1 === 'new category')) return [3 /*break*/, 48];
                return [4 /*yield*/, getCategories()];
            case 46:
                categories = _r.sent();
                validCategories = categories.filter(function (cat) { return cat.slug && cat.slug['en-US']; });
                categoryNames = validCategories.map(function (cat) { return cat.name['en-US']; }).join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Please choose a new category:\n".concat(categoryNames))];
            case 47:
                _r.sent();
                conversationState[from].state = 'awaiting-category-selection';
                return [3 /*break*/, 50];
            case 48: return [4 /*yield*/, sendMessageToWhatsApp(from, 'Please type "Add to cart", "Continue browsing", or "New category".')];
            case 49:
                _r.sent();
                _r.label = 50;
            case 50: return [3 /*break*/, 63];
            case 51:
                if (!(currentState === 'awaiting-order-confirmation')) return [3 /*break*/, 63];
                cartId = (_p = conversationState[from]) === null || _p === void 0 ? void 0 : _p.cartId;
                if (!(text_1.toLowerCase() === 'yes' && cartId)) return [3 /*break*/, 61];
                cartVersion = (_q = conversationState[from]) === null || _q === void 0 ? void 0 : _q.cartVersion;
                if (!(cartId && cartVersion)) return [3 /*break*/, 58];
                _r.label = 52;
            case 52:
                _r.trys.push([52, 55, , 57]);
                return [4 /*yield*/, createOrder(cartId, cartVersion)];
            case 53:
                order = _r.sent();
                // Notify customer of the successful order
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Your order has been placed successfully! Your order ID is ".concat(order.id, "."))];
            case 54:
                // Notify customer of the successful order
                _r.sent();
                conversationState[from].state = null; // Reset the conversation state
                return [3 /*break*/, 57];
            case 55:
                error_1 = _r.sent();
                // Handle any error from the order creation
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Sorry, we couldn't place your order. Please try again.")];
            case 56:
                // Handle any error from the order creation
                _r.sent();
                console.error("Error placing order:", error_1);
                return [3 /*break*/, 57];
            case 57: return [3 /*break*/, 60];
            case 58: return [4 /*yield*/, sendMessageToWhatsApp(from, "Cart information is missing. Unable to place the order.")];
            case 59:
                _r.sent();
                _r.label = 60;
            case 60: return [3 /*break*/, 63];
            case 61: return [4 /*yield*/, sendMessageToWhatsApp(from, "Order not confirmed. Please type 'Yes' if you'd like to place the order.")];
            case 62:
                _r.sent();
                _r.label = 63;
            case 63:
                res.sendStatus(200);
                return [3 /*break*/, 65];
            case 64:
                error_2 = _r.sent();
                console.error("Error processing WhatsApp message:", error_2);
                res.status(500).send("Internal Server Error");
                return [3 /*break*/, 65];
            case 65: return [2 /*return*/];
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
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.categories().get().execute()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.body.results];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error fetching categories:", error_3);
                    throw new Error("Failed to fetch categories");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getProductsByCategoryId(categoryId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_4;
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
                    error_4 = _a.sent();
                    console.error("Error fetching products:", error_4);
                    throw new Error("Failed to fetch products");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getProductDetailsById(productId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, product, usdPrice, price, error_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.productProjections().withId({ ID: productId }).get().execute()];
                case 1:
                    response = _c.sent();
                    product = response.body;
                    usdPrice = (_b = (_a = product.masterVariant) === null || _a === void 0 ? void 0 : _a.prices) === null || _b === void 0 ? void 0 : _b.find(function (price) { return price.value.currencyCode === 'USD'; });
                    price = usdPrice ? (usdPrice.value.centAmount / 100).toFixed(2) : 'N/A';
                    return [2 /*return*/, {
                            productDetails: product,
                            price: "USD ".concat(price) // Always return the price formatted in USD
                        }];
                case 2:
                    error_5 = _c.sent();
                    console.error("Error fetching product details:", error_5);
                    throw new Error("Failed to fetch product details");
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Create cart function now returns the cart version and ID
function createCart(productId_1) {
    return __awaiter(this, arguments, void 0, function (productId, quantity) {
        var response, error_6;
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
                                ],
                                shippingAddress: {
                                    country: "US"
                                }
                            }
                        }).execute()];
                case 1:
                    response = _a.sent();
                    console.log("Cart created successfully with ID:", response.body.id);
                    console.log("Cart version:", response.body.version);
                    return [2 /*return*/, response.body]; // Return both the cart ID and version
                case 2:
                    error_6 = _a.sent();
                    console.error("Error creating cart:", error_6.response ? error_6.response.data : error_6.message);
                    throw new Error("Failed to create cart");
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Helper function to remove a line item from the cart with version tracking
function removeLineItemFromCart(cartId, lineItemId, version) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.carts().withId({ ID: cartId }).post({
                            body: {
                                version: version, // Use the current cart version
                                actions: [{
                                        action: 'removeLineItem',
                                        lineItemId: lineItemId
                                    }]
                            }
                        }).execute()];
                case 1:
                    response = _a.sent();
                    console.log("Removed product ".concat(lineItemId, " from cart ").concat(cartId, ". New version: ").concat(response.body.version));
                    // Return the updated cart version
                    return [2 /*return*/, response.body.version];
                case 2:
                    error_7 = _a.sent();
                    console.error("Error removing product from cart:", error_7.response ? error_7.response.data : error_7.message);
                    throw new Error("Failed to remove product from cart");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function addProductToCart(cartId, productId, version) {
    return __awaiter(this, void 0, void 0, function () {
        var response, newLineItemId, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.carts().withId({ ID: cartId }).post({
                            body: {
                                version: version, // Pass the current version of the cart
                                actions: [{
                                        action: 'addLineItem',
                                        productId: productId
                                    }]
                            }
                        }).execute()];
                case 1:
                    response = _a.sent();
                    console.log("Product added to cart. Cart ID: ".concat(cartId));
                    console.log("Updated Cart:", response.body.lineItems);
                    newLineItemId = response.body.lineItems[response.body.lineItems.length - 1].id;
                    return [2 /*return*/, { version: response.body.version, lineItemId: newLineItemId }];
                case 2:
                    error_8 = _a.sent();
                    console.error("Error adding product to cart:", error_8.response ? error_8.response.data : error_8.message);
                    throw new Error("Failed to add product to cart");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function changeLineItemQuantity(cartId, lineItemId, quantity, version) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.carts().withId({ ID: cartId }).post({
                            body: {
                                version: version,
                                actions: [{
                                        action: 'changeLineItemQuantity',
                                        lineItemId: lineItemId,
                                        quantity: quantity
                                    }]
                            }
                        }).execute()];
                case 1:
                    response = _a.sent();
                    console.log("Updated quantity of line item ".concat(lineItemId, " in cart ").concat(cartId, " to ").concat(quantity, "."));
                    return [2 /*return*/, response.body]; // Return the updated cart
                case 2:
                    error_9 = _a.sent();
                    console.error("Error changing line item quantity:", error_9.response ? error_9.response.data : error_9.message);
                    throw new Error("Failed to change line item quantity");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getCartContents(cartId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.carts().withId({ ID: cartId }).get().execute()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.body];
                case 2:
                    error_10 = _a.sent();
                    console.error("Error retrieving cart contents:", error_10);
                    throw new Error("Failed to retrieve cart contents");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createOrder(cartId, cartVersion) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.orders().post({
                            body: {
                                cart: {
                                    id: cartId,
                                    typeId: 'cart'
                                },
                                version: cartVersion
                            }
                        }).execute()];
                case 1:
                    response = _a.sent();
                    console.log("Order created successfully with ID: ".concat(response.body.id));
                    return [2 /*return*/, response.body]; // Return order object
                case 2:
                    error_11 = _a.sent();
                    console.error("Error creating order:", error_11.response ? error_11.response.data : error_11.message);
                    throw new Error("Failed to create order");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function sendMessageToWhatsApp(to, message) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_12;
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
                    error_12 = _a.sent();
                    console.error("Error sending message to WhatsApp:", error_12);
                    throw new Error("Failed to send message to WhatsApp");
                case 3: return [2 /*return*/];
            }
        });
    });
}
function sendMediaMessageToWhatsApp(to, mediaUrl, productName, price) {
    return __awaiter(this, void 0, void 0, function () {
        var caption, mediaMessage, error_13;
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
                    error_13 = _a.sent();
                    console.error("Error sending media message or follow-up text:", error_13);
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
