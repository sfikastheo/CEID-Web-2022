-- @block event declaration
CREATE OR REPLACE EVENT call_daily_sequence
    ON SCHEDULE EVERY 1 DAY
    STARTS '2022-12-27 00:00:00'
    DO 
        call daily_sequence();

CREATE OR REPLACE EVENT call_clear_monthly_user_data_procedure_once_a_month
    ON SCHEDULE EVERY 1 MONTH 
    DO 
        call clear_monthly_user_data();


-- @block show_events
SHOW EVENTS FROM web_2023;