# Web Project 2022 Personal Repository

#### NPM dependecy packages installed by Teo
* express
* mariadb
* dotenv
* @canvasjs/charts
* multer
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
