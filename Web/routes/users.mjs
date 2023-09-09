'use strict';

import path from 'path';
import * as url from 'url';
import express from 'express';

import { getUserInfo } from '../dbToNode.mjs';

export const __basename = url.fileURLToPath(new URL('..', import.meta.url));

// Router for the homepage
export const routerUsers = express.Router();

// Serve user-specific files using the express.static middleware
routerUsers.use('/', express.static(path.join(__basename, 'users')));

routerUsers.get('/username', (req, res) => {
  // get the user id from the session
  let userId = req.session.userId;

  // Call getUserInfo and just return the username
  let userInfo = getUserInfo(userId);

  userInfo.then((result) => {
    if (result.success) {
      res.send(JSON.stringify(result.userInfo.username));
    } else {
      res.status(401).json({ message: result.message });
    }
  }).catch((error) => {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  });
});

routerUsers.get('/info', async (req, res) => {
  let userId = req.session.userId;
  let userInfo = getUserInfo(userId);
  console.log("This from the info", userInfo);

  userInfo.then((result) => {
    if (result.success) {
      res.status(200).json(result);
    }
    else {
      res.status(401).json({ message: result.message });
    }
  }).catch((error) => {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  });
});

routerUsers.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('authToken');
  res.redirect('/login.html');
});