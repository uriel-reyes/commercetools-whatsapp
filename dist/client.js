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
exports.whatsappWebhook = void 0;
var axios_1 = require("axios");
var BuildClient_1 = require("./src/BuildClient");
var dotenv = require("dotenv");
dotenv.config();
// Get Categories from commercetools
function getCategories() {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.categories().get().execute()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.body.results]; // List of categories
                case 2:
                    error_1 = _a.sent();
                    console.error("Error fetching categories:", error_1);
                    throw new Error("Failed to fetch categories");
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Get Products by Category ID
function getProductsByCategory(categoryId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.products()
                            .get({ queryArgs: { where: "categories(id=\"".concat(categoryId, "\")") } })
                            .execute()];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.body.results]; // List of products
                case 2:
                    error_2 = _a.sent();
                    console.error("Error fetching products:", error_2);
                    throw new Error("Failed to fetch products");
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Send message to WhatsApp
function sendMessageToWhatsApp(to, message) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_3;
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
                    error_3 = _a.sent();
                    console.error("Error sending message to WhatsApp:", error_3);
                    throw new Error("Failed to send message to WhatsApp");
                case 3: return [2 /*return*/];
            }
        });
    });
}
// WhatsApp Webhook Function
var whatsappWebhook = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var message, from, body_1, categories, categoryNames, selectedCategory, products, productNames, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 10]);
                message = req.body.entry[0].changes[0].value.messages[0];
                from = message.from;
                body_1 = message.text.body;
                return [4 /*yield*/, getCategories()];
            case 1:
                categories = _a.sent();
                if (!(body_1.toLowerCase() === 'categories')) return [3 /*break*/, 3];
                categoryNames = categories.map(function (cat) { return cat.name.en; }).join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Please choose a category:\n".concat(categoryNames))];
            case 2:
                _a.sent();
                return [3 /*break*/, 8];
            case 3:
                selectedCategory = categories.find(function (cat) { return cat.name.en.toLowerCase() === body_1.toLowerCase(); });
                if (!selectedCategory) return [3 /*break*/, 6];
                return [4 /*yield*/, getProductsByCategory(selectedCategory.id)];
            case 4:
                products = _a.sent();
                productNames = products.map(function (prod) { return prod.name.en; }).join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Here are the products:\n".concat(productNames))];
            case 5:
                _a.sent();
                return [3 /*break*/, 8];
            case 6: return [4 /*yield*/, sendMessageToWhatsApp(from, "Category not found. Please select a valid category.")];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8:
                res.status(200).send('Message processed');
                return [3 /*break*/, 10];
            case 9:
                error_4 = _a.sent();
                console.error("Error in WhatsApp webhook:", error_4);
                res.status(500).send("Internal Server Error");
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.whatsappWebhook = whatsappWebhook;
