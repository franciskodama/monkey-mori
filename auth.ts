import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

// Safe wrapper around auth() to prevent server crashes when encountering stale/corrupt session cookies
export const auth: typeof nextAuth.auth = (async (...args: Parameters<typeof nextAuth.auth>) => {
  try {
    return await (nextAuth.auth as any)(...args);
  } catch (error) {
    console.warn("NextAuth session decryption error (treating as unauthenticated):", error);
    return null;
  }
}) as typeof nextAuth.auth;

