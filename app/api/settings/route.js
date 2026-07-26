import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Settings from '@/models/Settings';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  await connectDB();
  let settings = await Settings.findOne({ userId: session.user.id });
  if (!settings) {
    settings = await Settings.create({ userId: session.user.id });
  }
  return NextResponse.json(settings);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  await connectDB();
  const body = await request.json();
  const { telegram, email } = body;

  const settings = await Settings.findOneAndUpdate(
    { userId: session.user.id },
    { telegram, email },
    { upsert: true, returnDocument: 'after' }
  );

  return NextResponse.json(settings);
}