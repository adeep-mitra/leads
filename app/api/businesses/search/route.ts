import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const businesses = await db.searchBusinesses(q);

    return NextResponse.json({
      success: true,
      data: businesses,
      query: q,
      count: businesses.length
    });
  } catch (error) {
    console.error('Error searching businesses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search businesses' },
      { status: 500 }
    );
  }
}
