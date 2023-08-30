'use strict';

import { categories } from '../express.mjs';
import express from 'express';

export const routerCategories = express.Router();

routerCategories.get('/', async (req, res) => {
  try {
    const result = await categories;
    res.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error in routerCategories:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});