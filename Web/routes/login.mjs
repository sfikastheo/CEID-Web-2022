'use strict';

import express from 'express';
import { validateLogin, isAdmin } from '../dbToNode.mjs';

export const routerLogin = express.Router();

const email_regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
// regex of password: at least 8 letters, 1 uppercase, 1 number:
const password_regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;

routerLogin.post('/', (req, res) => {
  const { email, password } = req.body;

  // These checks are not necessary but they are good practice because
  // an advanced user could bypass the frontend and send a request
  // directly to the backend.

  // Check if both fields are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }
  // Check if password is valid
  if (!password_regex.test(password)) {
    return res.status(400).json({
      message: 'Please provide a valid password. Password must contain at least 8 characters and an uppercase letter, a number and a special character.'
    });
  }

  // Check if email is used, if not check with username
  const type = String(email).toLowerCase().match(email_regex);
  let validation = validateLogin(email.toLowerCase(), password, type);

  validation.then((result) => {
    if (result.success) {
      // Create a session & Cookie
      req.session.userId = result.userId;
      res.cookie('authToken', req.sessionID, {
        maxAge: 60000,
        sameSite: "None",
        secure: false,
      });
      
      //Check if user is admin
      let admin = isAdmin(result.userId);
      admin.then((result2) => {
        if (result2.admin_access){
          req.session.adminpriv = true;
          //console.log("adminpriv variable in session: "+req.session.adminpriv);
          res.status(200).json({message: ' ', admin: true});
        }
        else {
          req.session.adminpriv = false;
          res.status(200).json({ message: 'Login successful'});
        }
      })
    }
    else {
      res.status(401).json({ message: result.message });
    }
  }).catch((error) => {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  });

});

