import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb-client';
import { connectDB } from '@/lib/db';
import OTP from '@/models/OTP';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
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

        // 2. Clear OTP after successful consumption
        await OTP.deleteOne({ _id: otpRecord._id });

        // 3. Retrieve or create user record
        const db = (await clientPromise).db();
        let user = await db.collection('users').findOne({ email });

        if (!user) {
          const newUser = await db.collection('users').insertOne({
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