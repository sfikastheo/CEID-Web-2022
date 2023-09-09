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

/*=============================== Usefull Funtions =============================== */

function arrayjsonFormatter(input, format) {
	let output = []
	for (let i = 0; i < input.length; i++) {
		output.push(format(input[i]));
	}
	return output;
}

// SOS: Prepared statements are not supported for table names and column names
// Only values can be parametrized
export async function tableInfo(tableName, tableFields) {
	try {
		const fields = tableFields.join(', ');
		const query = `SELECT ${fields} FROM ${tableName};`;
		const table_json = await mariadb.query(query);
		return table_json;
	} catch (error) {
		console.error('Error in tableInfo:', error);
		throw new Error('An error occurred while fetching table information.');
	}
}

/*================================ Info ================================ */

export async function getUserInfo(userId) {
	try {
		const query = `SELECT username, email, sum_score, sum_tokens, monthly_score, monthly_tokens FROM users WHERE id = ?;`;
		const result = await mariadb.paramQuery(query, [userId]);

		if (result.length > 0) {
			return { success: true, userInfo: result[0] };
		} else {
			return { success: false, message: 'User not found.' };
		}
	} catch (error) {
		console.error('Error getting user info:', error);
		return { success: false, message: 'An internal error occurred.' };
	}
}

/*================================ Stores - App ================================ */

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

export async function storesToGeoJson() {
	let stores = await mariadb.query("select * from stores");

	const stores_geojson = {
		type: "FeatureCollection",
		features: arrayjsonFormatter(stores, storesGeoJsonFormat)
	};
	return stores_geojson;
}

export async function storeInfo(storeId) {
	try {
		const query = `SELECT sales.id, name, price, criteria_ok, date_created, likes_num, dislikes_num, stock
                   FROM sales
                   INNER JOIN products ON product_id = products.id
                   WHERE active = 1 AND store_id = ?`;

		const result = await mariadb.paramQuery(query, [storeId]);
		return result;
	} catch (error) {
		console.error('Error in storeInfo:', error);
		throw new Error('An error occurred while fetching store information.');
	}
}

export async function storesFromCategory(categoryId) {
	try {
		const query = `SELECT stores.id, stores.name, stores.lon, stores.lat, stores.sale_exists
                   FROM categories
                   INNER JOIN subcategories ON categories.id = subcategories.categories_id
                   INNER JOIN products ON subcategories.id = products.subcategories_id
                   INNER JOIN sales ON products.id = sales.product_id
                   INNER JOIN stores ON stores.id = sales.store_id
                   WHERE categories.id = ?`;

		const result = await mariadb.paramQuery(query, [categoryId]);

		const stores_geojson = {
			type: "FeatureCollection",
			features: arrayjsonFormatter(result, storesGeoJsonFormat)
		};
		return stores_geojson;
	} catch (error) {
		console.error('Error in storesFromCategory:', error);
		throw new Error('An error occurred while fetching stores from category.');
	}
}

/*==================== Categories/SubCategories/Products ==================== */

export async function subcategories(categoryId) {
	try {
		const query = `SELECT id, name FROM subcategories WHERE categories_id = ?;`;
		const result = await mariadb.paramQuery(query, [categoryId]);
		return result;
	} catch (error) {
		console.error('Error in subcategories:', error);
		throw new Error('An error occurred while fetching subcategories.');
	}
}

export async function products(subcategoryId) {
	try {
		const query = `SELECT id, name FROM products WHERE subcategories_id = ?;`;
		const result = await mariadb.paramQuery(query, [subcategoryId]);
		return result;
	} catch (error) {
		console.error('Error in products:', error);
		throw new Error('An error occurred while fetching products.');
	}
}

/*================================ Sales ================================ */

export async function saleUsersSubmitedInfo(saleId) {
	try {
		const query = `SELECT username, sum_score FROM users INNER JOIN sales ON users.id = sales.user_suggested WHERE sales.id = ?;`;
		const result = await mariadb.paramQuery(query, [saleId]);
		return result;
	} catch (error) {
		console.error('Error in saleUsersSubmitedInfo:', error);
		throw new Error('An error occurred while fetching saleUsersSubmitedInfo.');
	}
}

export async function addSale(saleData) {
	try {
		// Check if the submitted price is 20% or more lower than the previous price, if exists
		const previousSaleQuery = `SELECT price FROM sales WHERE product_id = ? AND store_id = ?;`;
		const previousSaleResult = await mariadb.paramQuery(previousSaleQuery, [saleData.product_id, saleData.store_id]);

		if (previousSaleResult.length > 0 && saleData.price >= previousSaleResult[0].price * 0.8) {
			// Price not low enough, return an error
			return { success: false, message: 'Price not low enough' };
		}

		// Insert the new sale
		const insertSaleQuery = `INSERT INTO sales (product_id, store_id, price, user_suggested, date_created, active, likes_num, dislikes_num) VALUES (?, ?, ?, ?, NOW(), 1, 0, 0);`;
		await mariadb.paramQuery(insertSaleQuery, [saleData.product_id, saleData.store_id, saleData.price, saleData.user_suggested]);

		// Commit the changes
		const commitResult = await mariadb.commit();

		if (commitResult) {
			return { success: true, message: 'Sale added successfully' };
		} else {
			return { success: false, message: 'Failed to add sale' };
		}
	} catch (error) {
		console.error('An error occurred while adding sale.', error);
		throw new Error('An error occurred while adding sale.');
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
