import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface CSVRow {
  Index: string;
  'Business Name': string;
  'Business Address': string;
  'Business Address(Line 1)': string;
  'Business Address(Line 2)': string;
  'Business Address Suburb': string;
  'Business Phone Number': string;
  'Eat Safe Rating': string;
  'Permit Name': string;
  'Business Address Suburb List': string;
}

interface CleanedData {
  businessName: string;
  fullAddress: string;
  addressLine1: string | null;
  addressLine2: string | null;
  phoneNumber: string | null;
  eatSafeRating: number | null;
  permitTypes: string[];
  suburbName: string | null;
  originalIndex: number;
}

class DatabaseMigrator {
  private pool: Pool;

  constructor() {
    // Initialize PostgreSQL connection pool
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  private cleanPhoneNumber(phone: string): string | null {
    if (!phone || phone === '-' || phone.trim() === '') {
      return null;
    }

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Handle Australian phone numbers
    if (cleaned.startsWith('0')) {
      cleaned = '+61' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+') && cleaned.length >= 8) {
      // If it's just digits, assume Australian
      cleaned = '+61' + cleaned;
    }

    return cleaned.length >= 10 ? cleaned : null;
  }

  private cleanRating(rating: string): number | null {
    if (!rating || rating === '-' || rating.trim() === '') {
      return null;
    }

    const ratingStr = rating.trim();

    // If it's a single digit 3, 4, or 5, it's a valid rating
    if (['3', '4', '5'].includes(ratingStr)) {
      return parseInt(ratingStr);
    }

    return null;
  }

  private parsePermitTypes(permitString: string): string[] {
    if (!permitString || permitString === '-' || permitString.trim() === '') {
      return [];
    }

    // Clean up the string
    let cleaned = permitString.trim();

    // Remove quotes and extra characters
    cleaned = cleaned.replace(/^"|"$/g, '');

    // Split by comma and clean each type
    const types = cleaned
      .split(',')
      .map(t => t.trim())
      .filter(t => t && t !== '-');

    return types;
  }

  private extractSuburbFromList(suburbList: string): string | null {
    if (!suburbList || suburbList === '-' || suburbList.trim() === '') {
      return null;
    }

    const suburbStr = suburbList.trim();

    // Handle format like "S, Sydney" or "A, Alexandria Mc"
    if (suburbStr.includes(', ')) {
      const parts = suburbStr.split(', ');
      if (parts.length === 2) {
        return parts[1].trim();
      }
    }

    return suburbStr;
  }

  private async readCSVData(): Promise<CleanedData[]> {
    return new Promise((resolve, reject) => {
      const results: CleanedData[] = [];
      const csvPath = path.join(process.cwd(), 'food-safety-permits.csv');

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: CSVRow) => {
          try {
            const businessName = row['Business Name']?.trim();
            if (!businessName || businessName === 'nan') {
              return; // Skip invalid business names
            }

            const cleanedData: CleanedData = {
              businessName,
              fullAddress: row['Business Address']?.trim() || '',
              addressLine1: row['Business Address(Line 1)']?.trim() || null,
              addressLine2: row['Business Address(Line 2)']?.trim() || null,
              phoneNumber: this.cleanPhoneNumber(row['Business Phone Number']),
              eatSafeRating: this.cleanRating(row['Eat Safe Rating']),
              permitTypes: this.parsePermitTypes(row['Permit Name']),
              suburbName: this.extractSuburbFromList(row['Business Address Suburb List']),
              originalIndex: parseInt(row.Index) || 0,
            };

            // Clean address lines
            if (cleanedData.addressLine1 === 'nan' || cleanedData.addressLine1 === '-') {
              cleanedData.addressLine1 = null;
            }
            if (cleanedData.addressLine2 === 'nan' || cleanedData.addressLine2 === '-') {
              cleanedData.addressLine2 = null;
            }

            results.push(cleanedData);
          } catch (error) {
            console.error(`Error processing row ${row.Index}:`, error);
          }
        })
        .on('end', () => {
          console.log(`Loaded ${results.length} valid records from CSV`);
          resolve(results);
        })
        .on('error', reject);
    });
  }

  private async executeSchema(): Promise<void> {
    console.log('Creating database schema...');
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await this.pool.query(schemaSql);
    console.log('Database schema created successfully');
  }

  private async insertLookupData(data: CleanedData[]): Promise<{ suburbLookup: Map<string, string>; permitTypeLookup: Map<string, string> }> {
    console.log('Processing lookup data...');

    // Extract unique suburbs
    const suburbs = new Set<string>();
    data.forEach(row => {
      if (row.suburbName) {
        suburbs.add(row.suburbName);
      }
    });

    // Extract unique permit types
    const permitTypes = new Set<string>();
    data.forEach(row => {
      row.permitTypes.forEach(type => permitTypes.add(type));
    });

    console.log(`Inserting ${suburbs.size} unique suburbs...`);
    const suburbLookup = new Map<string, string>();
    for (const suburb of Array.from(suburbs).sort()) {
      const result = await this.pool.query(
        'INSERT INTO suburbs (suburb_name) VALUES ($1) ON CONFLICT (suburb_name) DO UPDATE SET suburb_name = EXCLUDED.suburb_name RETURNING id',
        [suburb]
      );
      suburbLookup.set(suburb, result.rows[0].id);
    }

    console.log(`Inserting ${permitTypes.size} unique permit types...`);
    const permitTypeLookup = new Map<string, string>();
    for (const permitType of Array.from(permitTypes).sort()) {
      const result = await this.pool.query(
        'INSERT INTO permit_types (permit_type_name) VALUES ($1) ON CONFLICT (permit_type_name) DO UPDATE SET permit_type_name = EXCLUDED.permit_type_name RETURNING id',
        [permitType]
      );
      permitTypeLookup.set(permitType, result.rows[0].id);
    }

    return { suburbLookup, permitTypeLookup };
  }

  private async insertMainData(
    data: CleanedData[],
    suburbLookup: Map<string, string>,
    permitTypeLookup: Map<string, string>
  ): Promise<void> {
    console.log('Processing main business data...');
    let processedCount = 0;
    let errorCount = 0;

    for (const row of data) {
      try {
        const client = await this.pool.connect();
        
        try {
          await client.query('BEGIN');

          // Insert address
          const suburbId = row.suburbName ? suburbLookup.get(row.suburbName) : null;
          const addressResult = await client.query(
            `INSERT INTO addresses (address_line_1, address_line_2, full_address, suburb_id)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [row.addressLine1, row.addressLine2, row.fullAddress, suburbId]
          );
          const addressId = addressResult.rows[0].id;

          // Insert business
          const businessResult = await client.query(
            `INSERT INTO businesses (business_name, address_id, phone_number, eat_safe_rating, original_index)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [row.businessName, addressId, row.phoneNumber, row.eatSafeRating, row.originalIndex]
          );
          const businessId = businessResult.rows[0].id;

          // Insert permits
          for (const permitType of row.permitTypes) {
            const permitTypeId = permitTypeLookup.get(permitType);
            if (permitTypeId) {
              await client.query(
                `INSERT INTO permits (business_id, permit_type_id)
                 VALUES ($1, $2) ON CONFLICT (business_id, permit_type_id) DO NOTHING`,
                [businessId, permitTypeId]
              );
            }
          }

          await client.query('COMMIT');
          processedCount++;

          if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount} records...`);
          }
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error(`Error processing business ${row.businessName}:`, error);
        errorCount++;
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`Successfully processed: ${processedCount} records`);
    console.log(`Errors encountered: ${errorCount} records`);
  }

  private async printStatistics(): Promise<void> {
    console.log('\n=== Database Statistics ===');

    const businessCount = await this.pool.query('SELECT COUNT(*) FROM businesses');
    const permitCount = await this.pool.query('SELECT COUNT(*) FROM permits');
    const suburbCount = await this.pool.query('SELECT COUNT(*) FROM suburbs');
    const permitTypeCount = await this.pool.query('SELECT COUNT(*) FROM permit_types');

    console.log(`Businesses: ${businessCount.rows[0].count}`);
    console.log(`Permits: ${permitCount.rows[0].count}`);
    console.log(`Suburbs: ${suburbCount.rows[0].count}`);
    console.log(`Permit Types: ${permitTypeCount.rows[0].count}`);

    // Show sample data
    console.log('\n=== Sample Business Data ===');
    const sampleData = await this.pool.query(`
      SELECT business_name, permit_types, suburb_name, eat_safe_rating 
      FROM business_details 
      LIMIT 5
    `);

    sampleData.rows.forEach(row => {
      console.log(`${row.business_name} | ${row.permit_types} | ${row.suburb_name} | Rating: ${row.eat_safe_rating}`);
    });

    // Show permit statistics
    console.log('\n=== Top Permit Types ===');
    const permitStats = await this.pool.query(`
      SELECT permit_type_name, business_count, avg_rating 
      FROM permit_statistics 
      WHERE business_count > 0
      ORDER BY business_count DESC 
      LIMIT 10
    `);

    permitStats.rows.forEach(row => {
      console.log(`${row.permit_type_name}: ${row.business_count} businesses (avg rating: ${row.avg_rating})`);
    });
  }

  public async migrate(): Promise<void> {
    try {
      console.log('🚀 Starting food safety permits migration...\n');

      // Test database connection
      await this.pool.query('SELECT NOW()');
      console.log('✅ Database connection successful\n');

      // Execute schema
      await this.executeSchema();

      // Read and clean CSV data
      const data = await this.readCSVData();

      // Insert lookup data
      const { suburbLookup, permitTypeLookup } = await this.insertLookupData(data);

      // Insert main data
      await this.insertMainData(data, suburbLookup, permitTypeLookup);

      // Print statistics
      await this.printStatistics();

      console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  migrator.migrate().catch(console.error);
}

export default DatabaseMigrator;
