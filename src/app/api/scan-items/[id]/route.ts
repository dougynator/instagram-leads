import { NextRequest, NextResponse } from 'next/server';
import { updateScanItem } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Only allow updating tags and notes
    const updates: Record<string, unknown> = {};
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.notes !== undefined) updates.notes = body.notes;

    const item = await updateScanItem(id, updates);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update scan item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
