-- Food Safety Permits Database Schema for PostgreSQL (Neon)
-- Created: August 26, 2025
-- Purpose: Normalized schema for food safety permit data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for re-running the script)
DROP TABLE IF EXISTS permits CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS permit_types CASCADE;
DROP TABLE IF EXISTS suburbs CASCADE;

-- Create suburbs lookup table
CREATE TABLE suburbs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suburb_name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(50) DEFAULT 'QLD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permit types lookup table
CREATE TABLE permit_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permit_type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create addresses table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    full_address TEXT NOT NULL,
    suburb_id UUID REFERENCES suburbs(id),
    postal_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create businesses table
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL,
    address_id UUID REFERENCES addresses(id),
    phone_number VARCHAR(50),
    eat_safe_rating INTEGER CHECK (eat_safe_rating >= 1 AND eat_safe_rating <= 5),
    original_index INTEGER, -- Keep reference to original CSV row
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permits table (junction table for many-to-many relationship)
CREATE TABLE permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    permit_type_id UUID NOT NULL REFERENCES permit_types(id) ON DELETE CASCADE,
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, permit_type_id) -- Prevent duplicate permits for same business
);

-- Create indexes for better performance
CREATE INDEX idx_businesses_name ON businesses USING gin(to_tsvector('english', business_name));
CREATE INDEX idx_businesses_rating ON businesses(eat_safe_rating);
CREATE INDEX idx_businesses_original_index ON businesses(original_index);
CREATE INDEX idx_addresses_suburb ON addresses(suburb_id);
CREATE INDEX idx_permits_business ON permits(business_id);
CREATE INDEX idx_permits_type ON permits(permit_type_id);
CREATE INDEX idx_suburbs_name ON suburbs USING gin(to_tsvector('english', suburb_name));

-- Add trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suburbs_updated_at BEFORE UPDATE ON suburbs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permit_types_updated_at BEFORE UPDATE ON permit_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permits_updated_at BEFORE UPDATE ON permits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
    s.state,
    string_agg(pt.permit_type_name, ', ' ORDER BY pt.permit_type_name) as permit_types,
    count(p.id) as permit_count,
    b.created_at,
    b.updated_at
FROM businesses b
LEFT JOIN addresses a ON b.address_id = a.id
LEFT JOIN suburbs s ON a.suburb_id = s.id
LEFT JOIN permits p ON b.id = p.business_id
LEFT JOIN permit_types pt ON p.permit_type_id = pt.id
GROUP BY b.id, b.business_name, b.phone_number, b.eat_safe_rating, 
         a.full_address, a.address_line_1, a.address_line_2, s.suburb_name, s.state,
         b.created_at, b.updated_at;

-- Create view for permit statistics
CREATE VIEW permit_statistics AS
SELECT 
    pt.permit_type_name,
    count(p.id) as business_count,
    round(avg(b.eat_safe_rating), 2) as avg_rating,
    count(CASE WHEN b.eat_safe_rating = 5 THEN 1 END) as rating_5_count,
    count(CASE WHEN b.eat_safe_rating = 4 THEN 1 END) as rating_4_count,
    count(CASE WHEN b.eat_safe_rating = 3 THEN 1 END) as rating_3_count,
    count(CASE WHEN b.eat_safe_rating = 2 THEN 1 END) as rating_2_count,
    count(CASE WHEN b.eat_safe_rating = 1 THEN 1 END) as rating_1_count
FROM permit_types pt
LEFT JOIN permits p ON pt.id = p.permit_type_id
LEFT JOIN businesses b ON p.business_id = b.id
GROUP BY pt.id, pt.permit_type_name
ORDER BY business_count DESC;

-- Create view for suburb analysis
CREATE VIEW suburb_analysis AS
SELECT 
    s.suburb_name,
    s.state,
    count(DISTINCT b.id) as business_count,
    round(avg(b.eat_safe_rating), 2) as avg_rating,
    count(DISTINCT pt.permit_type_name) as permit_variety,
    max(b.created_at) as latest_business_added
FROM suburbs s
LEFT JOIN addresses a ON s.id = a.suburb_id
LEFT JOIN businesses b ON a.id = b.address_id
LEFT JOIN permits p ON b.id = p.business_id
LEFT JOIN permit_types pt ON p.permit_type_id = pt.id
WHERE b.id IS NOT NULL
GROUP BY s.id, s.suburb_name, s.state
ORDER BY business_count DESC;

-- Create view for rating distribution
CREATE VIEW rating_distribution AS
SELECT 
    eat_safe_rating,
    count(*) as business_count,
    round(count(*) * 100.0 / sum(count(*)) OVER (), 2) as percentage
FROM businesses 
WHERE eat_safe_rating IS NOT NULL
GROUP BY eat_safe_rating
ORDER BY eat_safe_rating DESC;
