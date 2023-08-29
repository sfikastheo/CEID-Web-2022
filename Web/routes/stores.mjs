"use strict";

import { storeInfo, storesFromCategory } from '../dbToNode.mjs';
import { stores } from '../express.mjs';
import express from 'express';

export const routerStores = express.Router();

// Request available Stores
routerStores.get('/', (req,res) => {
	res.send(JSON.stringify(stores));
});

// Request information about a Store based on id:
routerStores.get('/:id', (req,res) => {
	// if store id does not exists
	// json.stringify(result)=[]
	// Empty json will be returned
	// If we want to alter this behavior
	// we need to query the amount of stores
	// in our database and check whether
	// the wanted id exists or not
	let store = storeInfo(req.params.id);
	store.then((result)=>{
		res.send(JSON.stringify(result));
	});
	store.catch((error)=>{
		res.status(500)
		.send(`Error 500: ${error}`);
	})
});

routerStores.get('/categories/:id',(req,res)=>{
	let stores = storesFromCategory(req.params.id);
	stores.then((result)=>{
		res.send(JSON.stringify(result));
	})
	stores.catch((error)=>{
		res.status(500)
		.send(`Error 500: ${error}`);
	});
});

routerStores.get('/subcategories/:id',(req,res)=>{

});

routerStores.get('/products/:id',(req,res)=>{

});


