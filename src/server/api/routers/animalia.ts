import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AnimaliaResponse,
  FetalEntry,
  PastureEntry,
  SheepSchema,
} from "../animalia/animalia-ctx";
import { animaliaProcedure, createTRPCRouter, publicProcedure } from "../trpc";

export const animaliaRouter = createTRPCRouter({
  livestock: animaliaProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/animalia/livestock",
      },
    })
    .input(
      z.object({
        limit: z.number().optional().default(10),
        offset: z.number().optional().default(0),
        fromBirthYear: z.string().optional(),
      }),
    )
    .output(
      z.object({
        animals: z.array(SheepSchema),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get the access token from the accounts table in the drizzle database

      const account = await ctx.db.query.account.findFirst({
        where: (account, { eq }) =>
          eq(account.providerId, "animalia") &&
          eq(account.userId, ctx.session.user.id),
        columns: { accessToken: true },
      });

      if (!account) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Du må være logget inn i animalia for å gjennomføre denne handlingen",
        });
      }

      const { data, error } = await ctx.animalia.getLivestock({
        accessToken: account.accessToken ?? "",
        producerNumber: ctx.session.user.name,
        fromBirthYear: input.fromBirthYear,
      });

      if (error) {
        throw new Error(`Error fetching data: ${JSON.stringify(error)}`);
      }

      /**
       * This code can be used for debugging the schema if something is not right
       */
      // const result = z
      //   .object({
      //     animals: z.array(SheepSchema),
      //   })
      //   .safeParse({
      //     animals: data,
      //   });
      //
      //console.log(result.error);

      return {
        animals: data.slice(input.offset, input.limit),
      };
    }),
  status: publicProcedure
    .input(z.object({}))
    .meta({
      openapi: {
        method: "GET",
        path: "/animalia/status",
      },
    })
    .output(z.object({ status: z.string() }))
    .query(() => {
      return {
        status: "ok",
      };
    }),

  registerPasture: animaliaProcedure
    .input(
      z.object({
        registrations: z.array(PastureEntry.omit({ birthYear: true })),
      }),
    )
    .meta({
      openapi: {
        method: "POST",
        path: "/animalia/register-pasture",
      },
    })
    .output(AnimaliaResponse)
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.query.account.findFirst({
        where: (account, { eq }) =>
          eq(account.providerId, "animalia") &&
          eq(account.userId, ctx.session.user.id),
        columns: { accessToken: true },
      });

      const { data: livestock, error: livestockError } =
        await ctx.animalia.getLivestock({
          accessToken: account?.accessToken ?? "",
          producerNumber: ctx.session.user.name,
        });

      if (livestockError)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: livestockError.message,
        });

      const birthYearMap = input.registrations.map((req) => ({
        ...req,
        birthYear:
          livestock?.find(
            (sheep) =>
              sheep.oremerke === req.animalId.split(" ")[1]?.substring(7, 20),
          )?.fodselaar ?? "",
      })) as z.infer<typeof PastureEntry>[];

      const { data, error } = await ctx.animalia.registerPasture({
        accessToken: account?.accessToken ?? "",
        producerNumber: ctx.session.user.name,
        registrations: birthYearMap,
      });

      return data ?? [];
    }),

  registerFetalCount: animaliaProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/animalia/register-fetal-count",
        contentTypes: ["application/json"],
      },
    })
    .input(
      z.object({
        registrations: z.array(FetalEntry.omit({ birthYear: true })),
      }),
    )

    .output(AnimaliaResponse)
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.query.account.findFirst({
        where: (account, { eq }) =>
          eq(account.providerId, "animalia") &&
          eq(account.userId, ctx.session.user.id),
        columns: { accessToken: true },
      });

      const { data: livestock, error: livestockError } =
        await ctx.animalia.getLivestock({
          accessToken: account?.accessToken ?? "",
          producerNumber: ctx.session.user.name,
        });

      console.log(livestockError);

      if (livestockError)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: livestockError.message,
        });

      const birthYearMap = input.registrations.map(
        (req) =>
          ({
            ...req,
            birthYear:
              livestock?.find(
                (sheep) =>
                  sheep.oremerke === req.ewe.split(" ")[1]?.substring(7, 20),
              )?.fodselaar ?? "",
          }) as z.infer<typeof FetalEntry>,
      );

      const { data, error } = await ctx.animalia.registerFetalCount({
        accessToken: account?.accessToken ?? "",
        producerNumber: ctx.session.user.name,
        registrations: birthYearMap,
      });

      if (error) {
        console.error(error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Error registering fetal count: ${JSON.stringify(error)}`,
        });
      }

      // Map individual "individ" ids to VIDs
      const mappedData = data?.map((reg) => {
        return {
          ...reg,
          individ: reg.individ.split("/")[1]?.split(" ")[0] ?? "",
        };
      });

      console.log(data);

      return mappedData;
    }),
});
