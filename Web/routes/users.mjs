'use strict';

import path from 'path';
import * as url from 'url';
import express from 'express';

export const __basename = url.fileURLToPath(new URL('..', import.meta.url));

// Router for the homepage
export const routerUsers = express.Router();

// Serve user-specific files using the express.static middleware
routerUsers.use('/',express.static(path.join( __basename, 'users')));

routerUsers.get('/info', (req, res) => {
  // get the user id from the session
  let userId = req.session.userId;
  
  // based on the user id, get the user info from the database
  // and send it to the frontend

  // Insert  code here later
  
});