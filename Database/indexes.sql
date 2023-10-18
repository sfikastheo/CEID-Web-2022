-- @block necessary indexes
CREATE OR REPLACE INDEX product_name USING BTREE
ON products(name)
NOWAIT;

CREATE OR REPLACE INDEX sale_creation_date USING BTREE
ON sales(date_created)
NOWAIT;

CREATE OR REPLACE INDEX store_name USING BTREE
ON stores(name)
NOWAIT;

CREATE OR REPLACE INDEX subcat_name USING BTREE
ON subcategories(name)
NOWAIT;

CREATE OR REPLACE INDEX us_score USING BTREE
ON users(sum_score)
NOWAIT;

CREATE OR REPLACE INDEX yesterdayavg USING BTREE
ON products(avgprice_yesterday)
NOWAIT;

CREATE OR REPLACE INDEX lastweekavg USING BTREE
ON products(avgprice_lastweek)
NOWAIT;

CREATE OR REPLACE INDEX sale_activity USING BTREE
ON sales(active)
NOWAIT;

CREATE OR REPLACE INDEX store_has_sales USING BTREE
ON stores(sale_exists)
NOWAIT;

CREATE OR REPLACE INDEX user_names USING BTREE
ON users(username)
NOWAIT;

CREATE OR REPLACE INDEX user_emails USING BTREE
ON users(email)
NOWAIT;
