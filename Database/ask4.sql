DELIMITER $$

CREATE PROCEDURE DistributeTokens()
BEGIN
    DECLARE total_tokens INT;
    DECLARE total_monthly_score INT;
    DECLARE tokens_to_distribute INT;

    -- Start transaction
    START TRANSACTION;

    -- Calculate total tokens
    SELECT COUNT(*) * 100 INTO total_tokens FROM users;

    -- Calculate total monthly score
    SELECT SUM(monthly_score) INTO total_monthly_score FROM users;

    -- Check if total_monthly_score is zero
    IF total_monthly_score = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Total monthly score is zero.';
    END IF;

    -- Calculate tokens to distribute
    SET tokens_to_distribute = ROUND(total_tokens * 0.8);

    -- Distribute tokens, update sum tokens, and reset monthly score
    UPDATE users 
    SET monthly_tokens = ROUND((monthly_score / total_monthly_score) * tokens_to_distribute),
        sum_tokens = sum_tokens + monthly_tokens,
        monthly_score = 0;

    -- Commit transaction
    COMMIT;
END$$

DELIMITER ;

-- Create event
SET GLOBAL event_scheduler = ON;

CREATE EVENT DistributeTokensEvent
    ON SCHEDULE 
        EVERY 1 MONTH
        STARTS '2023-01-31 23:59:59'
    DO
        CALL DistributeTokens();
