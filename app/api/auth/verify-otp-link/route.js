import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import OTP from '@/models/OTP';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const code = searchParams.get('code');

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (!email || !code) {
    return NextResponse.redirect(`${baseUrl}/?error=InvalidLink`);
  }

  await connectDB();

  // Check if valid code exists before triggering client auto-login
  const validOtp = await OTP.findOne({ 
    email: email.trim().toLowerCase(), 
    code: code.trim() 
  });

  if (!validOtp) {
    return NextResponse.redirect(`${baseUrl}/?error=ExpiredCode`);
  }

  // Redirect to homepage with query flags for client auto-login
  return NextResponse.redirect(
    `${baseUrl}/?autoLogin=true&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
  );
}