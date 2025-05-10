import { betterFetch, createFetch } from "@better-fetch/fetch";
import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";
import { z } from "zod";

interface AuthCredentials {
  accessToken: string;
  producerNumber: string;
}

const $fetch = createFetch({
  baseURL: "https://test-sau.animalia.no",
  onRequest: (ctx) => {
    console.log("Request to animalia: ", ctx);
    return ctx;
  },
});

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

export const PastureSchema = z.object({
  id: z.number(),
  aktiv: z.number(),
  navn: z.string(),
  beiteBingeTypeId: z.number(),
});

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
});

export const FetalEntry = z.object({
  ewe: z.string(),
  date: z.string(),
  fetusCount: z.number().min(0),
});

export const getEIDParts = (ewe: string) => {
  const parts = ewe.split(" ");
  const individnr = parts[1]?.substring(7, 20);
  return {
    individnr,
    medlemsnr: parts[1]?.substring(0, 7),
  };
};

/**
 * This function retrieves livestock entries for a given producer number and access token.
 * @param param0
 * @returns List of livestock entries
 */
export const getLivestock = async ({
  fromBirthYear,
  accessToken,
  producerNumber,
}: { fromBirthYear?: string } & AuthCredentials) => {
  return $fetch<z.infer<typeof SheepSchema>[]>(`/webservice/hentBesetning`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    query: {
      prodnr: producerNumber,
      fraFodselsaar: fromBirthYear,
    },
  });
};

/**
 * This function registers fetal count entries for a given producer number and access token.
 * @param param0
 * @returns List of issues relating to the registration
 */
export const registerFetalCount = async ({
  accessToken,
  producerNumber,
  registrations,
}: {
  registrations: z.infer<typeof FetalEntry>[];
} & AuthCredentials) => {
  const data = registrations.map((reg) => ({
    soye: reg.ewe,
    dato: reg.date,
    antallFoster: reg.fetusCount,
  }));
  return $fetch<z.infer<typeof AnimaliaResponse>>(
    `/webservice/registrerFostertelling`,
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

/**
 * This function retrieves pasture entries for a given producer number and access token.
 * @param param0
 * @returns List of pastures
 */
export const getPastures = async ({
  accessToken,
  producerNumber,
}: AuthCredentials) => {
  return $fetch<z.infer<typeof PastureSchema>[]>(`/webservice/hentBeiteBinge`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    query: {
      prodnr: producerNumber,
    },
  });
};

/**
 * This function registers pasture entries for a given producer number and access token.
 * @param param0
 * @returns List of issues relating to the registration
 */
export const registerPasture = async ({
  accessToken,
  producerNumber,
  registrations,
}: {
  registrations: z.infer<typeof PastureEntry>[];
} & AuthCredentials) => {
  return $fetch<z.infer<typeof AnimaliaResponse>>(
    `/webservice/registrerBeiteBinge`,
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

type AnimaliaId = {
  sheepnumber?: string;
  membernumber?: string;
  birthYear: string | number;
  animaliaID?: string;
};

/**
 * This function translates standard EIDs in the format of 555 555555555555 (where 5 are random numbers) to the supported
 * Animalia ID format of 5555555/55555 (yyyy) (where 5 are random numbers and yyyy is the birth year).
 * @param param0
 * @returns
 */
export const translateToAnimaliaIds = async ({
  EIDs,
  accessToken,
  producerNumber,
}: { EIDs: string[] } & AuthCredentials): Promise<
  Result<AnimaliaId[], { message?: string; status: number; statusText: string }>
> => {
  const { data: livestock, error: livestockError } = await getLivestock({
    accessToken: accessToken,
    producerNumber: producerNumber,
  });

  if (livestockError) return err(livestockError);

  const birthYearMap = EIDs.map((i) => {
    const { individnr, medlemsnr } = getEIDParts(i);
    const birthYear =
      livestock?.find((sheep) => {
        return (
          sheep.fodselindividnr === individnr &&
          sheep.fodselmedlemsnr === medlemsnr
        );
      })?.fodselaar ?? "";

    return {
      sheepnumber: individnr,
      membernumber: medlemsnr,
      birthYear,
      animaliaID: `${medlemsnr}/${individnr} (${birthYear})`,
    };
  });

  return ok(birthYearMap);
};

/**
 * Barrel export for adding all functions to the trpc context
 */
const animalia = {
  getLivestock,
  registerPasture,
  getPastures,
  registerFetalCount,
  translateToAnimaliaIds,
  getEIDParts,
};

export default animalia;
