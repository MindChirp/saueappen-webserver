import { betterFetch } from "@better-fetch/fetch";
import { animaliaProcedure, createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";

const SheepSchema = z.object({
  id: z.number(),
  selgerProdnr: z.string().nullable().optional(),
  selgerNavn: z.string().nullable().optional(),
  oremerke: z.string().optional(),
  fodselindividnr: z.string().optional(),
  fodselmedlemsnr: z.string().optional(),
  fodselaar: z.number().optional(),
  kaaringsnr: z.number().nullable(),
  navn: z.string().nullable(),
  kjopsdato: z.string().nullable(), // ISO date string
  inndato: z.string().nullable(), // ISO date string
  innkodeId: z.number().nullable(),
  raseId: z.number().nullable(),
  fodseldato: z.string().nullable(), // ISO date string
  kjonnId: z.number().nullable(),
  mor: z.string().nullable(),
  morFodselaar: z.number().nullable(),
  fostermor: z.string().nullable(),
  fostermorFodselaar: z.number().nullable(),
  far: z.string().nullable(),
  farFodselaar: z.number().nullable(),
  farKaaringsnr: z.number().nullable(),
  farNavn: z.string().nullable(),
  oppvekstkodeId: z.number().nullable(),
  fravendtDato: z.string().nullable(), // ISO date string
  fargeId: z.number().nullable(),
  tegningMonsterId: z.number().nullable(),
  fodselhjelpId: z.number().nullable(),
  hornstatus: z.number().nullable(),
  utrangeringsaarsakId: z.number().nullable(),
  speneantall: z.number().nullable(),
  beiteBingeId: z.number().nullable(),
  beiteBingeInndato: z.string().nullable(), // ISO date string
  utdato: z.string().nullable(), // ISO date string
  utkodeId: z.number().nullable(),
  kategorier: z.string().nullable(),
});

export const animaliaRouter = createTRPCRouter({
  livestock: animaliaProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/animalia/livestock",
      },
    })
    .input(z.object({}))
    .output(
      z.object({
        animals: z.array(SheepSchema),
      }),
    )
    .query(async ({ ctx }) => {
      // Get the access token from the accounts table in the drizzle database
      const account = await ctx.db.query.account.findFirst({
        where: (account, { eq }) =>
          eq(account.providerId, "animalia") &&
          eq(account.userId, ctx.session.user.id),
        columns: { accessToken: true },
      });

      const { data, error } = await betterFetch<z.infer<typeof SheepSchema>[]>(
        `https://test-sau.animalia.no/webservice/hentBesetning`,
        {
          headers: {
            Authorization: `Bearer ${account?.accessToken}`,
          },
          query: {
            prodnr: ctx.session.user.name,
          },
        },
      );

      if (error) {
        throw new Error(`Error fetching data: ${error.message}`);
      }
      const result = z
        .object({
          animals: z.array(SheepSchema),
        })
        .safeParse({
          animals: data,
        });

      console.log(result.error);

      return {
        animals: data,
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
      console.log("Got request");
      return {
        status: "ok",
      };
    }),
});
