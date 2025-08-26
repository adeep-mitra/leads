# Food Safety Permits Database Migration

This project migrates food safety permit data from CSV to a normalized PostgreSQL database hosted on Neon.

## 🏗️ Database Schema

The database uses a normalized structure with the following tables:

### Core Tables
- **`businesses`** - Core business information (name, phone, rating)
- **`addresses`** - Normalized address data with foreign key to suburbs
- **`permits`** - Junction table linking businesses to permit types
- **`permit_types`** - Lookup table for permit categories
- **`suburbs`** - Lookup table for suburbs

### Key Features
- **UUID Primary Keys** - Uses PostgreSQL UUID extension for scalable IDs
- **Full-text Search** - GIN indexes on business names and suburbs
- **Audit Trails** - Created/updated timestamps with automatic triggers
- **Data Integrity** - Foreign key constraints and check constraints
- **Performance Optimized** - Strategic indexes for common queries

## 📊 Database Views

### `business_details`
Complete business information with joined address and permit data:
```sql
SELECT * FROM business_details WHERE suburb_name = 'Brisbane City';
```

### `permit_statistics`
Aggregated statistics by permit type:
```sql
SELECT * FROM permit_statistics ORDER BY business_count DESC;
```

### `suburb_analysis`
Business distribution and ratings by suburb:
```sql
SELECT * FROM suburb_analysis WHERE business_count > 10;
```

### `rating_distribution`
Overview of safety rating distribution:
```sql
SELECT * FROM rating_distribution;
```

## 🚀 Migration Process

### Prerequisites
1. **Neon Database**: Ensure your `.env` file has the correct `DATABASE_URL`
2. **Node.js Dependencies**: All required packages are installed

### Data Cleaning Features
The migration script automatically handles:

- **Phone Number Standardization**: Converts to international format (+61 for Australian numbers)
- **Rating Validation**: Extracts valid ratings (3-5) from mixed data
- **Permit Type Parsing**: Splits comma-separated permit types
- **Suburb Extraction**: Parses suburb names from "X, Suburb Name" format
- **Address Normalization**: Separates full addresses into structured fields

### Run Migration
```bash
npm run migrate
```

Or directly:
```bash
npx tsx scripts/migrate.ts
```

### What the Migration Does

1. **Schema Creation**: Creates all tables, indexes, and views
2. **Data Validation**: Cleans and validates CSV data
3. **Lookup Population**: Populates suburbs and permit types
4. **Business Data**: Inserts businesses with addresses and permits
5. **Statistics**: Shows migration results and sample data

## 📈 Sample Queries

### Find all restaurants in Brisbane City with rating 5
```sql
SELECT business_name, full_address, permit_types
FROM business_details 
WHERE suburb_name = 'Brisbane City' 
  AND permit_types LIKE '%Cafe/Restaurant%' 
  AND eat_safe_rating = 5;
```

### Top 10 suburbs by business count
```sql
SELECT suburb_name, business_count, avg_rating
FROM suburb_analysis 
ORDER BY business_count DESC 
LIMIT 10;
```

### Businesses with multiple permit types
```sql
SELECT business_name, permit_count, permit_types
FROM business_details 
WHERE permit_count > 1
ORDER BY permit_count DESC;
```

### Search businesses by name (full-text search)
```sql
SELECT business_name, suburb_name, eat_safe_rating
FROM business_details
WHERE to_tsvector('english', business_name) @@ to_tsquery('english', 'Coles | McDonald');
```

## 🔧 Troubleshooting

### Database Connection Issues
- Verify your Neon database URL in `.env`
- Ensure your Neon project is active
- Check network connectivity

### Migration Errors
- Check CSV file exists: `food-safety-permits.csv`
- Verify file format and headers match expected structure
- Review console output for specific error details

### Performance Considerations
- Migration processes ~7,800 records in batches
- Uses transactions for data integrity
- Includes progress indicators

## 📱 Next Steps

After successful migration, you can:

1. **Build APIs**: Create Next.js API routes to query the database
2. **Add Authentication**: Secure access to admin features
3. **Create Dashboard**: Build analytics views using the database views
4. **Export Data**: Generate reports from normalized data
5. **Real-time Updates**: Add triggers for data change notifications

## 🗂️ File Structure

```
├── database/
│   └── schema.sql          # PostgreSQL schema definition
├── scripts/
│   └── migrate.ts          # TypeScript migration script
├── food-safety-permits.csv # Source data file
├── .env                    # Database configuration
└── README-migration.md     # This file
```
