"use client";

import { Loader } from "lucide-react";
import { api } from "~/trpc/react";

function AnimaliaRequest() {
  const { data, isLoading, error } = api.animalia.livestock.useQuery();
  if (isLoading && !error)
    return (
      <div>
        <Loader className="animate-spin" />
      </div>
    );
  return (
    <div className="grid grid-cols-8 gap-5">
      {data &&
        !isLoading &&
        data.map((animal) => (
          <div key={animal.id + "sau"} className="rounded-3xl bg-slate-600 p-3">
            <h1>{animal.id}</h1>
            <p>{animal.far}</p>
          </div>
        ))}
      {error?.message}
    </div>
  );
}

export default AnimaliaRequest;
