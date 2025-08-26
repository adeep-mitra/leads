-- Sample Queries for Food Safety Permits Database
-- Use these with your Neon PostgreSQL database

-- 1. Find all 5-star restaurants in Brisbane City
SELECT 
    business_name,
    full_address,
    phone_number,
    permit_types
FROM business_details 
WHERE suburb_name = 'Brisbane City' 
  AND permit_types LIKE '%Cafe/Restaurant%' 
  AND eat_safe_rating = 5
ORDER BY business_name;

-- 2. Top 15 suburbs by business count with average ratings
SELECT 
    suburb_name,
    business_count,
    avg_rating,
    permit_variety
FROM suburb_analysis 
ORDER BY business_count DESC 
LIMIT 15;

-- 3. All Coles stores with their ratings
SELECT 
    business_name,
    suburb_name,
    eat_safe_rating,
    permit_types
FROM business_details 
WHERE business_name LIKE 'Coles%'
ORDER BY eat_safe_rating DESC, suburb_name;

-- 4. Businesses with the most permit types (diversified operations)
SELECT 
    business_name,
    suburb_name,
    permit_count,
    permit_types,
    eat_safe_rating
FROM business_details 
WHERE permit_count > 3
ORDER BY permit_count DESC, business_name;

-- 5. Food manufacturers with their safety ratings
SELECT 
    business_name,
    suburb_name,
    eat_safe_rating,
    full_address,
    phone_number
FROM business_details 
WHERE permit_types LIKE '%Food Manufacturer%'
  AND eat_safe_rating IS NOT NULL
ORDER BY eat_safe_rating DESC, business_name;

-- 6. Child care centres by rating (parents care about food safety!)
SELECT 
    business_name,
    suburb_name,
    eat_safe_rating,
    full_address
FROM business_details 
WHERE permit_types LIKE '%Child Care Centre%'
ORDER BY eat_safe_rating DESC, suburb_name, business_name;

-- 7. Search for specific business types using full-text search
SELECT 
    business_name,
    suburb_name,
    eat_safe_rating,
    permit_types
FROM business_details
WHERE to_tsvector('english', business_name) @@ to_tsquery('english', 'McDonald | KFC | Subway | Pizza')
ORDER BY eat_safe_rating DESC, business_name;

-- 8. Average rating by permit type (what's safest?)
SELECT 
    permit_type_name,
    business_count,
    avg_rating,
    rating_5_count,
    rating_4_count,
    rating_3_count
FROM permit_statistics 
WHERE business_count >= 10  -- Only types with significant sample size
ORDER BY avg_rating DESC;

-- 9. Businesses without ratings (might need inspection)
SELECT 
    business_name,
    suburb_name,
    permit_types,
    full_address
FROM business_details 
WHERE eat_safe_rating IS NULL
  AND permit_types LIKE '%Cafe/Restaurant%'
ORDER BY suburb_name, business_name
LIMIT 20;

-- 10. Rating distribution overview
SELECT 
    eat_safe_rating,
    business_count,
    percentage
FROM rating_distribution
ORDER BY eat_safe_rating DESC;

-- 11. Find businesses near each other (same address patterns)
SELECT 
    a1.business_name as business_1,
    a2.business_name as business_2,
    a1.full_address,
    a1.suburb_name
FROM business_details a1
JOIN business_details a2 ON a1.full_address = a2.full_address 
    AND a1.business_id < a2.business_id  -- Avoid duplicates
ORDER BY a1.suburb_name, a1.full_address;

-- 12. Mobile food vendors by suburb
SELECT 
    suburb_name,
    COUNT(*) as mobile_food_count,
    AVG(eat_safe_rating) as avg_rating
FROM business_details 
WHERE permit_types LIKE '%Mobile Food%'
GROUP BY suburb_name
HAVING COUNT(*) > 1
ORDER BY mobile_food_count DESC;

-- 13. Businesses with phone numbers (for contact)
SELECT 
    business_name,
    suburb_name,
    phone_number,
    eat_safe_rating,
    permit_types
FROM business_details 
WHERE phone_number IS NOT NULL
  AND eat_safe_rating = 5
ORDER BY suburb_name, business_name
LIMIT 30;

-- 14. Address analysis - find incomplete addresses
SELECT 
    business_name,
    suburb_name,
    CASE 
        WHEN address_line_1 IS NULL THEN 'Missing Line 1'
        WHEN address_line_2 IS NULL THEN 'Missing Line 2'
        ELSE 'Complete'
    END as address_status,
    full_address
FROM business_details 
WHERE address_line_1 IS NULL OR address_line_2 IS NULL
ORDER BY address_status, suburb_name
LIMIT 20;

-- 15. Year-over-year analysis (if you add more data)
-- This shows the structure for temporal analysis
SELECT 
    EXTRACT(YEAR FROM created_at) as year,
    COUNT(*) as businesses_added,
    AVG(eat_safe_rating) as avg_rating
FROM businesses 
WHERE eat_safe_rating IS NOT NULL
GROUP BY EXTRACT(YEAR FROM created_at)
ORDER BY year DESC;
