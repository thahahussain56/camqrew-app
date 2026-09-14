-- -------------------------------------------------------------
-- CAMCREW STUDIO: Clean Production Database Script (Reset All Data)
-- -------------------------------------------------------------

-- Delete all rows from all production tables
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE professionals CASCADE;
TRUNCATE TABLE users CASCADE;

-- Verification Query: All counts should return 0
SELECT 
  (SELECT count(*) FROM users) AS users_count,
  (SELECT count(*) FROM professionals) AS professionals_count,
  (SELECT count(*) FROM products) AS products_count,
  (SELECT count(*) FROM bookings) AS bookings_count,
  (SELECT count(*) FROM orders) AS orders_count,
  (SELECT count(*) FROM chat_messages) AS chat_messages_count;
