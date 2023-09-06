'use strict';

import express from 'express';
import { products } from '../dbToNode.mjs';

export const routerProducts = express.Router();

routerProducts.get('/:id', async (req, res) => {});

routerProducts.get('/:subcategoryId/products', async (req, res) => {
  try {
    const subcategoryId = req.params.subcategoryId;
    const result = await products(subcategoryId);
    res.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error in routerProducts:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});