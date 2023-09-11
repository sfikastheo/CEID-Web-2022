'use strict'

import path from 'path';
import express, { json } from 'express';
import * as url from 'url';
import fs from 'fs';
import multer from 'multer';
import { Mariadb } from '../mariadb.mjs';


//create connection to db: normally, this should happen only for the uploads, but idk how to do that correctly
const mariadb = await Mariadb.createConnection();

//current directory
const __dirname = url.fileURLToPath(new URL('..', import.meta.url));

export const adminRouter = express.Router();

/*====================== Multer Configuration ========================*/
const storage = multer.diskStorage({
	destination: './dataJSONs/',
	filename: function (req, file, cb) {
	  cb(null, file.originalname);
	},
  });

const upload = multer({ storage });

//use of static admin home page assets
adminRouter.use('/', express.static(path.join( __dirname, 'users')));

/*====================== DB Updates =====================*/

function updateProduct(product){
    //updating a non-existent row works! so we need to see if the id of the product exists first, in order to perform the right query
    //could wrap lines 36-65 in one try-catch block instead of 2 seperate ones.
    let cur_id = mariadb.paramQuery('SELECT id FROM products WHERE id=?;', product.id);
    cur_id.then((result) => {
        if(Object.keys(result).length === 0 ){
            //id was not found, we need to insert it
            try{
                let prod2ins = mariadb.paramQuery('INSERT INTO products VALUES(?,?,?,?,?);', [product.id, product.name, product.subcategory, 0,0]);  
            }catch(sqlError){
                console.log('Error while inserting to DB: ', sqlError);
            }
        }
        else {
             //id was found, update product
            try{
                let prod2up = mariadb.paramQuery('UPDATE products SET name=?, subcategories_id=? WHERE id=?;', [ product.name, product.subcategory, product.id]);   
            }catch(sqlError){
                console.log('Error while updating DB: ', sqlError);
            }
        }
    })
}

function updatePrices(data = []){
    //even if id doesn't exist, update will not raise error. updates to non-existent rows work, but don't actually cahneg anything in the db
    let query = 'UPDATE products SET avgprice_yesterday=? WHERE id=?;';
    try{
        data.forEach(product => {
            let update = mariadb.paramQuery(query, [product.avgprice_yesterday, product.id]);
        })
        
    }catch(sqlError){
        console.log('Error while inserting to DB: ', sqlError);
    }
    
}

function updateCategory(category){
    //get category id
    let cur_id = mariadb.paramQuery('SELECT id FROM categories WHERE id=?;', category.id);

    cur_id.then((result) => {
        if(Object.keys(result).length === 0 ){
            //id was not found, insert new category
            try{
                let cat2ins = mariadb.paramQuery('INSERT INTO categories VALUES(?,?);', [category.id, category.name]);  
                updateSubcategories(category);              
            }catch(sqlError){
                console.log('Error while inserting to DB: ', sqlError);
            }
        }else{
            //category exists, update it
            try{
                let cat2up = mariadb.paramQuery('UPDATE categories SET name=?;', category.name);
                cat2up.then(async() => {
                    await mariadb.commit();
                })
                
                updateSubcategories(category); 
            }catch(sqlError){
                console.log('Error while updating DB: ', sqlError);
            }
        }
    })
}

function updateSubcategories(category){
    category.subcategories.forEach(sbc => {
        //get subcategory id
        let cursbc_id = mariadb.paramQuery('SELECT id FROM subcategories WHERE id=?;', sbc.uuid);
        cursbc_id.then((result) => {
            if (Object.keys(result) === 0){
                //subcategory non-existent, insert
                try{
                    let sbc2ins = mariadb.paramQuery('INSERT INTO subcategories VALUES(?,?,?);', [sbc.uuid, category.id, sbc.name]);
                }catch(sqlError){
                    console.log('Error while inserting to DB: ', sqlError);
                }
                
            }else{
                //subcategory exists, update it
                try{
                    let sbc2up = mariadb.paramQuery('UPDATE subcategories SET categories_id=?, name=? WHERE id=?;', [category.id, sbc.name, sbc.uuid]);
                }catch(sqlError){
                    console.log('Error while updating DB: ', sqlError);
                }
               
            }
        })
    })
}

//fix db to hold latitude, longitude as well and pass them in the queries
function updateStore(store){
    let cur_id = mariadb.paramQuery('SELECT id FROM stores WHERE id=?;', store.id);
    cur_id.then((result) => {
        if (Object.keys(result).length === 0){
            //store does not exist, insert 
            try {
                let store2ins = mariadb.paramQuery('INSERT INTO stores VALUES (?,?,?);', [store.id, 0, store.name]);
                store2ins.then(async() => await mariadb.commit());
            }catch(sqlError){
                console.log('Error while inserting to DB: ', sqlError);
            }

        }else{
            //store exists, update
            try {
                let store2up = mariadb.paramQuery('UPDATE stores SET name=?;', store.name);
                store2up.then(async() => await mariadb.commit());
            }catch(sqlError){
                console.log('Error while inserting to DB: ', sqlError);
            }
        }
    })

}
/*========================= Routes ==========================*/
//get, post, modify ?? what's it gonna be? change in the fetch request as well
adminRouter.get('/products', (req, res) => {
    let query = "SELECT products.id, products.name as pnm, products.avgprice_yesterday, subcategories.name as snm, categories.name as cnm FROM products INNER JOIN subcategories ON products.subcategories_id = subcategories.id INNER JOIN categories ON subcategories.categories_id = categories.id ORDER BY products.id; ";
    let products = mariadb.paramQuery(query);
    products.then(result=> {
        res.send(JSON.stringify(result));
    })    
})

