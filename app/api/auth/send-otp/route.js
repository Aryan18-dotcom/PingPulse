import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import OTP from '@/models/OTP';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const cleanEmail = email.trim().toLowerCase();

    // 1. Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await connectDB();

    // 2. Clear old codes for this email and save the new one
    await OTP.deleteMany({ email: cleanEmail });
    await OTP.create({ email: cleanEmail, code: otpCode });

    // 3. Construct direct click link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const directLoginUrl = `${baseUrl}/api/auth/verify-otp-link?email=${encodeURIComponent(cleanEmail)}&code=${otpCode}`;

    // 4. Send Email via Nodemailer
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"PingPulse Auth" <${process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: `🔐 Your PingPulse Code: ${otpCode}`,
      html: `
        <div style="font-family: sans-serif; background: #0a0a0a; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #10b981; font-size: 20px; margin-bottom: 8px;">PingPulse Access Code</h2>
          <p style="color: #d4d4d4; font-size: 14px; margin-bottom: 20px;">Enter the 6-digit code below on your login screen, or click the direct button:</p>
          
          <div style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 6px; color: #38bdf8; background: #171717; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #262626;">
            ${otpCode}
          </div>

          <a href="${directLoginUrl}" style="display: block; background: #10b981; color: #000000; font-size: 14px; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 600; text-align: center; box-sizing: border-box;">
            Click to Sign In Directly →
          </a>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Send OTP Error]:', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}