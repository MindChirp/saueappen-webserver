import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { log } from "~/server/db/schema";

export const loggingRouter = createTRPCRouter({
  log: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/logging/log",
      },
    })
    .input(
      z.object({
        appVersion: z.string(),
        timestamp: z.string(),
        os: z.string(),
        osVersion: z.string(),
        deviceModel: z.string(),
        fingerprint: z.string(),
        message: z.string(),
      }),
    )
    .output(z.null())
    .mutation(async ({ ctx, input }) => {
      // Store the log in the database
      await ctx.db.insert(log).values({
        id: crypto.randomUUID(),
        appVersion: input.appVersion,
        timestamp: input.timestamp,
        os: input.os,
        osVersion: input.osVersion,
        deviceModel: input.deviceModel,
        fingerprint: input.fingerprint,
        message: input.message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return null;
    }),
});
