-- Active: 1695021196288@@localhost@3306@web_2023
DELIMITER $$

CREATE OR REPLACE PROCEDURE update_avgprices()
    BEGIN
        DECLARE cur_prid SMALLINT UNSIGNED;
        DECLARE cur_avgy FLOAT(4,2) UNSIGNED;
        DECLARE cur_avglw FLOAT(4,2) UNSIGNED;
        DECLARE done TINYINT;

        -- find the products of the sales that were submited yesterday, along with their average prices
        DECLARE yesterdayAvg CURSOR FOR 
        SELECT product_id, AVG(price)
        FROM sales
        USE INDEX (sale_creation_date)
        WHERE date_created = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
        GROUP BY product_id;
  
        -- find the products of the sales that were submited during last week, along with their average prices
        DECLARE sevenDayAvg CURSOR FOR
        SELECT product_id, AVG(price)
        FROM sales
        USE INDEX (sale_creation_date)
        WHERE DATEDIFF(CURDATE(), date_created) < 8
        GROUP BY product_id;
        
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done=1;

        -- update average_yesterday for the products 
        SET done=0;
        OPEN yesterdayAvg;

        REPEAT
            FETCH yesterdayAvg INTO cur_prid, cur_avgy; 

            UPDATE products
            SET avgprice_yesterday = cur_avgy
            WHERE id = cur_prid;
        UNTIL(done=1)
        END REPEAT;

        CLOSE yesterdayAvg;
        -- update average_lastweek for the products
        SET done=0;
        OPEN sevenDayAvg;

        REPEAT
            FETCH sevenDayAvg INTO cur_prid, cur_avglw; 

            UPDATE products
            SET avgprice_lastweek = cur_avglw
            WHERE id = cur_prid;
        UNTIL(done=1)
        END REPEAT;

        CLOSE sevenDayAvg;
    END$$

DELIMITER ;

DELIMITER $$

-- @block daily_sequence_part2
CREATE OR REPLACE PROCEDURE update_criteriaOK()
    BEGIN 
        DECLARE done TINYINT;
        DECLARE cur_prid SMALLINT UNSIGNED;
        DECLARE cur_sid INT UNSIGNED;
        DECLARE cur_price FLOAT(4,2) UNSIGNED;
        DECLARE cur_avgy FLOAT(4,2) UNSIGNED;
        DECLARE cur_avglw FLOAT(4,2) UNSIGNED;
        
        -- data needed to update a sale's criteria_ok field
        DECLARE sales2calc CURSOR FOR
        SELECT  sales.id, sales.product_id, sales.price, products.avgprice_yesterday, products.avgprice_lastweek
        FROM sales, products
        WHERE sales.product_id = products.id AND sales.active = 1;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done=1;
        
        SET done=0;
        OPEN sales2calc;
        -- check if the criteria are met for every sale
        REPEAT 
            FETCH sales2calc INTO cur_sid, cur_prid, cur_price, cur_avgy, cur_avglw;
            IF (cur_price < cur_avgy - 20*cur_avgy/100 OR cur_price < cur_avglw - 20*cur_avglw/100) THEN
                UPDATE sales
                SET criteria_ok=1
                WHERE id = cur_sid;
            ELSE 
                UPDATE sales
                SET criteria_ok=0
                WHERE id = cur_sid;
            END IF;
        UNTIL(done=1)
        END REPEAT;

        CLOSE sales2calc;
    END$$

DELIMITER ;
        

DELIMITER $$

-- @block daily_sequence_part3
CREATE OR REPLACE PROCEDURE check_activity()
    BEGIN 
        DECLARE sid INT;
        DECLARE date_difference SMALLINT;
        DECLARE creationdate DATE;
        DECLARE curcriteria BOOLEAN;
        DECLARE cur_storeid SMALLINT;
        DECLARE done TINYINT;

        -- get all the active sales
        DECLARE active_sales CURSOR FOR 
        SELECT sales.id, sales.date_created, sales.criteria_ok, sales.store_id
        FROM sales
        USE INDEX (sale_activity)
        WHERE active=1;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done=1; 

        SET done=0;
        
        OPEN active_sales;
        
        REPEAT
            FETCH active_sales INTO sid, creationdate, curcriteria, cur_storeid;
            SELECT DATEDIFF( CURDATE(), creationdate ) INTO date_difference;
            -- if 1 week has passed, check the criteria_ok field to reactivate/deactivate the sale
            IF (date_difference > 7 ) THEN 
                IF (curcriteria = 1) THEN
                    -- MORE THAN 7 DAYS BUT CRITERIA OK! --> update date created so that sale lasts 1 more week
                    UPDATE sales
                    SET date_created = CURDATE()
                    WHERE id = sid;
                ELSE 
                    UPDATE sales 
                    SET active=0
                    WHERE id= sid;

                    UPDATE stores
                    SET sale_exists = sale_exists -1
                    WHERE id = cur_storeid;
                
                END IF;
            END IF;
        UNTIL( done = 1 )
        END REPEAT;

        CLOSE active_sales;
    END$$

DELIMITER ;


DELIMITER $$

-- @block daily_sequence 
CREATE OR REPLACE PROCEDURE daily_sequence()
    BEGIN 
        CALL update_avgprices();
        CALL update_criteriaOK();
        CALL check_activity();  
    END$$

DELIMITER ;


DELIMITER $$

-- @block monthly_user_data
CREATE OR REPLACE PROCEDURE clear_monthly_user_data()
    BEGIN
        UPDATE users SET monthly_score=0;
    END$$

DELIMITER ;

-- @block show_procedures
SELECT 
    routine_schema as "Database",
    routine_name,
    routine_type
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'web_2023'
ORDER BY 
    routine_name ASC;

