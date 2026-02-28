-- Migration to increase phone_number column length from VARCHAR(20) to VARCHAR(50)
-- This is needed to accommodate international phone numbers with country codes

ALTER TABLE hr 
ALTER COLUMN phone_number TYPE VARCHAR(50);

ALTER TABLE candidate 
ALTER COLUMN phone_number TYPE VARCHAR(50);
