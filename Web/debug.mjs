'use strict';

import { registerUser } from './dbToNode.mjs';
import bcrypt from 'bcrypt';


registerUser('maria', 'maria.pap@gmail.com', 'Maria2001').then((result) => {
  console.log(result);
  process.exit(0);
}).catch((error) => {
  console.log(error);
  process.exit(0);
});

// stop the programe for running indefinitely
// After the promise is resolved the process will exit




