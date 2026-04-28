import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use the Edge-safe config (no MongoDB/bcrypt imports)
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
