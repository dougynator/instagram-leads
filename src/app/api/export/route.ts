import { NextRequest, NextResponse } from 'next/server';
import { getScanItems } from '@/lib/db';
import { exportScanItemsToCSV } from '@/lib/csv';
import { DEFAULT_EXPORT_COLUMNS } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scan_id, columns, matched_only } = body;

    if (!scan_id) {
      return NextResponse.json({ error: 'scan_id is required' }, { status: 400 });
    }

    let items = await getScanItems(scan_id);

    // Filter to matched only if requested
    if (matched_only) {
      items = items.filter((i) => i.matched);
    }

    // Filter to completed items only
    items = items.filter((i) => i.status === 'completed');

    const exportColumns = columns?.length > 0 ? columns : DEFAULT_EXPORT_COLUMNS;
    const csv = exportScanItemsToCSV(items, exportColumns);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=scan-${scan_id}-export.csv`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
