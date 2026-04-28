import type { NextAuthConfig } from "next-auth";

// This config is safe for the Edge Runtime - no Node.js imports
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Always allow login page, setup page and auth API
      if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/setup") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/setup") ||
        pathname.startsWith("/api/seed") ||
        pathname.startsWith("/api/search")
      ) {
        return true;
      }

      // Require login for everything else
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Credentials added in auth.ts (Node.js only)
  session: { strategy: "jwt" },
};
