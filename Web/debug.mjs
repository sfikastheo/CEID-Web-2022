'use strict';

import { storesFromCategory } from './dbToNode.mjs';


const tableFields = ['*']; // Replace with the actual field names

try {
  const tableData = await storesFromCategory('1');  
  console.log(tableData);
} catch (error) {
  console.error('Error:', error.message);
}


