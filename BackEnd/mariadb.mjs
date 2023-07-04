"use strict";

// Custom module for creating a mariadb connection
// And quering the database API.
import mariadb from 'mariadb';
import {} from 'dotenv/config';

export class Mariadb {
	constructor( conn ){
		this.conn = conn
	}
	static async createConnection(){
		let conn
		try {
			conn = await mariadb.createConnection({
				host : process.env.MDB_HOST,
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
	destructor(){
		if( this.conn ) this.conn.close();
	}
	async query(query){
		try {
			await this.conn.beginTransaction();
			try {
				let result = await this.conn.query(query);
				return result;
			} catch (error) {
				console.error("Aborted: Query returned with error: ", error);
			}
		} catch (error) {
			console.error("Aborted: Error starting a transaction: ", error);
		}
	}
}