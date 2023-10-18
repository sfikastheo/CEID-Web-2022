--ASK5.1---OK--
--- update the score of the user who suggested the sale
DELIMITER //
CREATE OR REPLACE TRIGGER after_sales_insert 
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    DECLARE avg_price_day DECIMAL(4,2);
    DECLARE avg_price_week DECIMAL(4,2);

    -- Fetch average price from the products table
    SELECT avgprice_yesterday, avgprice_lastweek 
    INTO avg_price_day, avg_price_week 
    FROM products 
    WHERE id = NEW.product_id;

    IF NEW.price <= 0.8 * avg_price_day THEN
        UPDATE users 
        SET sum_score = sum_score + 50, monthly_score = monthly_score + 50 
        WHERE id = NEW.user_suggested;

        INSERT INTO score_log (user_id, score_change, reason) 
        VALUES (NEW.user_suggested, 50, 'Better price than yesterday');

    ELSEIF NEW.price <= 0.8 * avg_price_week THEN
        UPDATE users 
        SET sum_score = sum_score + 20, monthly_score = monthly_score + 20 
        WHERE id = NEW.user_suggested;

        INSERT INTO score_log (user_id, score_change, reason) 
        VALUES (NEW.user_suggested, 20, 'Better price than last week');
    ELSE 
        INSERT INTO score_log (user_id, score_change, reason) 
        VALUES (NEW.user_suggested, 0, 'No reward');

    END IF;
END;
//
DELIMITER ;

----ASK5.2----
--- update the score of the user who got liked
DELIMITER //
CREATE OR REPLACE TRIGGER after_likes_insert 
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    DECLARE suggester_id INT;

    SELECT user_suggested INTO suggester_id FROM sales WHERE id = NEW.sales_id;

    -- Increase score for a like
    UPDATE users SET sum_score = sum_score + 5, monthly_score = monthly_score + 5 WHERE id = suggester_id;
    INSERT INTO score_log (user_id, score_change, reason) VALUES (suggester_id, 5, 'Received Like');
END;
//
DELIMITER ;

--- update the score of the user who got disliked
DELIMITER //
CREATE OR REPLACE TRIGGER after_dislikes_insert 
AFTER INSERT ON dislikes
FOR EACH ROW
BEGIN
    DECLARE suggester_id INT;

    SELECT user_suggested INTO suggester_id FROM sales WHERE id = NEW.sales_id;

    -- Decrease score for a dislike
    UPDATE users SET sum_score = GREATEST(0, sum_score - 1), monthly_score = GREATEST(0, monthly_score - 1) WHERE id = suggester_id;
    INSERT INTO score_log (user_id, score_change, reason) VALUES (suggester_id, -1, 'Received Dislike');
END;
//
DELIMITER ;


----SCORE LOG TABLE----
--- Might help with debugging
CREATE TABLE score_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id SMALLINT(5) UNSIGNED NOT NULL, -- referencing your users table
    score_change INT NOT NULL, -- can be positive (reward) or negative (penalty)
    reason VARCHAR(255), -- a brief description of why the score was changed
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- when the change occurred
);
