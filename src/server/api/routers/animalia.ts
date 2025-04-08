import { betterFetch } from "@better-fetch/fetch";
import { animaliaProcedure, createTRPCRouter } from "../trpc";
export const animaliaRouter = createTRPCRouter({
  livestock: animaliaProcedure.query(async ({ ctx }) => {
    // Get the access token from the accounts table in the drizzle database
    const account = await ctx.db.query.account.findFirst({
      where: (account, { eq }) =>
        eq(account.providerId, "animalia") &&
        eq(account.userId, ctx.session.user.id),
      columns: { accessToken: true },
    });

    const { data, error } = await betterFetch<Sheep[]>(
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
    return data;
  }),
});

export type Sheep = {
  id: number;
  selgerProdnr: string | null;
  selgerNavn: string | null;
  oremerke: string;
  fodselindividnr: string;
  fodselmedlemsnr: string;
  fodselaar: number;
  kaaringsnr: string | null;
  navn: string | null;
  kjopsdato: string | null; // ISO date string
  inndato: string | null; // ISO date string
  innkodeId: number | null;
  raseId: number | null;
  fodseldato: string | null; // ISO date string
  kjonnId: number | null;
  mor: string | null;
  morFodselaar: number | null;
  fostermor: string | null;
  fostermorFodselaar: number | null;
  far: string | null;
  farFodselaar: number | null;
  farKaaringsnr: string | null;
  farNavn: string | null;
  oppvekstkodeId: number | null;
  fravendtDato: string | null; // ISO date string
  fargeId: number | null;
  tegningMonsterId: number | null;
  fodselhjelpId: number | null;
  hornstatus: number | null;
  utrangeringsaarsakId: number | null;
  speneantall: number | null;
  beiteBingeId: number | null;
  beiteBingeInndato: string | null; // ISO date string
  utdato: string | null; // ISO date string
  utkodeId: number | null;
  kategorier: string | null;
};
