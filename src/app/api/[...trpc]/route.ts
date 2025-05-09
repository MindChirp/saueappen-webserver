import { createOpenApiFetchHandler } from "trpc-to-openapi";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const handler = (req: Request) => {
  // Handle incoming OpenAPI requests
  return createOpenApiFetchHandler({
    endpoint: "/api",
    router: appRouter,
    createContext: (ctx) => createTRPCContext({ headers: ctx.req.headers }),
    req,
  });
};

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
