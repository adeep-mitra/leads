-- Food Safety Permits Database Schema
-- Created: August 26, 2025
-- Purpose: Normalized schema for food safety permit data

-- Drop tables if they exist (for re-running the script)
DROP TABLE IF EXISTS permits;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS permit_types;
DROP TABLE IF EXISTS suburbs;

-- Create suburbs lookup table
CREATE TABLE suburbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suburb_name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(50) DEFAULT 'QLD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permit types lookup table
CREATE TABLE permit_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create addresses table
CREATE TABLE addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    full_address TEXT NOT NULL,
    suburb_id INTEGER,
    postal_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (suburb_id) REFERENCES suburbs(id)
);

-- Create businesses table
CREATE TABLE businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name VARCHAR(255) NOT NULL,
    address_id INTEGER,
    phone_number VARCHAR(50),
    eat_safe_rating INTEGER CHECK (eat_safe_rating >= 1 AND eat_safe_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id) REFERENCES addresses(id)
);

-- Create permits table (junction table for many-to-many relationship)
CREATE TABLE permits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    permit_type_id INTEGER NOT NULL,
    original_index INTEGER, -- Keep reference to original CSV row
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id),
    FOREIGN KEY (permit_type_id) REFERENCES permit_types(id),
    UNIQUE(business_id, permit_type_id) -- Prevent duplicate permits for same business
);

-- Create indexes for better performance
CREATE INDEX idx_businesses_name ON businesses(business_name);
CREATE INDEX idx_businesses_rating ON businesses(eat_safe_rating);
CREATE INDEX idx_addresses_suburb ON addresses(suburb_id);
CREATE INDEX idx_permits_business ON permits(business_id);
CREATE INDEX idx_permits_type ON permits(permit_type_id);
CREATE INDEX idx_suburbs_name ON suburbs(suburb_name);

-- Create views for easy querying
CREATE VIEW business_details AS
SELECT 
    b.id as business_id,
    b.business_name,
    b.phone_number,
    b.eat_safe_rating,
    a.full_address,
    a.address_line_1,
    a.address_line_2,
    s.suburb_name,
    GROUP_CONCAT(pt.permit_type_name, ', ') as permit_types,
    COUNT(p.id) as permit_count
FROM businesses b
LEFT JOIN addresses a ON b.address_id = a.id
LEFT JOIN suburbs s ON a.suburb_id = s.id
LEFT JOIN permits p ON b.id = p.business_id
LEFT JOIN permit_types pt ON p.permit_type_id = pt.id
GROUP BY b.id, b.business_name, b.phone_number, b.eat_safe_rating, 
         a.full_address, a.address_line_1, a.address_line_2, s.suburb_name;

-- Create view for permit statistics
CREATE VIEW permit_statistics AS
SELECT 
    pt.permit_type_name,
    COUNT(p.id) as business_count,
    AVG(b.eat_safe_rating) as avg_rating,
    COUNT(CASE WHEN b.eat_safe_rating = 5 THEN 1 END) as rating_5_count,
    COUNT(CASE WHEN b.eat_safe_rating = 4 THEN 1 END) as rating_4_count,
    COUNT(CASE WHEN b.eat_safe_rating = 3 THEN 1 END) as rating_3_count
FROM permit_types pt
LEFT JOIN permits p ON pt.id = p.permit_type_id
LEFT JOIN businesses b ON p.business_id = b.id
GROUP BY pt.id, pt.permit_type_name
ORDER BY business_count DESC;

-- Create view for suburb analysis
CREATE VIEW suburb_analysis AS
SELECT 
    s.suburb_name,
    COUNT(DISTINCT b.id) as business_count,
    AVG(b.eat_safe_rating) as avg_rating,
    COUNT(DISTINCT pt.permit_type_name) as permit_variety
FROM suburbs s
LEFT JOIN addresses a ON s.id = a.suburb_id
LEFT JOIN businesses b ON a.id = b.address_id
LEFT JOIN permits p ON b.id = p.business_id
LEFT JOIN permit_types pt ON p.permit_type_id = pt.id
WHERE b.id IS NOT NULL
GROUP BY s.id, s.suburb_name
ORDER BY business_count DESC;
