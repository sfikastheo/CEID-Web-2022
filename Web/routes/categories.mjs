"use strict";

import { tableInfo } from '../dbToNode.mjs';
import express from 'express';

export const routerCategories = express.Router();

routerCategories.get('/',(req,res)=>{
	let categories = tableInfo('categories',['*']);
	categories.then((result)=>{
		res.send(JSON.stringify(result));
	});
	categories.catch((error)=>{
		res.status(500)
		.send(`Error 500: ${error}`);
	});
});