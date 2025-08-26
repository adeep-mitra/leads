import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export interface BusinessDetails {
  business_id: string;
  business_name: string;
  phone_number: string | null;
  eat_safe_rating: number | null;
  full_address: string;
  address_line_1: string | null;
  address_line_2: string | null;
  suburb_name: string | null;
  state: string | null;
  permit_types: string | null;
  permit_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface PermitStatistics {
  permit_type_name: string;
  business_count: number;
  avg_rating: number;
  rating_5_count: number;
  rating_4_count: number;
  rating_3_count: number;
  rating_2_count: number;
  rating_1_count: number;
}

export interface SuburbAnalysis {
  suburb_name: string;
  state: string;
  business_count: number;
  avg_rating: number;
  permit_variety: number;
  latest_business_added: Date;
}

export interface RatingDistribution {
  eat_safe_rating: number;
  business_count: number;
  percentage: number;
}

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async query(text: string, params?: any[]): Promise<any> {
    return this.pool.query(text, params);
  }

  // Business queries
  async getAllBusinesses(limit = 100, offset = 0): Promise<BusinessDetails[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_details ORDER BY business_name LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  async searchBusinesses(searchTerm: string, limit = 50): Promise<BusinessDetails[]> {
    const result = await this.pool.query(
      `SELECT * FROM business_details 
       WHERE business_name ILIKE $1 OR full_address ILIKE $1 OR suburb_name ILIKE $1
       ORDER BY business_name LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
    return result.rows;
  }

  async getBusinessesByRating(rating: number): Promise<BusinessDetails[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_details WHERE eat_safe_rating = $1 ORDER BY business_name',
      [rating]
    );
    return result.rows;
  }

  async getBusinessesByPermitType(permitType: string): Promise<BusinessDetails[]> {
    const result = await this.pool.query(
      `SELECT bd.* FROM business_details bd
       WHERE bd.permit_types ILIKE $1
       ORDER BY bd.business_name`,
      [`%${permitType}%`]
    );
    return result.rows;
  }

  async getBusinessesBySuburb(suburb: string): Promise<BusinessDetails[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_details WHERE suburb_name ILIKE $1 ORDER BY business_name',
      [`%${suburb}%`]
    );
    return result.rows;
  }

  // Statistics queries
  async getPermitStatistics(): Promise<PermitStatistics[]> {
    const result = await this.pool.query(
      'SELECT * FROM permit_statistics ORDER BY business_count DESC'
    );
    return result.rows;
  }

  async getSuburbAnalysis(): Promise<SuburbAnalysis[]> {
    const result = await this.pool.query(
      'SELECT * FROM suburb_analysis ORDER BY business_count DESC'
    );
    return result.rows;
  }

  async getRatingDistribution(): Promise<RatingDistribution[]> {
    const result = await this.pool.query(
      'SELECT * FROM rating_distribution ORDER BY eat_safe_rating DESC'
    );
    return result.rows;
  }

  // Summary statistics
  async getDatabaseSummary(): Promise<{
    totalBusinesses: number;
    totalPermits: number;
    totalSuburbs: number;
    totalPermitTypes: number;
    avgRating: number;
  }> {
    const businessCount = await this.pool.query('SELECT COUNT(*) FROM businesses');
    const permitCount = await this.pool.query('SELECT COUNT(*) FROM permits');
    const suburbCount = await this.pool.query('SELECT COUNT(*) FROM suburbs');
    const permitTypeCount = await this.pool.query('SELECT COUNT(*) FROM permit_types');
    const avgRating = await this.pool.query(
      'SELECT ROUND(AVG(eat_safe_rating), 2) as avg FROM businesses WHERE eat_safe_rating IS NOT NULL'
    );

    return {
      totalBusinesses: parseInt(businessCount.rows[0].count),
      totalPermits: parseInt(permitCount.rows[0].count),
      totalSuburbs: parseInt(suburbCount.rows[0].count),
      totalPermitTypes: parseInt(permitTypeCount.rows[0].count),
      avgRating: parseFloat(avgRating.rows[0].avg),
    };
  }

  // Top performers
  async getTopRatedBusinesses(limit = 10): Promise<BusinessDetails[]> {
    const result = await this.pool.query(
      `SELECT * FROM business_details 
       WHERE eat_safe_rating = 5 
       ORDER BY business_name 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getLowRatedBusinesses(limit = 10): Promise<BusinessDetails[]> {
    const result = await this.pool.query(
      `SELECT * FROM business_details 
       WHERE eat_safe_rating <= 3 
       ORDER BY eat_safe_rating ASC, business_name 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
}

export default DatabaseService;
