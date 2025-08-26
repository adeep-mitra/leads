# Food Safety Permits Database

A Next.js application with a PostgreSQL database for managing and analyzing food safety permit data.

## 🗂️ Database Schema

The database is designed with a normalized relational structure:

### Tables

- **businesses** - Core business information (UUID primary key)
- **addresses** - Normalized address data
- **permits** - Junction table linking businesses to permit types
- **permit_types** - Lookup table for permit categories
- **suburbs** - Lookup table for suburbs

### Views

- **business_details** - Complete business information with joined data
- **permit_statistics** - Aggregated statistics by permit type
- **suburb_analysis** - Analysis by suburb with averages
- **rating_distribution** - Distribution of safety ratings

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Your CSV file: `food-safety-permits.csv`

### 2. Database Setup (Neon)

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy your connection string

### 3. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Neon database URL:
   ```
   DATABASE_URL=postgresql://username:password@your-neon-host.neon.tech/your-database-name?sslmode=require
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Place Your CSV File

Ensure `food-safety-permits.csv` is in the project root directory.

### 6. Run Migration

```bash
npm run migrate
```

This will:
- Create the database schema
- Import and clean the CSV data
- Populate all tables with normalized data
- Display statistics and sample data

## 📊 Data Processing

The migration script performs comprehensive data cleaning:

### Phone Number Cleaning
- Standardizes to international format (+61 for Australia)
- Removes invalid/empty numbers

### Rating Validation
- Extracts valid ratings (3, 4, 5) from mixed data
- Handles cases where suburb names were incorrectly placed in rating column

### Address Normalization
- Separates full addresses into components
- Links addresses to suburb lookup table

### Permit Type Processing
- Parses comma-separated permit types
- Creates normalized many-to-many relationships

## 🔍 Database Operations

### Using the Database Service

```typescript
import { getDatabase } from '@/lib/database';

const db = getDatabase();

// Get all businesses
const businesses = await db.getAllBusinesses();

// Search businesses
const results = await db.searchBusinesses('Otto');

// Get by rating
const topRated = await db.getBusinessesByRating(5);

// Get statistics
const stats = await db.getPermitStatistics();
const summary = await db.getDatabaseSummary();
```

### Direct SQL Queries

```typescript
const db = getDatabase();

// Custom query
const result = await db.query(
  'SELECT * FROM businesses WHERE eat_safe_rating = $1',
  [5]
);
```

## 📈 Available Views and Queries

### Business Details View
```sql
SELECT * FROM business_details 
WHERE suburb_name = 'Brisbane City'
ORDER BY eat_safe_rating DESC;
```

### Permit Statistics
```sql
SELECT * FROM permit_statistics 
WHERE business_count > 100
ORDER BY avg_rating DESC;
```

### Suburb Analysis
```sql
SELECT * FROM suburb_analysis 
WHERE business_count >= 10
ORDER BY avg_rating DESC;
```

### Rating Distribution
```sql
SELECT * FROM rating_distribution;
```

## 🏗️ Database Schema Features

### Performance Optimizations
- **Indexes**: Full-text search on business names and suburbs
- **UUID Primary Keys**: Better for distributed systems
- **Timestamps**: Automatic created_at/updated_at tracking

### Data Integrity
- **Foreign Key Constraints**: Maintain referential integrity
- **Check Constraints**: Validate rating ranges (1-5)
- **Unique Constraints**: Prevent duplicate permit assignments

### Advanced Features
- **Triggers**: Auto-update timestamps
- **Views**: Pre-computed aggregations
- **Full-text Search**: GIN indexes for efficient searching

## 📋 Data Quality Report

After migration, you'll see statistics like:

```
=== Database Statistics ===
Businesses: 7,442
Permits: 12,589
Suburbs: 156
Permit Types: 23

=== Top Permit Types ===
Cafe/Restaurant: 2,297 businesses (avg rating: 4.2)
Takeaway Food: 782 businesses (avg rating: 4.1)
Food Stall: 413 businesses (avg rating: 4.3)
```

## 🔧 Maintenance

### Re-running Migration
If you need to re-run the migration:

```bash
npm run migrate
```

The script safely drops and recreates tables.

### Database Backup
For Neon databases, backups are handled automatically, but you can also export:

```bash
pg_dump $DATABASE_URL > backup.sql
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Error**: Verify your `DATABASE_URL` in `.env`
2. **CSV Not Found**: Ensure `food-safety-permits.csv` is in project root
3. **Permission Errors**: Check database user permissions for CREATE/DROP operations

### Debugging

Enable query logging by setting:
```
NODE_ENV=development
```

## 📚 Next Steps

1. Build API endpoints using the database service
2. Create dashboard components for data visualization
3. Add data export functionality
4. Implement real-time updates

## 🤝 Contributing

When making schema changes:
1. Update `database/schema.sql`
2. Update TypeScript interfaces in `lib/database.ts`
3. Test migration with sample data
4. Update this README
