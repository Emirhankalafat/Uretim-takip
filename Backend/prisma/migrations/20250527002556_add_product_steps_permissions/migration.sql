-- This is an empty migration.

-- Insert Product Steps Permissions
INSERT INTO "permissions" ("Name", "Type") VALUES 
('PRODUCT_STEP_READ', 'PRODUCT_STEP'),
('PRODUCT_STEP_CREATE', 'PRODUCT_STEP'),
('PRODUCT_STEP_UPDATE', 'PRODUCT_STEP'),
('PRODUCT_STEP_DELETE', 'PRODUCT_STEP');