import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log(`[NextAuth] Auth attempt for email: "${credentials?.email}"`);
        if (!credentials?.email || !credentials?.password) {
          console.warn('[NextAuth] Missing email or password');
          throw new Error('Please enter both email and password.');
        }

        const trimmedEmail = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (!user) {
          console.warn(`[NextAuth] User not found for email: "${trimmedEmail}"`);
          throw new Error('Invalid email or password.');
        }

        if (!user.passwordHash) {
          console.warn(`[NextAuth] User "${trimmedEmail}" has no passwordHash set`);
          throw new Error('Invalid email or password.');
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          console.warn(`[NextAuth] Incorrect password for user: "${trimmedEmail}"`);
          throw new Error('Invalid email or password.');
        }

        if (user.isBanned) {
          console.warn(`[NextAuth] Banned user attempted login: "${trimmedEmail}"`);
          throw new Error('Your account has been suspended. Please contact support if you believe this is an error.');
        }

        console.log(`[NextAuth] Successful login for user: "${trimmedEmail}" with role: "${user.role}"`);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          documentVerified: user.documentVerified,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.documentVerified = (user as any).documentVerified || false;
      }
      if (trigger === 'update' && session) {
        if (session.role) token.role = session.role;
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
        if (session.documentVerified !== undefined) token.documentVerified = session.documentVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).documentVerified = token.documentVerified as boolean;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
