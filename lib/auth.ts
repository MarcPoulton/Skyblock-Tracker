import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

function vercelURL(value: string | undefined) {
  return value ? `https://${value}` : undefined;
}

const authBaseURL =
  process.env.BETTER_AUTH_URL ??
  vercelURL(process.env.VERCEL_URL) ??
  "http://localhost:3000";

const trustedOrigins = Array.from(
  new Set(
    [
      authBaseURL,
      process.env.BETTER_AUTH_URL,
      vercelURL(process.env.VERCEL_URL),
      vercelURL(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    ].filter((origin): origin is string => Boolean(origin)),
  ),
);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: authBaseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins,
});

export type Session = typeof auth.$Infer.Session;
