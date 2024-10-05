"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BuildClient_1 = require("../src/BuildClient");
var getStoreOrders = function () {
    return BuildClient_1.default
        .inStoreKeyWithStoreKeyValue({ storeKey: "data-model-uriel" })
        .orders()
        .get()
        .execute()
        .then(function (response) {
        var orders = response.body.results;
        orders.forEach(function (order) {
            // Assuming the structure of totalPrice is something like: { currencyCode: 'USD', centAmount: 1000 }
            var currency = order.totalPrice.currencyCode;
            var amount = order.totalPrice.centAmount; // Convert to a more standard currency format if needed
            console.log("Order ID: ".concat(order.id, ", Total Price: ").concat(currency, " ").concat(amount));
        });
    });
};
exports.default = getStoreOrders;
