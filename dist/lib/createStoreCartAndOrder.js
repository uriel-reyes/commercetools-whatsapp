"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStoreCartAndOrder = void 0;
var BuildClient_1 = require("../src/BuildClient");
// Function responsible for creating a cart
var createCart = function () {
    return BuildClient_1.default.carts().post({
        body: {
            currency: "USD",
            store: {
                key: "data-model-uriel",
                typeId: "store"
            },
            lineItems: [
                {
                    sku: "WF-100",
                    quantity: 400,
                    distributionChannel: {
                        key: "data-model-uriel-channel",
                        typeId: "channel"
                    },
                    supplyChannel: {
                        key: "data-model-uriel-channel",
                        typeId: "channel"
                    },
                    inventoryMode: "ReserveOnOrder"
                }
            ],
            shippingAddress: {
                country: "US"
            }
        }
    }).execute();
};
// Function responsible for creating an order from a cart
var createOrder = function (cartId, version) {
    return BuildClient_1.default.orders().post({
        body: {
            version: version,
            cart: {
                typeId: "cart",
                id: cartId
            }
        }
    }).execute();
};
// Function that orchestrates the creation of a cart and then creates an order from that cart
var createStoreCartAndOrder = function () {
    return createCart()
        .then(function (response) {
        var _a = response.body, cartId = _a.id, version = _a.version;
        return createOrder(cartId, version);
    });
};
exports.createStoreCartAndOrder = createStoreCartAndOrder;
