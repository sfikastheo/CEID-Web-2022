"use strict";

// The problem with the below code is that it is not using
// connection pooling. Every time a request is made the same
// connection is used. This is not a good practice because
// the connection is not released and it is reused. But in cases
// of high traffic multible requests will be made and the server
// will crash. The solution is to use connection pooling.
// Multible connections are created and are used for every request
// and are released after a number of requests. This is a better
// practice because the connections are reused and the server
// will not crash.

// At the moment we are using a single connection for every request
// because we do not have a lot of traffic.

// Custom module for creating a mariadb connection
// And quering the database API.
import mariadb from 'mariadb';
import { } from 'dotenv/config';

export class Mariadb {
	constructor(conn) {
		this.conn = conn
	}

	static async createConnection() {
		let conn
		try {
			conn = await mariadb.createConnection({
				host: process.env.MDB_HOST,
				port: process.env.MDB_PORT,
				user: process.env.MDB_USER,
				password: process.env.MDB_PASS,
				database: process.env.MDB_DBNM,
				pipelining: true,
			});
			return new Mariadb(conn);
		} catch (error) {
			console.log("Mariadb Connection Failed")
		}
	}
	destructor() {
		if (this.conn) this.conn.close();
	}

	async commit() {
		try {
			await this.conn.commit();
			return true;
		} catch (error) {
			// If there is an error, rollback the changes
			await this.conn.rollback();
			console.error("Aborted: Error committing a transaction: ", error);
			throw error; // Re-throw the error to be handled at a higher level
		}
	}

	async query(query) {
		try {
			await this.conn.beginTransaction();
			try {
				let result = await this.conn.query(query);
				return result;
			} catch (error) {
				console.error("Aborted: Query returned with error: ", error);
				throw error; // Re-throw the error to be handled at a higher level
			}
		} catch (error) {
			console.error("Aborted: Error starting a transaction: ", error);
			throw error; // Re-throw the error to be handled at a higher level
		}
	}

	// parametrized queries are used to prevent sql injection
	async paramQuery(query, values = []) {
		try {
			await this.conn.beginTransaction();
			try {
				let result = await this.conn.query(query, values);
				return result;
			} catch (error) {
				console.error("Aborted: Query returned with error: ", error);
				throw error; // Re-throw the error to be handled at a higher level
			}
		} catch (error) {
			console.error("Aborted: Error starting a transaction: ", error);
			throw error; // Re-throw the error to be handled at a higher level
		}
	}
}