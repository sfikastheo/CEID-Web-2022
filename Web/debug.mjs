'use strict';

import { validateLogin } from './dbToNode.mjs';
import bcrypt from 'bcrypt';

console.log(bcrypt.hashSync('Sfikas2001', 10));

validateLogin('sfikas', 'Sfikas2001', false).then((result) => {
  console.log(result);
  process.exit(0);
}).catch((error) => {
  console.log(error);
  process.exit(0);
});

// stop the programe for running indefinitely
// After the promise is resolved the process will exit




