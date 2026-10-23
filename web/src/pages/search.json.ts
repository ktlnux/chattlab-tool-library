import type { APIRoute } from "astro";
import { listMachines, STATUS_LABELS } from "../lib/pb";

// Machine index for the header search suggestions.
// Lives at /search.json because /api/* is routed to PocketBase.
export const GET: APIRoute = async () => {
  const machines = await listMachines();
  const body = machines.map(({ code, name, make, model, area, status }) => ({
    code,
    name,
    make,
    model,
    area,
    status,
    statusLabel: STATUS_LABELS[status] ?? STATUS_LABELS.working,
  }));
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
};
