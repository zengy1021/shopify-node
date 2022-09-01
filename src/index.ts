// src/index.ts
import express from 'express';
import {Shopify,  ApiVersion,LATEST_API_VERSION ,AuthQuery} from '@shopify/shopify-api';
require('dotenv').config();

const app = express();

const { API_KEY, API_SECRET_KEY, SCOPES, SHOP, HOST, HOST_SCHEME } = process.env;

Shopify.Context.initialize({
  API_KEY,
  API_SECRET_KEY,
  SCOPES: [SCOPES],
  HOST_NAME: HOST.replace(/https?:\/\//, ""),
  HOST_SCHEME,
  IS_EMBEDDED_APP: true,
  API_VERSION: LATEST_API_VERSION, // all supported versions are available, as well as "unstable" and "unversioned"
});
// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS: { [key: string]: string | undefined } = {};

// the rest of the example code goes here

app.get("/", async (req, res) => {
  console.log('ACTIVE_SHOPIFY_SHOPS',ACTIVE_SHOPIFY_SHOPS);
  
   // This shop hasn't been seen yet, go through OAuth to create a session
  if (ACTIVE_SHOPIFY_SHOPS[SHOP] === undefined) {
     // not logged in, redirect to login
    res.redirect(`/login`);
  } else {
    res.send("Hello world!");
    // Load your app skeleton page with App Bridge, and do something amazing!
    res.end();
  }
});

app.get('/login', async (req, res) => {
  console.log('SHOP',SHOP);
  
  let authRoute = await Shopify.Auth.beginAuth(
    req,
    res,
    SHOP,
    '/auth/callback',
    false,
  );
  console.log('authRoute',authRoute);
  
  return res.redirect(authRoute);
});
app.get('/auth/callback', async (req, res) => {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query as unknown as AuthQuery,
    ); // req.query must be cast to unkown and then AuthQuery in order to be accepted
    ACTIVE_SHOPIFY_SHOPS[SHOP] = session.scope;
    await Shopify.Webhooks.Registry.registerAll({
      shop: session.shop,
      accessToken: session.accessToken,
    });
    console.log(session.accessToken);
  } catch (error) {
    console.error(error); // in practice these should be handled more gracefully
  }
  return res.redirect(`/?host=${req.query.host}&shop=${req.query.shop}`); // wherever you want your user to end up after OAuth completes
});
app.get('/getUserInfo', async (req, res) => {
  const session = await Shopify.Utils.loadCurrentSession(req, res);
  console.log('session',session);
  
  const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
  const response = await client.get({
    path: 'products',
  });
  console.log('response',response);
  res.send(response);
  
});

// Example expected type for the response body
// interface MyResponseBodyType {
//   products: { name: 'test' }
// }

// // Load the current session to get the `accessToken`.
// const session = await Shopify.Utils.loadCurrentSession(req, res);
// // Create a new client for the specified shop.
// const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
// // Use `client.get` to request the specified Shopify REST API endpoint, in this case `products`.
// const response = await client.get<MyResponseBodyType>({
//   path: 'products',
// });

// // response.body will be of type MyResponseBodyType
// response.body.products...

app.listen(3000, () => {
  console.log('your app is now listening on port 3000');
});