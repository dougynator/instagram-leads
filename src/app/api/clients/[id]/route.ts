import { NextRequest, NextResponse } from 'next/server';
import { getClient, updateClient, deleteClient } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await getClient(id);
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(client);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const client = await updateClient(id, body);
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(client);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteClient(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
