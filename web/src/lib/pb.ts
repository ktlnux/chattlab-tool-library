import PocketBase, { ClientResponseError } from "pocketbase";

// Server-side address of PocketBase (inside Docker: http://pocketbase:8090).
const PB_URL = process.env.PB_URL ?? "http://127.0.0.1:8090";

// Public base URL printed in QR codes. Must stay stable once stickers are printed.
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:4321").replace(/\/$/, "");

interface BaseRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
}

export interface Contact extends BaseRecord {
  name: string;
  role: string;
  contact_method: string;
  contact_link: string;
}

export type MachineStatus = "working" | "repair_in_progress" | "out_of_service";

export const STATUS_LABELS: Record<MachineStatus, string> = {
  working: "Working",
  repair_in_progress: "Repair in progress",
  out_of_service: "Out of service",
};

export interface Machine extends BaseRecord {
  code: string;
  name: string;
  status: MachineStatus;
  make: string;
  model: string;
  serial: string;
  category: string;
  area: string;
  summary: string;
  photo: string;
  training_required: boolean;
  safety: string;
  quick_start: string;
  specs: string;
  documents: string[];
  contacts: string[];
  expand?: { contacts?: Contact[] };
}

export interface TroubleshootingEntry extends BaseRecord {
  machine: string;
  symptom: string;
  likely_cause: string;
  fix: string;
  sort: number;
}

export interface Consumable extends BaseRecord {
  name: string;
  spec: string;
  part_number: string;
  storage_location: string;
  purchase_url: string;
  notes: string;
  machines: string[];
}

function client() {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  return pb;
}

export async function listMachines(): Promise<Machine[]> {
  return client().collection("machines").getFullList<Machine>({ sort: "area,name" });
}

export async function getMachineByCode(code: string): Promise<Machine | null> {
  const pb = client();
  try {
    return await pb
      .collection("machines")
      .getFirstListItem<Machine>(pb.filter("code = {:code}", { code: code.toUpperCase() }), { expand: "contacts" });
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) return null;
    throw err;
  }
}

export async function getMachineDetails(machine: Machine) {
  const pb = client();
  const [troubleshooting, consumables] = await Promise.all([
    pb.collection("troubleshooting").getFullList<TroubleshootingEntry>({
      filter: pb.filter("machine = {:id}", { id: machine.id }),
      sort: "sort,created",
    }),
    pb.collection("consumables").getFullList<Consumable>({
      filter: pb.filter("machines.id ?= {:id}", { id: machine.id }),
      sort: "name",
    }),
  ]);
  return { troubleshooting, consumables };
}

// Relative URL; Caddy (or the Vite dev proxy) routes /api/* to PocketBase.
export function fileUrl(record: BaseRecord, filename: string, thumb?: string) {
  const url = `/api/files/${record.collectionId}/${record.id}/${encodeURIComponent(filename)}`;
  return thumb ? `${url}?thumb=${thumb}` : url;
}

// PocketBase lowercases uploaded filenames and appends "_<10 random chars>";
// turn "owners_manual_l53u7grcvk.pdf" into "Owners manual" for display.
export function displayFilename(filename: string) {
  const name = filename.replace(/(_[a-z0-9]{10})?\.[^.]+$/i, "").replace(/[_-]+/g, " ").trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}
