'use strict';

import * as url from 'url';
import { storeInfo } from './dbToNode.mjs';

let stores = await storeInfo(1);
console.log(stores);
