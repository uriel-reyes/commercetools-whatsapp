import fetch from 'node-fetch';
import {
  createApiBuilderFromCtpClient,
} from '@commercetools/platform-sdk';
import {
    ClientBuilder,
    type AuthMiddlewareOptions,
    type HttpMiddlewareOptions
} from '@commercetools/sdk-client-v2';
import 'dotenv/config';

// Access environment variables
const projectKey = process.env.CTP_PROJECT_KEY!;
const clientId = process.env.CTP_CLIENT_ID!;
const clientSecret = process.env.CTP_CLIENT_SECRET!;
const authUrl = process.env.CTP_AUTH_URL!;
const apiUrl = process.env.CTP_API_URL!;
const scopes = process.env.CTP_SCOPES ? process.env.CTP_SCOPES.split(',') : [];

// Setup authentication and HTTP middlewares
const authMiddlewareOptions: AuthMiddlewareOptions = {
    host: authUrl,
    projectKey,
    credentials: {
        clientId,
        clientSecret,
    },
    scopes,
    fetch,
};

const httpMiddlewareOptions: HttpMiddlewareOptions = {
    host: apiUrl,
    fetch,
};

// Create the commercetools client
const ctpClient = new ClientBuilder()
    .withClientCredentialsFlow(authMiddlewareOptions)
    .withHttpMiddleware(httpMiddlewareOptions)
    .withLoggerMiddleware()
    .build();

// Create apiRoot from the commercetools client and include your project key
const apiRoot = createApiBuilderFromCtpClient(ctpClient)
    .withProjectKey({ projectKey });

export default apiRoot;
