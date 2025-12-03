import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/database/mongoose';

export async function GET() {
  try {
    const conn = await connectToDatabase();
    const info = conn.connection;

    const payload = {
      ok: true,
      readyState: info.readyState, // 1 means connected
      host: (info as unknown as { host?: string }).host ?? 'unknown',
      dbName: info.name,
      driver: 'mongoose',
      mongooseVersion: mongoose.version,
      nodeEnv: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        error: message,
        nodeEnv: process.env.NODE_ENV ?? 'development',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
