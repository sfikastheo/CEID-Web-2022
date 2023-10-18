'use strict';

import { categories } from '../express.mjs';
import { subcategories } from '../dbToNode.mjs';
import { routerProducts } from './products.mjs';
import express from 'express';

export const routerCategories = express.Router();

routerCategories.get('/', async (req, res) => {
  try {
    const result = await categories;
    res.send(result);
  } catch (error) {
    console.error('Error in routerCategories:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});

routerCategories.get('/:id/subcategories', async (req, res) => {
  try {
    const categoryId = req.params.id; // Get the category ID from the URL parameters
    const result = await subcategories(categoryId); // Fetch subcategories based on the category ID

    res.send(result);
  } catch (error) {
    console.error('Error in routerCategories:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});

routerCategories.use('/subcategories', routerProducts);