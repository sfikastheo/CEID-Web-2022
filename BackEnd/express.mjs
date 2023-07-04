"use strict";
import { storesToGeoJson } from './dbToNode.mjs';
import { routerStores } from './routes/stores.mjs';
import { routerCategories } from './routes/categories.mjs';
import express from 'express';
import * as url from 'url'
import path from 'path';

// 1 day in ms
const ms1d = 86400000

// Query the needed jsons
export let stores = await storesToGeoJson();

// Get the absolut file path
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const __basename = path.join(__dirname,'..');

// Atlernate the port value dynamically based on the process's environment
// export SRV_PORT=8080 ( set for windows )
const port = process.env.SRV_PORT || 3000;

/*============================== Server ============================== */

// Create the express Server Object. By default 4 methods are available:
// put, post, get and delete which corespond to the known HTTP methods
const server = express();

// The server needs to listen to a specified port, we can also  
// pass a callback Function to be executed when the server starts
server.listen(port, () => {
	console.log(`Listening at port ${port}..`);
});

// req -> middleware -> res. That is the definitions of middleware.
// Even functions like .get .post are predefined middleware between
// the req and the res. We can also write custome middleware that can
// either be called with .use(example) or in the call of predefined 
// middleware as callbacks. Every custom middleware must have the 
server.use(express.json());

// Middleware for static files. Basically place static unimportant
// files in a static/public folder that can be accessed automatically
// by the client. The public folder gets scanned, if the asset is 
// found it is returned to the client

server.use(express.static('../public',{
	dotfiles: 'deny',
	maxAge: ms1d,
	etag: true
}));

// Recommendations about the web caching:
// Max-age tells the browser how long it can consider the resource valid,
// meaning that the cached version can be used without checking with the
// server. When that time has expired, the resource is considered stale,
// and a new request has to be made. If the cached resource has an ETag
// ( or Last Modified header) that request can be a conditional one to 
// allow the server to avoid sending the entire resource in the response.
// A Basic reason to avoid web caching is the inability to implement ssr.
// But we dont use any ( ejs for example ) in the first place. 

// Lets create an endpoint for a http get request: url, callback.
// The callback will be executed when we have an HTTP Get request 
// at the specified path. The callback Function is also called
// A Route Handler

// It is important to note that express deals with requests 
// Top down. Meaning that the first handler that matches the 
// request gets executed and after that the request is dismissed
// We can have more than one handler for a specific path but only
// the first will be in use. So it is a better practice to place
// The most common handler in the beggining.

server.use('/api/stores',routerStores);
server.use('/api/categories',routerCategories);

// The use function on the server will be executed
// For every request, if a server.use call is used
// as a route handler and returns a response to the
// client will always be executed. It is paramount
// to be placed last.

// Return 404
server.use((req,res)=>{
	res.status(404)
	.send(`Error 404: '${req.url}' was not found!`);
});

/*============================== Global Middleware ============================== */

// 1. Consider creating a errorhandler middleware
// https://expressjs.com/en/guide/error-handling.html