import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { BLOG_ADMIN_EMAIL } from "@/lib/blog-constants";

async function verifyAdminPassword(plain: string): Promise<boolean> {
  const hash = process.env.BLOG_ADMIN_PASSWORD_HASH?.trim();
  const plainEnv = process.env.BLOG_ADMIN_PASSWORD?.trim();
  if (hash) {
    return bcrypt.compare(plain, hash);
  }
  if (plainEnv) {
    return plain === plainEnv;
  }
  return false;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = credentials.email.trim().toLowerCase();
        if (email !== BLOG_ADMIN_EMAIL) {
          return null;
        }
        const ok = await verifyAdminPassword(credentials.password);
        if (!ok) {
          return null;
        }
        return {
          id: "blog-admin",
          email: BLOG_ADMIN_EMAIL,
          name: "Blog admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
