import { NextRequest, NextResponse } from 'next/server';
import { getScan, updateScan } from '@/lib/db';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scanId } = await params;
    const scan = await getScan(scanId);
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Set status to cancelled - the execute loop checks this
    await updateScan(scanId, {
      status: 'cancelled',
      finished_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, status: 'cancelled' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel scan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
