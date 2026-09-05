import { NextResponse } from 'next/server';

import { loadDataset } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Read-only JSON feed of the same data the map renders. */
export async function GET() {
  return NextResponse.json(await loadDataset());
}
