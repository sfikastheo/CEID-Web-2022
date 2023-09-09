'use strict';

import * as url from 'url';
import { addSale } from './dbToNode.mjs';

// Add a sale
let saleData = {
  store_id: 1,
  product_id: 1,
  price: 1.5,
  user_suggested: 49,
};

let result = await addSale(saleData);
console.log(result);
