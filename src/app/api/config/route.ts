import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'weights' }
    });
    
    if (config) {
      const weights = config.value.split(',').map(Number);
      return NextResponse.json({ weights });
    }
    
    return NextResponse.json({ weights: [0.16, 0.16, 0.17, 0.17, 0.17, 0.17] });
  } catch (error: any) {
    console.error('API GET config failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weights, role } = body;

    // Check authorization (only CMO Leader / Admin can configure weights)
    if (role !== 'CMO_LEADER') {
      return NextResponse.json({ error: 'Unauthorized. Only the CMO Executive Steering committee can configure scorecard weights.' }, { status: 403 });
    }

    if (!Array.isArray(weights) || weights.length !== 6) {
      return NextResponse.json({ error: 'Invalid weights. Must be an array of 6 numbers.' }, { status: 400 });
    }

    // Verify weights sum to approximately 1.0
    const sum = weights.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.02) {
      return NextResponse.json({ error: 'Weights must sum to 100% (1.0). Current sum: ' + (sum * 100).toFixed(0) + '%' }, { status: 400 });
    }

    const value = weights.join(',');
    const updatedConfig = await prisma.systemConfig.upsert({
      where: { key: 'weights' },
      update: { value },
      create: { key: 'weights', value }
    });

    return NextResponse.json({ success: true, weights: updatedConfig.value.split(',').map(Number) });
  } catch (error: any) {
    console.error('API POST config failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
