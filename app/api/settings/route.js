import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Settings from '@/models/Settings';

export async function GET() {
  await connectDB();
  let settings = await Settings.findOne({});
  if (!settings) {
    settings = await Settings.create({});
  }
  return NextResponse.json(settings);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const { telegram, email } = body;

  let settings = await Settings.findOne({});
  if (!settings) {
    settings = await Settings.create({ telegram, email });
  } else {
    settings.telegram = telegram;
    settings.email = email;
    await settings.save();
  }

  return NextResponse.json(settings);
}