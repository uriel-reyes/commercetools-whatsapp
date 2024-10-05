"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCartAndOrder = void 0;
var BuildClient_1 = require("../src/BuildClient");
// Function to create an order from a cart
var createOrder = function (cartId, version) {
    return BuildClient_1.default
        .orders()
        .post({
        body: {
            version: version,
            cart: {
                typeId: "cart",
                id: cartId
            }
        }
    })
        .execute();
};
// Function to create a cart and then create an order from that cart
var createCartAndOrder = function () {
    return BuildClient_1.default
        .carts()
        .post({
        body: {
            currency: "USD",
            customLineItems: [
                {
                    "name": { "en": "Custom" },
                    "money": { "currencyCode": "USD", "centAmount": 1500 },
                    "slug": "customSlug",
                    "taxCategory": { "typeId": "tax-category", "id": "9b32c54d-8c46-40d4-8e2a-766c3eab9113" },
                    "priceMode": "Standard"
                }
            ],
            customerId: "de4afab8-5303-4563-99b8-55c91232ab7e",
            shippingAddress: { country: "US" }
        }
    })
        .execute()
        .then(function (response) {
        var cartId = response.body.id;
        var version = response.body.version;
        return createOrder(cartId, version);
    });
};
exports.createCartAndOrder = createCartAndOrder;
