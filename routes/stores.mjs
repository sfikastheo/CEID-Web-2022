"use strict";

import { storeInfo, storesFromCategory } from '../dbToNode.mjs';
import { stores } from '../express.mjs';
import express from 'express';

export const routerStores = express.Router();

// Request available Stores
routerStores.get('/', async (req, res) => {
  try {
    const storesData = await stores;
    res.send(storesData);
  } catch (error) {
    res.status(500).send('Error 500: Internal server error.');
  }
});

// Request information about a Store based on id:
routerStores.get('/:id', async (req, res) => {
  try {
    const storeId = req.params.id;
    const storeData = await storeInfo(storeId);
    res.send(storeData);
  } catch (error) {
    res.status(500).send('Error 500: Internal server error.');
  }
});

routerStores.get('/categories/:name', async (req, res) => {
  try {
    const category = req.params.name;
    const storesData = await storesFromCategory(category);
    res.send(storesData);
  } catch (error) {
    res.status(500).send('Error 500: Internal server error.');
  }
});


