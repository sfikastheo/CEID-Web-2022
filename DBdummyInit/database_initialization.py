# The purpose of this script file is to initialize a custom mariadb database
# with scraped data from the Greek website 'e-katanalotis'.
# Custom Jsons from 'e-katanalotis' are gathered with the use of the scripts
# provided by 'https://github.com/komis1/e-katanalotis-data'.

# Deserialization of JSON in python
#   JSON OBJECT	    PYTHON OBJECT
#   object          dict
#   array           list
#   string          str
#   null            None
#   number (int)    int
#   number (real)	float
#   true            True
#   false           False

import sys
import json
import random
import mariadb
from mariadb.constants import *
from datetime import date, timedelta


# The needed jsons will not be parametrized.
product_categories_json = "product_categories.json"
regional_markets_json = "ot_patra.json"
sales_json = "sales.json"
users_json = "users.json"


def establish_localhost_mariadb_connection(conn_user, conn_password, host_ip, database_name):
    try:
        conn = mariadb.connect(
            user=conn_user,
            password=conn_password,
            host=host_ip,
            database=database_name
        )
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB Platform: {e}")
        sys.exit(1)
    conn.autocommit = False
    return (conn)


def close_mariadb_connection(conn, cur):
    cur.close()
    conn.close()


def mariadb_executemany_inserts_query(table_name, data, cur):
    try:
        insert_query = "INSERT INTO " + table_name + \
            " VALUES (" + (len(data[0])-1)*"?," + "?)"
        cur.executemany(insert_query, data)
    except mariadb.Error as e:
        print(f"Error: {e}")


def initialize_cat_subcat_products(product_categories_json):
    with open(product_categories_json, 'r', encoding="utf-8") as product_categories:
        data = json.loads(product_categories.read())

        # Initialize categories, subcategories and product tables
        categories = data.get("categories")
        products = data.get("products")
        subcategory_id = 0
        product_id = 0
        catList = []
        subcatList = []
        productList = []
        for (category_id, category) in enumerate(categories, start=1):
            catList.append((category_id, category.get("name")))
            for subcategory in category.get("subcategories"):
                subcategory_id += 1
                subcatList.append(
                    (subcategory_id, category_id, subcategory.get("name")))
                for product in products:
                    if (product.get("subcategory") == subcategory.get("uuid")):
                        product_id += 1
                        productList.append((product_id, product.get(
                            "name"), subcategory_id, INDICATOR.DEFAULT, INDICATOR.DEFAULT))
        return ((catList, subcatList, productList))


def initialize_users(users_json):
    with open(users_json, 'r', encoding="utf-8") as users:
        data = json.loads(users.read())
        usersList = []
        de = INDICATOR.DEFAULT
        for user in data:
            usersList.append(
                (user["id"], user["username"], user["password"], user["email"], de, de, de, de))
        return usersList


def initialize_sales(sales_json, users_count):
    with open(sales_json, 'r', encoding="utf-8") as sales:
        data = json.loads(sales.read())
        salesList = []
        likesList = []
        dislikesList = []
        for sale in data:
            salesList.append((sale["id"], sale["store_id"], sale["product_id"], sale["price"], sale["stock"],
                              sale["active"], (date.today(
                              ) - timedelta(days=random.randrange(0, 7))).strftime('%Y-%m-%d'),
                              sale["likes"], sale["dislikes"], sale["user_suggested"], INDICATOR.DEFAULT))
            for i in range(0, sale["likes"]):
                likesList.append(
                    (INDICATOR.NULL, sale["id"], random.randrange(1, users_count)))
            for i in range(0, sale["dislikes"]):
                dislikesList.append(
                    (INDICATOR.NULL, sale["id"], random.randrange(1, users_count)))
        return ((salesList, likesList, dislikesList))


def initialize_stores_from_overpass_turbo_query(stores_json):
    # Overpass turbo query: https://overpass-turbo.eu/
    # [out:json][timeout:25];
    # {{geocodeArea:πάτρα}}->.searchArea;   // fetch area “πάτρα”
    # ( node["shop"~"supermarket|convenience"](area.searchArea); );
    # out body; // print results for query part for: “supermarket”
    # >;
    # out skel qt;
    with open(stores_json, "r", encoding="utf-8") as stores_from_overpass_query:
        data = json.loads(stores_from_overpass_query.read())
        data = data.get("elements")
        regional_markets = []
        for index, store in enumerate(data, start=1):
            regional_markets.append((index, INDICATOR.DEFAULT, store["lat"], store["lon"],
                                     store["tags"].get("name")))
        return regional_markets


def insert_single_sale(conn, cur, sale, likes, dislikes):
    try:
        # Insert the sale record
        mariadb_executemany_inserts_query("sales", [sale], cur)

        # Insert likes and dislikes
        mariadb_executemany_inserts_query("likes", [likes], cur)
        mariadb_executemany_inserts_query("dislikes", [dislikes], cur)

        # Commit the transaction
        conn.commit()

        # Return True to indicate successful insertion
        return True
    except mariadb.Error as e:
        # Print the error message and rollback the transaction
        print(f"Error inserting sale record: {e}")
        conn.rollback()
        return False


def main():
    # Create the database connection
    conn = establish_localhost_mariadb_connection(
        "root", "maria", "localhost", "web_2023")
    cur = conn.cursor()

    users = False
    sales = False
    stores = False
    cat_subcat_products = False
    for arg in sys.argv:
        if (arg == "categories" or arg == "subcategories" or arg ==
                "products"):
            cat_subcat_products = True
        if (arg == "sales" or arg == "likes" or arg == "dislikes"):
            sales = True
        if (arg == "users"):
            users = True
        if (arg == "stores"):
            stores = True

    if (cat_subcat_products):
        products_categories = initialize_cat_subcat_products(
            product_categories_json)
        mariadb_executemany_inserts_query(
            "categories", products_categories[0], cur)
        mariadb_executemany_inserts_query(
            "subcategories", products_categories[1], cur)
        mariadb_executemany_inserts_query(
            "products", products_categories[2], cur)
    if (stores):
        regional_stores = initialize_stores_from_overpass_turbo_query(
            regional_markets_json)
        mariadb_executemany_inserts_query("stores", regional_stores, cur)
    if (users):
        generated_users = initialize_users(users_json)
        mariadb_executemany_inserts_query("users", generated_users, cur)

    if (sales):
        sales_feedback = initialize_sales(sales_json, 50)
        
        # One by one insertion of sales, likes and dislikes
        for sale, likes, dislikes in zip(*sales_feedback):
            success = insert_single_sale(conn, cur, sale, likes, dislikes)
            if not success:
                print("Failed to insert a sale record.")  

        # Insert sales, likes and dislikes with executemany
        # mariadb_executemany_inserts_query( "sales", sales_feedback[0], cur)
        # mariadb_executemany_inserts_query( "likes", sales_feedback[1], cur)
        # mariadb_executemany_inserts_query( "dislikes", sales_feedback[2], cur)
    if (users or sales or stores or cat_subcat_products):
        conn.commit()

    # Close the database connection
    close_mariadb_connection(conn, cur)


if __name__ == '__main__':
    main()
