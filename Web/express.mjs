"use strict";

// Import the needed modules
import * as url from 'url'
import express from 'express';
import session from 'express-session';

// Import the needed routes
import { routerLogin } from './routes/login.mjs';
import { routerRegister } from './routes/register.mjs';
import { routerUsers } from './routes/users.mjs';
import { routerStores } from './routes/stores.mjs';
import { routerCategories } from './routes/categories.mjs';

// Import the needed functions
import { storesToGeoJson, tableInfo } from './dbToNode.mjs';

/*=============================== Misc =============================== */

// Get the absolut file path
export const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/*======================= Load Static Resources ======================= */

export let stores = storesToGeoJson();
export let categories = tableInfo('categories', ['*']);

/*========================= Custom Middlewear ========================= */

// Authorization middleware
export function auth(req, res, next) {
	if (req.session.userId) {
		// Update the cookie's max age to extend the session validity
    res.cookie("authToken", req.sessionID, {
			maxAge: 60000,
			sameSite: "None",
			secure: true,
		});

		next(); // User is authenticated, continue to the next middleware/route
	} else {
    res.status(401) // User is not authenticated,
		res.redirect('/login.html'); // redirect to the login page
	}
}

// 1. Consider creating a errorhandler middleware
// https://expressjs.com/en/guide/error-handling.html

/*============================== Server ============================== */

// Create the express Server Object. By default 4 methods are available:
// put, post, get and delete which corespond to the known HTTP methods
const server = express();

// req -> middleware -> res. That is the definitions of middleware.
// Even functions like .get .post are predefined middleware between
// the req and the res. We can also write custom middleware that can
// either be called with .use(example) or in the call of predefined 
// middleware as callbacks.

// express.json is a middleware that parses the incoming request body
// as json and populates the req.body property with the parsed data.
server.use(express.json());

// Middleware for static files. Basically place static unimportant
// files in a static/public folder that can be accessed automatically
// by the client. The public folder gets scanned, if the asset is 
// found it is returned to the client. 

// The maxAge property is used to set the max-age header in the response
// in order to tell the client how long it can consider the resource valid
// without checking with the server.
// In case maxAge has been passed, The etag property is used to set the
// etag header in the response in order to tell the client that the resource
// has an etag and that the client can make a conditional request to the
// server to check if the resource has been modified. If the resource has
// not been modified the server will respond with a 304 status code and
// the client will use the cached version of the resource.
server.use(express.static('public', {
	dotfiles: 'deny',
	maxAge: 86400000,	// 1 day in ms
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

// Session middleware.
// The session middleware is used to create a session object on the req
// object. The session object is used to store data that is specific to
// a client. The session object is stored in the server and is identified
// by a session id. The session id is stored in a cookie on the client.
// The cookie is sent to the server with every request and the server
// uses it to identify the session object.

server.use(
	session({
		secret: "haggle_secret",	// Used to sign the session id cookie
		secure: false, 	// Set to true if you are using https protocol
		// Since we are just testing we are using http
		// Recommended to be set to true in production
		resave: false,	// Resave the session object even if nothing
		// has changed. Recommended to be set to false
		saveUninitialized: false, // Session object will be created
		// on successful login
		rolling: true,	// Reset the session maxAge on every request,
		// ON the server side only.
		cookie: { maxAge: 3600000 },	// 1 hour in ms
	})
);


// Atlernate the port value dynamically based on the process's environment
// export SRV_PORT=8080 ( set for windows )
const port = process.env.SRV_PORT || 3000;

// The server needs to listen to a specified port, we can also  
// pass a callback Function to be executed when the server starts
server.listen(port, () => {
	console.log(`Listening at port ${port}..`);
});

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

// Send login page
server.get('/', (req, res) => {
	res.redirect('/login.html');
});

server.use('/api/login', routerLogin);
server.use('/api/register',routerRegister);

server.use('/api/stores', auth, routerStores);
server.use('/api/categories', auth, routerCategories);

server.use('/users/', auth, routerUsers);

// The use function on the server will be executed
// For every request, if a server.use call is used
// as a route handler and returns a response to the
// client will always be executed. It is paramount
// to be placed last.

// Return 404
server.use((req, res) => {
	res.status(404)
		.send(`Error 404: '${req.url}' was not found!`);
});
