import type { APIRoute } from "astro";
import { listMachines } from "../lib/pb";

// Machine index for the header search suggestions.
// Lives at /search.json because /api/* is routed to PocketBase.
export const GET: APIRoute = async () => {
  const machines = await listMachines();
  const body = machines.map(({ code, name, make, model, area }) => ({ code, name, make, model, area }));
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
};
