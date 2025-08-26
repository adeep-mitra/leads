import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = getDatabase();
    
    const [
      summary,
      permitStats,
      suburbStats,
      ratingDistribution,
      topRated,
      lowRated
    ] = await Promise.all([
      db.getDatabaseSummary(),
      db.getPermitStatistics(),
      db.getSuburbAnalysis(),
      db.getRatingDistribution(),
      db.getTopRatedBusinesses(10),
      db.getLowRatedBusinesses(10)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        permitStatistics: permitStats.slice(0, 10), // Top 10 permit types
        suburbAnalysis: suburbStats.slice(0, 10), // Top 10 suburbs
        ratingDistribution,
        topRatedBusinesses: topRated,
        lowRatedBusinesses: lowRated
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
