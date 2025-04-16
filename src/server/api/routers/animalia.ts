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
        path: "/animalia/pasture",
      },
    })
    .output(AnimaliaResponse)
    .mutation(async ({ ctx, input }) => {
      const { data: livestock, error: livestockError } =
        await ctx.animalia.getLivestock({
          accessToken: ctx.accessToken,
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
        accessToken: ctx.accessToken,
        producerNumber: ctx.session.user.name,
        registrations: birthYearMap,
      });

      if (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error registering pasture: ${JSON.stringify(error)}`,
        });
      }

      console.log("DATA FROM REGISTRATION: ", data);

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
      const { data: livestock, error: livestockError } =
        await ctx.animalia.getLivestock({
          accessToken: ctx.accessToken,
          producerNumber: ctx.session.user.name,
        });

      if (livestockError)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: livestockError.message,
        });

      const birthYearMap = input.registrations.map((req) => {
        const { individnr, medlemsnr } = ctx.animalia.getEIDParts(req.ewe);
        return {
          sheepnumber: individnr,
          date: req.date,
          fetusCount: req.fetusCount,
          membernumber: medlemsnr,
          birthYear:
            livestock?.find((sheep) => {
              return (
                sheep.fodselindividnr === individnr &&
                sheep.fodselmedlemsnr === medlemsnr
              );
            })?.fodselaar ?? "",
        };
      });

      // console.log(birthYearMap.find((sheep) => sheep.ewe.includes("81097")));

      const { data, error } = await ctx.animalia.registerFetalCount({
        accessToken: ctx.accessToken,
        producerNumber: ctx.session.user.name,
        registrations: birthYearMap.map((reg) => ({
          ewe:
            reg.membernumber +
            "/" +
            reg.sheepnumber +
            " (" +
            reg.birthYear +
            ")",
          date: reg.date,
          fetusCount: reg.fetusCount,
        })),
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

      // console.log(mappedData);

      // console.log(data);

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
});
