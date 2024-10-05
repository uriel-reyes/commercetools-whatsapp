"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BuildClient_1 = require("../src/BuildClient");
var getObject = function () {
    return BuildClient_1.default
        .products()
        .get({
        queryArgs: {
            limit: 500
        }
    })
        .execute()
        .then(function (response) { return response.body.results; });
};
var getObject2 = function () {
    return BuildClient_1.default
        .customers()
        .get({
        queryArgs: {
        // where: `customerGroup(id="975a3381-3ee8-40c6-b0e5-a64cea868dab")`
        // where:'externalId="123"'
        }
    })
        .execute();
};
