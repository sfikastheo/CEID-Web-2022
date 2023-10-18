# Web Project 2022 Personal Repository

#### NPM dependecy packages installed by Teo
* express
* mariadb
* dotenv
* express-session
* bcrypt
* geojson

#### UI Framework
In addition to bootstrap, i am using the MDB UI framework.
It is a free UI framework that is built on top of bootstrap.
It is very easy to use and has a lot of components that are ready to use.
You can find the documentation [here](https://mdbootstrap.com/docs/standard/).

In order to use it, you need to unzip the [MDB 5 zip](https://mdbootstrap.com/docs/standard/getting-started/installation/)
into the public folder. The Contents of the zip are already in the public folder, so you don't need to do anything.

#### Instructions on using .env file
* Create a .env file in the root directory
* Add the following lines to the .env file
```
MDB_HOST=localhost
MDB_PORT=3306
MDB_USER=your_username
MDB_PASS=your_password
MDB_DBNM=your_database_name
[Opt] SRV_PORT=your_server_port
```
#### Database Configuration
1. Create a database in mariadb & use it
2. Either import the dump file or run the sql script
If you want to import the dump file:
  * change the `definer` of the stored procedures from the dump to your username
  * You can use the following command:
  ```
  mysql -u your_username -p your_database_name < dump.sql
  ```
If you want to configure it yourself the sql import in the following order:
```
createTables.sql
indexes.sql
triggers.sql
procedures.sql
events.sql
ask4.sql
ask5.sql
```
Initialize the database with the information of e-katanalotis.gr & random data:
  * Cd into the `InitScript` directory
  * Create a python virtual environment: `python3 -m venv venv`
  * Activate the virtual environment: `source venv/bin/activate`
  * Install the required packages: `pip install mariadb`
  * Use the correct Interperter, and change the database information in the script
  * Run the script: `python database_initialization.py products stores users sales`
  * In the Mariadb CLI, run the following command:
  ```
  UPDATE sales SET active = 1;
  call daily_sequence();
  call DistributeTokens();
  ```

#### Executing the project
* Make sure you have node.js and npm installed
* Open project root directory in terminal
* Install the required package dependencies
```
npm install
```
* Open the mariadb server
```
# Linux - systemd
sudo systemctl start mariadb
```
* Run the following command in the root directory:
```
# Start the server
node express.mjs
```
* Open your browser and go to http://localhost:3000/

#### Notes
* In case you want to install the mariadb database through the dump file, you should replace
the definer of the stored procedures with your username.
* Following the project instructions, accessing the web app needs authentication (login).
Alternatively, you can access the web app without authentication, and in case specific
actions require authentication, you will be redirected to the login page. This seems to be
the most user-friendly approach, but it is not followed in this project.
