'use strict';

import express from 'express';
import { saleUsersSubmitedInfo, addSale, updateSaleStock } from '../dbToNode.mjs';
import { likeSale, dislikeSale, unlikeSale, undislikeSale } from '../dbToNode.mjs';

export const routerSales = express.Router();

routerSales.get('/:id/submittedBy', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await saleUsersSubmitedInfo(id);
    res.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error in routerSales:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});

routerSales.post('/submit', async (req, res) => {
  try {
    // Get the user id from the session
    let userId = req.session.userId;

    // Add user id to the saleData
    const saleData = req.body;
    saleData.user_suggested = userId;

    // Call the function to add the sale
    const result = await addSale(saleData);

    if (result.success) {
      res.status(200).json({ message: 'Sale added successfully' });
    } else {
      res.status(200).json({ message: 'Failed to add sale' });
    }
  } catch (error) {
    console.error('Error in /submit:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});

// Like and dislike routes
routerSales.post('/:id/like', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.session.userId;
    const result = await likeSale(id, userId);
    res.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error in /:id/like:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});

routerSales.post('/:id/dislike', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.session.userId;
    const result = await dislikeSale(id, userId);
    res.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error in /:id/dislike:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});

// Remove like and dislike routes
routerSales.post('/:id/unlike', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.session.userId;
    const result = await unlikeSale(id, userId);
    res.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error in /:id/removeLike:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});

routerSales.post('/:id/undislike', async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.session.userId;
    const result = await undislikeSale(id, userId);
    res.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error in /:id/removeDislike:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});

// Stock changes
routerSales.patch('/:id/stock', async (req, res) => {
  try {
    const id = req.params.id;
    const { stock } = req.body; // Get the new stock status from the request body

    const result = await updateSaleStock(id, stock); 

    return res.json(result);
  } catch (error) {
    console.error('Error in /:id/stock:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});




