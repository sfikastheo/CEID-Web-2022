'use strict';

import * as url from 'url';
import { Mariadb } from "./mariadb.mjs";
const mariadb = await Mariadb.createConnection();


const __basename = url.fileURLToPath(new URL('..', import.meta.url));
console.log(__basename);