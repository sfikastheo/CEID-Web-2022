"use strict"

import bcrypt from 'bcrypt';

import { Mariadb } from "./mariadb.mjs";
const mariadb = await Mariadb.createConnection();

/*================================ Login ================================ */

export async function validateLogin(user, password, type) {
	let query;

	if (type) {
		query = `SELECT id, passwd FROM users WHERE email = ?;`;
	} else {
		query = `SELECT id, passwd FROM users WHERE username = ?;`;
	}

	try {
		const result = await mariadb.paramQuery(query, [user]);
		if (result.length > 0) {
			const passwordMatch = await bcrypt.compare(password, result[0].passwd);
			if (passwordMatch) {
				return { success: true, userId: result[0].id };
			} else {
				return { success: false, message: 'Incorrect password, please try again.' };
			}
		} else {
			return { success: false, message: 'User not found, please register first.' };
		}
	} catch (error) {
		console.error('Error validating login:', error);
		return { success: false, message: 'Sorry, An internal error occurred.' };
	}
}

/*================================ Register ================================ */

export async function registerUser(username, email, password) {
	try {
		// Check if username or email already exist
		const userExistQuery = `SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?;`;
		const userExistResult = await mariadb.paramQuery(userExistQuery, [username, email]);
		
		if (userExistResult[0].count > 0) {
			return { success: false, message: 'Username or email already in use' };
		}

		// If not exists, insert the new user
		const hashedPassword = await bcrypt.hash(password, 10);
		const insertUserQuery = `INSERT INTO users (username, email, passwd) VALUES (?, ?, ?);`;
		await mariadb.paramQuery(insertUserQuery, [username, email, hashedPassword]);
		
		// Commit the changes
    await mariadb.commit();

		return { success: true };
	} catch (error) {
		console.error('Error registering user:', error);
		return { success: false, message: 'An internal error occurred' };
	}
}

/*================================ Other ================================ */
function jsonToGeoJson(input, format) {
	const geojson = {
		type: "FeatureCollection",
		features: [],
	};
	for (let i = 0; i < input.length; i++) {
		let featureProperties = [];
		for (let j = 0; format.properties.length; j++) {

		}
		stores_geojson.features.push({
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [input[i].format[longitude], input[i].format[latitude]]
			},
			"properties": {
				"id": input[i].id,
				"sale_exists": input[i].sale_exists,
				"name": input[i].name
			}
		});
	}
	return geojson;
}

function storesGeoJsonFormat(input) {
	let storeFormat = {
		"type": "Feature",
		"geometry": {
			"type": "Point",
			"coordinates": [input.lon, input.lat]
		},
		"properties": {
			"id": input.id,
			"sale_exists": input.sale_exists,
			"name": input.name
		}
	}
	return storeFormat;
}

function arrayjsonFormatter(input, format) {
	let output = []
	for (let i = 0; i < input.length; i++) {
		output.push(format(input[i]));
	}
	return output;
}

export async function storesToGeoJson() {
	let stores = await mariadb.query("select * from stores");

	const stores_geojson = {
		type: "FeatureCollection",
		features: arrayjsonFormatter(stores, storesGeoJsonFormat)
	};
	return stores_geojson;
}

export async function storeInfo(storeId) {
	let query = `select name, price, criteria_ok, date_created, likes_num, dislikes_num,\
	stock from sales inner join products on product_id = products.id where active=1 \
	and store_id = ${storeId}`;
	let result = await mariadb.query(query);
	return result;
}

export async function storesFromCategory(categoryid) {
	let query = `select stores.id,stores.name,stores.lon,stores.lat,stores.sale_exists from \
	categories inner join subcategories on categories.id = subcategories.categories_id inner join \
	products on subcategories.id = products.subcategories_id inner join sales on products.id = \
	sales.product_id inner join stores on stores.id = sales.store_id where categories.id = ${categoryid}`
	let result = await mariadb.query(query);

	const stores_geojson = {
		type: "FeatureCollection",
		features: arrayjsonFormatter(result, storesGeoJsonFormat)
	};
	return stores_geojson;
}

export async function tableInfo(tableName, tableFields) {
	let fields = tableFields[0];
	for (let i = 1; i < tableFields.length; i++) {
		fields += ',' + tableFields[i];
	}
	let table_json = await mariadb.query(`select ${fields} from ${tableName}`);
	return table_json;
}

//select stores.id,stores.name,stores.lon,stores.lat,stores.sale_exists from categories inner join subcategories on categories.id = subcategories.categories_id inner join products on subcategories.id = products.subcategories_id inner join sales on products.id = sales.product_id inner join stores on stores.id = sales.store_id where categories.id = 1
//select * from stores inner join sales on stores.id = sales.store_id
//select * from sales inner join stores on stores.id = sales.store_id
