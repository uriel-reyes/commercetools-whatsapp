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
// Root route to respond to GET requests at the homepage
app.get('/', function (req, res) {
    res.send('Server is running! Welcome to the WhatsApp & commercetools integration.');
});
// Webhook route for WhatsApp messages
app.post('/webhook', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var body, message, from, text_1, categories, categoryNames, categories, selectedCategory, products, productNames, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                body = req.body;
                message = body.entry[0].changes[0].value.messages[0];
                from = message.from;
                text_1 = message.text.body;
                if (!(text_1.toLowerCase() === 'categories')) return [3 /*break*/, 3];
                return [4 /*yield*/, getCategories()];
            case 1:
                categories = _a.sent();
                categoryNames = categories.map(function (cat) { return cat.name.en; }).join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Please choose a category:\n".concat(categoryNames))];
            case 2:
                _a.sent();
                return [3 /*break*/, 9];
            case 3: return [4 /*yield*/, getCategories()];
            case 4:
                categories = _a.sent();
                selectedCategory = categories.find(function (cat) { return cat.name.en.toLowerCase() === text_1.toLowerCase(); });
                if (!selectedCategory) return [3 /*break*/, 7];
                return [4 /*yield*/, getProductsByCategory(selectedCategory.id)];
            case 5:
                products = _a.sent();
                productNames = products.map(function (prod) { return prod.name.en; }).join('\n');
                return [4 /*yield*/, sendMessageToWhatsApp(from, "Here are the products:\n".concat(productNames))];
            case 6:
                _a.sent();
                return [3 /*break*/, 9];
            case 7: return [4 /*yield*/, sendMessageToWhatsApp(from, "Category not found. Please select a valid category.")];
            case 8:
                _a.sent();
                _a.label = 9;
            case 9:
                res.status(200).send('Message processed');
                return [3 /*break*/, 11];
            case 10:
                error_1 = _a.sent();
                console.error("Error processing WhatsApp message:", error_1);
                res.status(500).send("Internal Server Error");
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
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
function getProductsByCategory(categoryId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, BuildClient_1.default.products()
                            .get({ queryArgs: { where: "categories(id=\"".concat(categoryId, "\")") } })
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
function sendMessageToWhatsApp(to, message) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_4;
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
                    error_4 = _a.sent();
                    console.error("Error sending message to WhatsApp:", error_4);
                    throw new Error("Failed to send message to WhatsApp");
                case 3: return [2 /*return*/];
            }
        });
    });
}
app.get('/webhook', function (req, res) {
    var verifyToken = process.env.VERIFY_TOKEN; // Set this in .env
    var mode = req.query['hub.mode'];
    var token = req.query['hub.verify_token'];
    var challenge = req.query['hub.challenge'];
    console.log("mode: ".concat(mode));
    console.log("token: ".concat(token));
    console.log("challenge: ".concat(challenge));
    console.log("verifyToken: ".concat(verifyToken));
    if (mode && token === verifyToken) {
        res.status(200).send(challenge); // Respond with the challenge to verify webhook
    }
    else {
        res.sendStatus(403); // Forbidden if verification fails
    }
});
