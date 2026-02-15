import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/db';

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch clients';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = await createClient(body);
    return NextResponse.json(client, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
