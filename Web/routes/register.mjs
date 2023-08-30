'use strict';

import express from 'express';
import { registerUser } from '../dbToNode.mjs';

export const routerRegister = express.Router();

const email_regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
// regex of password: at least 8 letters, 1 uppercase, 1 number:
const password_regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d][A-Za-z\d!@#$%^&*()_+]{7,19}$/gm;

routerRegister.post('/', (req, res) => {
  const { name, email, password } = req.body;

  // These checks are not necessary but they are good practice because
  // an advanced user could bypass the frontend and send a request
  // directly to the backend.

  // Check if all fields are provided
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all fields.' });
  }

  // Check if email is valid
  if (!email_regex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email.' });
  }

  // Check if password is valid
  if (!password_regex.test(password)) {
    return res.status(400).json({
      message: 'Please provide a valid password. Password must contain at least 8 characters and an uppercase letter, a number and a special character.'
    });
  }

  // Everything is valid, register the user
  const registration = registerUser(name, email, password);

  registration.then((result) => {
    if (result.success) {
      res.status(200).json({ message: 'Registration successful' });
    } else {
      res.status(400).json({ message: result.message });
    }
  }).catch((error) => {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  });

});