'use strict';

import express from 'express';
import { saleUsersSubmitedInfo, addSale } from '../dbToNode.mjs';

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
      res.status(400).json({ message: 'Failed to add sale' });
    }
  } catch (error) {
    console.error('Error in /submit:', error);
    res.status(500).send('Error 500: Internal Server Error');
  }
});
