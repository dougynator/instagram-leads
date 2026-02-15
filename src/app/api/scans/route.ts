import { NextRequest, NextResponse } from 'next/server';
import { getScans, createScan, createScanItems } from '@/lib/db';

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
    const { usernames, ...scanData } = body;

    // Create the scan
    const scan = await createScan({
      ...scanData,
      total_input: usernames?.length || 0,
    });

    // Create scan items for each username
    if (usernames?.length > 0) {
      const items = usernames.map((username: string) => ({
        scan_id: scan.id,
        username: username.replace(/^@/, '').trim().toLowerCase(),
        profile_url: `https://instagram.com/${username.replace(/^@/, '').trim().toLowerCase()}`,
      }));
      await createScanItems(items);
    }

    return NextResponse.json(scan, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create scan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
