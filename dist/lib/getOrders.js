"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BuildClient_1 = require("../src/BuildClient");
var getOrders = function () {
    return BuildClient_1.default.orders()
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
        // Optionally, you can return something here, such as the orders themselves, if needed.
        return orders;
    })
        .catch(function (error) {
        console.error("Failed to fetch orders:", error);
        // Handle the error appropriately, potentially re-throwing it or returning a default value.
        throw error;
    });
};
exports.default = getOrders;
