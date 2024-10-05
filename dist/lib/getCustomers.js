"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BuildClient_1 = require("../src/BuildClient");
var getCustomers = function () {
    return BuildClient_1.default.inStoreKeyWithStoreKeyValue({ storeKey: "data-model-uriel" })
        .customers()
        .get()
        .execute()
        .then(function (response) {
        var customerResults = response.body.results;
        console.log(customerResults);
    });
};
exports.default = getCustomers;
