"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch");
var platform_sdk_1 = require("@commercetools/platform-sdk");
var sdk_client_v2_1 = require("@commercetools/sdk-client-v2");
require("dotenv/config");
// Access environment variables
var projectKey = process.env.CTP_PROJECT_KEY;
var clientId = process.env.CTP_CLIENT_ID;
var clientSecret = process.env.CTP_CLIENT_SECRET;
var authUrl = process.env.CTP_AUTH_URL;
var apiUrl = process.env.CTP_API_URL;
var scopes = process.env.CTP_SCOPES ? process.env.CTP_SCOPES.split(',') : [];
// Setup authentication and HTTP middlewares
var authMiddlewareOptions = {
    host: authUrl,
    projectKey: projectKey,
    credentials: {
        clientId: clientId,
        clientSecret: clientSecret,
    },
    scopes: scopes,
    fetch: node_fetch_1.default,
};
var httpMiddlewareOptions = {
    host: apiUrl,
    fetch: node_fetch_1.default,
};
// Create the commercetools client
var ctpClient = new sdk_client_v2_1.ClientBuilder()
    .withClientCredentialsFlow(authMiddlewareOptions)
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();
// Create apiRoot from the commercetools client and include your project key
var apiRoot = (0, platform_sdk_1.createApiBuilderFromCtpClient)(ctpClient)
    .withProjectKey({ projectKey: projectKey });
exports.default = apiRoot;
