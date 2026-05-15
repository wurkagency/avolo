// Re-export from lib/server/auth for NextAuth v5 auto-detection.
// NextAuth v5 looks for auth.ts at the project root.
export { handlers, signIn, signOut, auth } from "@/lib/server/auth";
