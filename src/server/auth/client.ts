import { adminClient, genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "~/env";

export const authClient = createAuthClient({
  fetchOptions: {
    onRequest: (request) => {
      console.log("Sending request to auth server:", request);
    },
  },
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL, // the base url of your auth server
  plugins: [adminClient(), genericOAuthClient()],
});
