"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BuildClient_1 = require("../src/BuildClient");
var createCustomer = function () {
    return BuildClient_1.default
        .customers()
        .post({
        body: {
            email: "Erin@test.com",
            password: "123",
            isEmailVerified: true,
            firstName: "Erin",
            lastName: "Rodgers"
        }
    })
        .execute();
};
exports.default = createCustomer;
