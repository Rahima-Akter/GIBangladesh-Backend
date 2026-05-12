import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { prisma } from "./prisma";
import config from "../config";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: config.betterAuthBaseUrl,

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },

  // Trust frontend origin for cookies
  trustedOrigins: [config.frontendUrl],

  // Session cookie settings
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    },
  },
});
