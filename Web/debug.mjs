'use strict';

import * as url from 'url';
import { tableInfo,subcategories,products } from './dbToNode.mjs';

let categories = tableInfo('categories', ['*']);
categories.then((result) => {
  console.log(result);
}).catch((error) => {
  console.error('Error in categories:', error);
  throw new Error('An error occurred while fetching categories.');
});

let subcategoriesList = await subcategories(1);
console.log(subcategoriesList);

let productsList = await products(1);
console.log(productsList);