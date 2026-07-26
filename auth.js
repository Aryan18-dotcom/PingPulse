import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import OTP from '@/models/OTP';
import mongoose from 'mongoose';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/',
    error: '/', // Redirect errors back to homepage instead of /api/auth/error
  },
  providers: [
    CredentialsProvider({
      id: 'otp-credentials',
      name: 'OTP Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toLowerCase()?.trim();
          const code = credentials?.code?.trim();

          if (!email || !code) return null;

          await connectDB();

          // 1. Case-insensitive & trimmed OTP search
          const otpRecord = await OTP.findOne({ email, code });
          if (!otpRecord) {
            console.log(`[Auth Error]: No matching OTP found for ${email} with code ${code}`);
            return null;
          }

          // 2. Consume OTP
          await OTP.deleteOne({ _id: otpRecord._id });

          // 3. User lookup/creation
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

          // Return strictly serializable user object (Must convert _id to String)
          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (err) {
          console.error('[Authorize Error]:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    },
  },
});