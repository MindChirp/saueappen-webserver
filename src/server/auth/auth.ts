import { expo } from "@better-auth/expo";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, genericOAuth, openAPI } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins:
    env.NODE_ENV === "development"
      ? ["exp://", "myapp://", "saueappen://"]
      : ["saueappen://"],
  plugins: [
    openAPI(), // /api/auth/reference
    expo(),
    admin({
      impersonationSessionDuration: 60 * 60 * 24 * 7, // 7 days
    }),
    bearer(),
    genericOAuth({
      config: [
        {
          clientId: env.ANIMALIA_CLIENT_ID,
          clientSecret: env.ANIMALIA_CLIENT_SECRET,
          providerId: "animalia",
          discoveryUrl:
            "https://staging-sso.animalia.no/.well-known/openid-configuration",
          scopes: ["openid", "profile", "email", "offline_access"],
        },
      ],
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 29, // 1 day (every 1 day the session expiration is updated)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },

  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      // redirectURI: env.BETTER_AUTH_URL + "/api/auth/callback/discord",
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  // account: {
  //   accountLinking: {
  //     enabled: true,
  //     trustedProviders: ["discord", ],
  //   },
  // },
  // emailAndPassword: {
  //   enabled: true,
  //   requireEmailVerification: true,
  //   autoSignIn: false,
  //   sendResetPassword: async ({ user, url }) => {
  //     const { error } = await sendResetPasswordEmail({
  //       email: user.email,
  //       verificationUrl: url,
  //     });

  //     if (error) return console.log("sendResetPasswordEmail Error: ", error);
  //   },
  // },
  // emailVerification: {
  //   sendOnSignUp: true,
  //   expiresIn: 60 * 60 * 1, // 1 HOUR
  //   autoSignInAfterVerification: true,
  //   sendVerificationEmail: async ({ user, token }) => {
  //     const verificationUrl = `${env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${env.EMAIL_VERIFICATION_CALLBACK_URL}`;
  //     const { error } = await sendVerificationEmail({
  //       email: user.email,
  //       verificationUrl: verificationUrl,
  //     });

  //     if (error) return console.log("sendVerificationEmail Error: ", error);
  //   },
  // },
} satisfies BetterAuthOptions);

export const getServerSession = cache(
  async () =>
    await auth.api.getSession({
      headers: await headers(),
    }),
);

export type Session = typeof auth.$Infer.Session;
export type AuthUserType = Session["user"];