adminRouter.get('/subcategories', (req,res) => {
    let selection = "SELECT subcategories.id, subcategories.name as subname, subcategories.categories_id, categories.name FROM subcategories INNER JOIN categories ON categories.id = subcategories.categories_id;"
    let subcategories = mariadb.paramQuery(selection);
    subcategories.then((result) => {
        res.send(JSON.stringify(result));
    })
})

adminRouter.get('/stores', async(req,res) => {
    let subcategories = mariadb.paramQuery("SELECT * FROM stores");
    subcategories.then((result) => {
        res.send(JSON.stringify(result));
    })
})

adminRouter.post('/uploadprods', upload.single('file'), (req, res) => {
    //no file uploaded
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    
    //get file path and read the file
    const jsonFilePath = req.file.path;

    fs.readFile(jsonFilePath, 'utf8', async (err, data) => {
      if (err) {
        return res.status(500).send('Error reading JSON file.');
      }
      
      try {
            //parse data to a JSON object
            const jsonData = JSON.parse(data); 
            //execute updates
            if (req.file.filename !== "prices.json"){
                jsonData.products.forEach(product => {
                    updateProduct(product);
                })
            }else {
                updatePrices(jsonData.prices);
            }
            await mariadb.commit();
            //reload page to update table (all data is refetched from db)
            res.redirect('/users/admin_main.html');
        }catch (err) {
            console.error('Error while json to DB:', err);
            return res.status(400).send('Internal Server Error.');
        }
    });
})

adminRouter.post('/uploadcats', upload.single('file'), (req, res) => { 
    //no file uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    //get file path and read the file
    const jsonFilePath = req.file.path;

    fs.readFile(jsonFilePath, 'utf8', async(err, data) => {
        if (err) {
            return res.status(500).send('Error reading JSON file.');
        }

        try {
            //parse data to a JSON object
            const jsonData = JSON.parse(data); 
            //execute updates
            jsonData.categories.forEach(category => {
                updateCategory(category);
            })
            await mariadb.commit();
            //reload page to update table (all data is refetched from db)
            res.redirect('/users/admin_main.html');
            res.send('File uploaded and database updated successfully!');
        }catch (err) {
            console.error('Error while json to DB:', err);
            return res.status(400).send('Internal Server Error.');
        }

    }) 
})

adminRouter.post('/uploadstores', upload.single('file'), (req, res) => { 
    //no file uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    //get file path and read the file
    const jsonFilePath = req.file.path;

    fs.readFile(jsonFilePath, 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).send('Error reading JSON file.');
        }

        try {
            //parse data to a JSON object
            const jsonData = JSON.parse(data); 
            //execute updates
            jsonData.stores.forEach(store => {
                updateStore(store);
            })
            await mariadb.commit();
            //reload page to update table (all data is refetched from db)
            res.redirect('/users/admin_main.html');
        }catch (err) {
            console.error('Error while json to DB:', err);
            return res.status(400).send('Internal Server Error.');
        }

    }) 
})

//works in mysql console, not here. according to chatGPT, deletions need to be separate
adminRouter.post('/delprods', async (req, res) => {
    let delquery = "";
    let ids2delete = req.body;
    let i=0;
    
    try{
        ids2delete.forEach(id => {
            delquery =`DELETE FROM products WHERE id=${id}; `;
            let deletion = mariadb.paramQuery(delquery);  
            i++;       
        })
    
        await mariadb.commit();
        console.log("deletion successful. Deleted ", i, "items."); 
        res.redirect('/users/admin_main.html');
    }catch(sqlError){
        console.log("Error while deleting from DB.")
    } 
})

adminRouter.post('/delcats', async (req, res) => {
    let delquery = "";
    let ids2delete = req.body;
    let i=0;
    
    try{
        ids2delete.forEach(id => {
            delquery =`DELETE FROM subcategories WHERE id=${id}; `;
            let deletion = mariadb.paramQuery(delquery);  
            i++;       
        })
    
        await mariadb.commit();
        console.log("deletion successful. Deleted ", i, "items."); 
    }catch(sqlError){
        console.log("Error while deleting from DB.")
    }
})

adminRouter.post('/delstores', async (req, res) => {
    let delquery = "";
    let ids2delete = req.body;
    let i=0;
    
    try{
        ids2delete.forEach(id => {
            delquery =`DELETE FROM stores WHERE id=${id}; `;
            let deletion = mariadb.paramQuery(delquery);  
            i++;       
        })
    
        await mariadb.commit();
        console.log("deletion successful. Deleted ", i, "items."); 
    }catch(sqlError){
        console.log("Error while deleting from DB.")
    }
})

adminRouter.post('/stats', (req,res) => {
    let data = req.body;
    if (data[0]<10) data[0] = `0${data[0]}`;
    let query = `SELECT id FROM sales WHERE date_created LIKE "${data[1]}-${data[0]}-__" GROUP BY date_created;`

    let monthlysales = mariadb.paramQuery(query);
    monthlysales.then((result) => {
        res.send(JSON.stringify(result));
    })
    
})


 