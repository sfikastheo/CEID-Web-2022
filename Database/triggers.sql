DELIMITER //

CREATE TRIGGER sale_likes_update
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    DECLARE user2update INT UNSIGNED;

    UPDATE sales 
    SET likes_num = likes_num + 1
    WHERE id = NEW.sales_id;
    
    SELECT user_suggested
    INTO user2update 
    FROM sales
    WHERE id = NEW.sales_id;

    UPDATE users
    SET monthly_score = monthly_score + 5,
        sum_score = sum_score + 5
    WHERE id = user2update;
END; //

DELIMITER ;

DELIMITER $$
CREATE OR REPLACE TRIGGER sale_wdrawlikes_update AFTER DELETE ON likes
FOR EACH ROW
    BEGIN
        DECLARE user2update INT UNSIGNED;

        UPDATE sales 
        SET likes_num = likes_num -1 
        WHERE id = OLD.sales_id;

        SELECT user_suggested
        INTO user2update 
        FROM sales
        WHERE id = OLD.sales_id;

        UPDATE users
        SET monthly_score = monthly_score - 5,
            sum_score = sum_score - 5
        WHERE id = user2update;
    END; $$

DELIMITER ;

DELIMITER $$
-- @block dislikes_triggers
CREATE OR REPLACE TRIGGER sale_dilikes_update AFTER INSERT ON dislikes
FOR EACH ROW
    BEGIN
        DECLARE user2update INT UNSIGNED;

        -- update dislikes number on the sale that was liked by a user
        UPDATE sales 
        SET dislikes_num = dislikes_num+1
        WHERE id = NEW.sales_id;
        
        -- update the score of the user who submitted the sale
        SELECT user_suggested
        INTO user2update 
        FROM sales
        WHERE id = NEW.sales_id;

        UPDATE users
        SET monthly_score = monthly_score-1,
            sum_score = sum_score-1
        WHERE id = user2update;
    END; $$

DELIMITER ;

DELIMITER $$
CREATE OR REPLACE TRIGGER sale_wdrawdislikes_update AFTER DELETE ON dislikes
FOR EACH ROW
    BEGIN
        DECLARE user2update INT UNSIGNED;

        -- update dislikes number on the sale that was liked by a user
        UPDATE sales 
        SET dislikes_num = dislikes_num-1
        WHERE id = OLD.sales_id;
        
        -- update the score of the user who submitted the sale
        SELECT user_suggested
        INTO user2update 
        FROM sales
        WHERE id = OLD.sales_id;

        UPDATE users
        SET monthly_score = monthly_score + 1,
            sum_score = sum_score + 1
        WHERE id = user2update;
    END$$

DELIMITER ;

DELIMITER $$
-- @block sales_triggers 
CREATE OR REPLACE TRIGGER salesub_score_update BEFORE INSERT ON sales
FOR EACH ROW 
    BEGIN
        DECLARE avgp_prevday FLOAT(4,2);
        DECLARE avgp_lweek FLOAT(4,2);

        SELECT avgprice_yesterday, avgprice_lastweek
        INTO avgp_prevday, avgp_lweek
        FROM products
        USE INDEX (yesterdayavg, lastweekavg)
        WHERE id = NEW.product_id;

        IF (NEW.price < 20*avgp_prevday/100) THEN 
            UPDATE users
            SET monthly_score = monthly_score + 50,
                sum_score = sum_score + 50
            WHERE id = NEW.user_suggested;
            SET NEW.criteria_ok =1;
        ELSEIF (NEW.price < 20*avgp_lweek/100) THEN
            UPDATE users
            SET monthly_score = monthly_score + 20,
                sum_score = sum_score + 20
            WHERE id = NEW.user_suggested;
            SET NEW.criteria_ok =1;
        END IF;
    END$$

DELIMITER ;

DELIMITER $$
-- increment sales_exist after insertion of sale.
CREATE OR REPLACE TRIGGER update_storeSales AFTER INSERT ON sales
FOR EACH ROW
BEGIN
	UPDATE stores
	SET sale_exists = sale_exists +1
    WHERE id = NEW.store_id; 
END; $$

DELIMITER ;