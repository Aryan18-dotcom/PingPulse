import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import OTP from '@/models/OTP';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const code = searchParams.get('code');

  if (!email || !code) {
    return NextResponse.redirect(new URL('/?error=InvalidLink', request.url));
  }

  await connectDB();
  const validOtp = await OTP.findOne({ email: email.toLowerCase(), code });

  if (!validOtp) {
    return NextResponse.redirect(new URL('/?error=ExpiredCode', request.url));
  }

  // Pass credentials to sign in
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/?email=${encodeURIComponent(email)}&code=${code}`);
}