import { NextResponse } from 'next/server';
import { seedSemarangData } from '@/lib/seed-data';

export async function GET() {
  const result = await seedSemarangData();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await seedSemarangData();
  return NextResponse.json(result);
}
