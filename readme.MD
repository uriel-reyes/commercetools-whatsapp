<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a>
</p>

# whatsapp

A sample integration between commercetools and whatsapp. Requires a Facebook business account. Using latest version of commercetools TS SDK.

## Scope and Things to Note

More than anything, this is an excersice to highlight an integration between commercetools and whatsapp. Code does not follow best practices and is made available as-is.
This example focuses on a cart with a single item. Customer information is not collected, shipping address is set as "US" when the cart is created, and we are not collecting payment.

Some things to note:
- When the customer views a product, they are prompted with 3 options "Add to cart", "Continue browsing" (existing category) or "New category".
  - The cart itself is created when the customer requests to view their first product and automatically places that product into the cart. There are very likely better ways to handle this.
  - The 2nd and 3rd options will use an Update Action to remove the line item from the cart
  - "Add to cart" is different. IF the product is added to cart on the initial view, meaning the customer did not want to continue browsing or view a new category, there is an Update Action to silently update the quantity. 
This is required because of how and when the cart is created. Doing this makes it so that the customer only has a single line item and not two. 
- A big issue on this project is related to whatsapp and how their messaging works. There is a lot of logic that has been implemented to prevent duplicate messaging, out of order messaging and more. If someone knows
more about the whatsapp cloud API, please let me know!
- From whatsapp we are using prompts, text and media messaging. 

## Dependencies

- [Node.js](https://nodejs.org/): Required to run JavaScript on the server.
- [npm](https://www.npmjs.com/): Node package manager, used to install:
  - `dotenv`: Loads environment variables from a `.env` file into `process.env`.
  - `typescript`: Adds types to JavaScript, making the code more robust and understandable.
  - `@types/node`: Type definitions for Node.js, required for TypeScript to understand Node.js types.
  - `ngrok`: Used to expose local development server.
  - `express`
  - `axios`


## Usage

To compile TypeScript to JavaScript, use the following command:
`npm run build`

To run the application:
`npm start`

## License

[MIT License](LICENSE)
