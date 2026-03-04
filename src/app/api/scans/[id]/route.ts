import { NextRequest, NextResponse } from 'next/server';
import { getScan, getScanItems } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scan = await getScan(id);
    if (!scan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const items = await getScanItems(id);
    return NextResponse.json(
      { scan, items },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch scan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
