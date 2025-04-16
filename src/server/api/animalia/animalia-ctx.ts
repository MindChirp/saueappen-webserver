import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";

interface AuthCredentials {
  accessToken: string;
  producerNumber: string;
}

export const AnimaliaResponse = z.array(
  z.object({
    individ: z.string(),
    errors: z.array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    ),
  }),
);

export const SheepSchema = z.object({
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

export const PastureEntry = z.object({
  animalId: z.string(),
  date: z.string(),
  pastureId: z.string(),
  birthYear: z.string(),
});

export const FetalEntry = z.object({
  ewe: z.string(),
  birthYear: z.string(),
  date: z.string(),
  fetusCount: z.number().min(0),
});

export const getLivestock = async ({
  fromBirthYear,
  accessToken,
  producerNumber,
}: { fromBirthYear?: string } & AuthCredentials) => {
  return betterFetch<z.infer<typeof SheepSchema>[]>(
    `https://test-sau.animalia.no/webservice/hentBesetning`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      query: {
        prodnr: producerNumber,
        fraFodselsaar: fromBirthYear,
      },
    },
  );
};

export const registerFetalCount = async ({
  accessToken,
  producerNumber,
  registrations,
}: {
  registrations: z.infer<typeof FetalEntry>[];
} & AuthCredentials) => {
  const data = registrations.map((reg) => ({
    soye:
      reg.ewe.split(" ")[1]?.substring(0, 7) +
      "/" +
      reg.ewe.split(" ")[1]?.substring(7, 20) +
      "(" +
      reg.birthYear +
      ")",
    dato: reg.date,
    antallFoster: reg.fetusCount,
  }));
  return betterFetch<z.infer<typeof AnimaliaResponse>>(
    `https://test-sau.animalia.no/webservice/registrerFostertelling`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        prodnr: producerNumber,
        registreringer: data,
      },
    },
  );
};

export const registerPasture = async ({
  accessToken,
  producerNumber,
  registrations,
}: {
  registrations: z.infer<typeof PastureEntry>[];
} & AuthCredentials) => {
  return betterFetch<z.infer<typeof AnimaliaResponse>>(
    `https://test-sau.animalia.no/webservice/registrerBeiteBinge`,
    {
      method: "POST",
      body: {
        prodnr: producerNumber,
        registreringer: registrations.map((reg) => ({
          individ: reg.animalId,
          dato: reg.date,
          beiteBinge: reg.pastureId,
        })),
      },
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    },
  );
};

const animalia = {
  getLivestock,
  registerPasture,
  registerFetalCount,
};

export default animalia;
