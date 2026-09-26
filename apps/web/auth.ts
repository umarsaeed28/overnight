import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { loadEnv } from "@oqa/core";
import { schema } from "@oqa/db";
import NextAuth, { type NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Nodemailer from "next-auth/providers/nodemailer";
import { authDb } from "./lib/db";

const env = loadEnv();

const providers: NextAuthConfig["providers"] = [];

// Both providers are optional in configuration so a developer can run with just
// one; startup fails only if neither is available.
if (env.SMTP_URL && env.AUTH_EMAIL_FROM) {
  providers.push(Nodemailer({ server: env.SMTP_URL, from: env.AUTH_EMAIL_FROM }));
}

if (env.ENTRA_CLIENT_ID && env.ENTRA_CLIENT_SECRET && env.ENTRA_TENANT_ID) {
  providers.push(
    MicrosoftEntraID({
      clientId: env.ENTRA_CLIENT_ID,
      clientSecret: env.ENTRA_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${env.ENTRA_TENANT_ID}/v2.0`,
    }),
  );
}

export const configuredProviders = providers.map((provider) => {
  const resolved = typeof provider === "function" ? provider() : provider;
  return { id: resolved.id, name: resolved.name, type: resolved.type };
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(authDb(), {
    usersTable: schema.users,
    accountsTable: schema.authAccounts,
    verificationTokensTable: schema.authVerificationTokens,
  }),
  providers,
  secret: env.AUTH_SECRET,
  // JWT sessions, so the API can authenticate a request by decrypting the
  // cookie instead of calling back into the web app.
  session: { strategy: "jwt" },
  pages: { signIn: "/login", verifyRequest: "/login?sent=1", error: "/login" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      // The API needs both `sub` and `email` to identify the caller.
      if (user?.id) token.sub = user.id;
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
