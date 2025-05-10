import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AnimaliaResponse,
  PastureEntry,
  PastureSchema,
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

      const { data, error } = await ctx.animalia.getLivestock({
        accessToken: ctx.accessToken,
        producerNumber: ctx.producernumer,
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
        registrations: z.array(PastureEntry),
      }),
    )
    .meta({
      openapi: {
        method: "POST",
        path: "/animalia/pasture",
      },
    })
    .output(AnimaliaResponse)
    .mutation(async ({ ctx, input }) => {
      const ids = await ctx.animalia.translateToAnimaliaIds({
        accessToken: ctx.accessToken,
        producerNumber: ctx.session.user.name,
        EIDs: input.registrations.map((reg) => reg.animalId),
      });

      if (ids.isErr()) {
        console.error(ids.error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error translating EIDs to Animalia IDs: ${JSON.stringify(
            ids.error,
          )}`,
        });
      }

      const { data, error } = await ctx.animalia.registerPasture({
        accessToken: ctx.accessToken,
        producerNumber: ctx.session.user.name,
        registrations: ids.value.map((reg, index) => ({
          date: input.registrations[index]?.date ?? "",
          animalId: reg.animaliaID ?? "",
          pastureId: input.registrations[index]?.pastureId ?? "",
        })),
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error registering pasture: ${JSON.stringify(error)}`,
        });
      }

      const mappedData = data?.map((reg) => {
        return {
          ...reg,
          individ: reg.individ.split("/")[1]?.split(" ")[0] ?? "",
        };
      });

      return mappedData;
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
        registrations: z.array(
          z.object({
            ewe: z.string(),
            date: z.string(),
            fetusCount: z.number().min(0),
          }),
        ),
      }),
    )

    .output(AnimaliaResponse)
    .mutation(async ({ ctx, input }) => {
      const ids = await ctx.animalia.translateToAnimaliaIds({
        accessToken: ctx.accessToken,
        producerNumber: ctx.session.user.name,
        EIDs: input.registrations.map((reg) => reg.ewe),
      });

      if (ids.isErr()) {
        console.error(ids.error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error translating EIDs to Animalia IDs: ${JSON.stringify(
            ids.error,
          )}`,
        });
      }

      const { data, error } = await ctx.animalia.registerFetalCount({
        accessToken: ctx.accessToken,
        producerNumber: ctx.session.user.name,
        registrations: ids.value.map((reg, index) => {
          if (input.registrations[index]?.fetusCount == undefined)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Fetal count is undefined for ewe ${reg.animaliaID}`,
            });

          return {
            ewe: reg.animaliaID!,
            date: input.registrations[index]?.date ?? "",
            fetusCount: input.registrations[index]?.fetusCount,
          };
        }),
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

      return mappedData;
    }),
  getPastures: animaliaProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/animalia/pastures",
      },
    })
    .output(z.array(PastureSchema))
    .input(z.undefined())
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.animalia.getPastures({
        accessToken: ctx.accessToken,
        producerNumber: ctx.session.user.name,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error fetching pastures: ${JSON.stringify(error)}`,
        });
      }

      return data;
    }),

  // This will be completed in another PR
  // registerReleaseToPasture: animaliaProcedure
  // .meta({
  //   openapi: {
  //     method: "POST",
  //     path: "/animalia/release-to-pasture",
  //   }
  // }).output(AnimaliaResponse).input(z.object({
  //   sheepId
  // }))
});
