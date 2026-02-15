import { NextRequest, NextResponse } from 'next/server';
import { getScans, createScan } from '@/lib/db';

export async function GET() {
  try {
    const scans = await getScans();
    return NextResponse.json(scans);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch scans';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const scan = await createScan({
      client_id: body.client_id || null,
      name: body.name || 'Untitled Scan',
      filters: body.filters || {},
      total_input: 0,
    });

    return NextResponse.json(scan, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create scan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
