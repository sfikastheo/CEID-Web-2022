"use strict";

import { storeInfo, storesFromCategory } from '../dbToNode.mjs';
import { stores } from '../express.mjs';
import express from 'express';

export const routerStores = express.Router();

// Request available Stores
routerStores.get('/', async (req, res) => {
  try {
    const storesData = await stores;
    res.send(JSON.stringify(storesData));
  } catch (error) {
    res.status(500).send('Error 500: Internal server error.');
  }
});

// Request information about a Store based on id:
routerStores.get('/:id', async (req, res) => {
  try {
    const storeId = req.params.id;
    const storeData = await storeInfo(storeId);
    res.send(JSON.stringify(storeData));
  } catch (error) {
    res.status(500).send('Error 500: Internal server error.');
  }
});

routerStores.get('/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const storesData = await storesFromCategory(categoryId);
    res.send(JSON.stringify(storesData));
  } catch (error) {
    res.status(500).send('Error 500: Internal server error.');
  }
});


