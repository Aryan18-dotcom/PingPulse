import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import OTP from '@/models/OTP';
import mongoose from 'mongoose';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      id: 'otp-credentials',
      name: 'OTP Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase()?.trim();
        const code = credentials?.code?.trim();

        if (!email || !code) return null;

        await connectDB();

        // 1. Verify code against MongoDB OTP collection
        const otpRecord = await OTP.findOne({ email, code });
        if (!otpRecord) return null;

        // 2. Clear OTP after successful use
        await OTP.deleteOne({ _id: otpRecord._id });

        // 3. Retrieve or create user record via Mongoose
        const userCollection = mongoose.connection.db.collection('users');
        let user = await userCollection.findOne({ email });

        if (!user) {
          const newUser = await userCollection.insertOne({
            email,
            emailVerified: new Date(),
            createdAt: new Date(),
          });
          user = { _id: newUser.insertedId, email };
        }

        return { id: user._id.toString(), email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session?.user) session.user.id = token.id;
      return session;
    },
  },
});