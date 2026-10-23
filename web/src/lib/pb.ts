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
  description: string;
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

export interface DocumentationLink extends BaseRecord {
  machine: string;
  title: string;
  url: string;
  sort: number;
}

export type IssueStatus = "needs_repair" | "repair_in_progress" | "completed";
export type IssueSeverity = "out_of_operation" | "operational";

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  needs_repair: "Needs repair",
  repair_in_progress: "Repair in progress",
  completed: "Completed",
};

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  out_of_operation: "Out of operation",
  operational: "Still usable",
};

// The site only ever receives the public fields; reporter contact details are hidden fields
// that PocketBase returns to superusers (the dashboard) only.
export interface ToolIssue extends BaseRecord {
  machine: string;
  title: string;
  details: string;
  severity: IssueSeverity;
  status: IssueStatus;
  closed_at: string;
  reporter_display: string;
  expand?: { machine?: Machine };
}

export interface IssueUpdate extends BaseRecord {
  issue: string;
  machine: string;
  author_display: string;
  comment: string;
  new_status: IssueStatus | "";
  expand?: { issue?: ToolIssue };
}

export interface MaintenanceLog extends BaseRecord {
  machine: string;
  title: string;
  notes: string;
  performed_on: string;
  author_display: string;
}

export interface MachineChange extends BaseRecord {
  machine: string;
  summary: string;
  author_display: string;
}

export interface HistoryEvent {
  key: string;
  kind: "created" | "updated" | "maintenance" | "issue_reported" | "issue_update";
  date: string;
  /** True when the date is a calendar day without a time (maintenance "performed on"). */
  dayOnly?: boolean;
  title: string;
  body?: string;
  actor?: string;
  href?: string;
  status?: IssueStatus;
}

/** PocketBase dates ("2026-10-22 22:21:31.123Z") as ISO strings, or "" when unset. */
export function isoDate(value: string) {
  return value ? value.replace(" ", "T") : "";
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
  const [troubleshooting, consumables, links, openIssues] = await Promise.all([
    pb.collection("troubleshooting").getFullList<TroubleshootingEntry>({
      filter: pb.filter("machine = {:id}", { id: machine.id }),
      sort: "sort,created",
    }),
    pb.collection("consumables").getFullList<Consumable>({
      filter: pb.filter("machines.id ?= {:id}", { id: machine.id }),
      sort: "name",
    }),
    pb.collection("documentation_links").getFullList<DocumentationLink>({
      filter: pb.filter("machine = {:id}", { id: machine.id }),
      sort: "sort,title",
    }),
    pb.collection("tool_issues").getFullList<ToolIssue>({
      filter: pb.filter("machine = {:id} && status != 'completed'", { id: machine.id }),
      sort: "-created",
    }),
  ]);
  return { troubleshooting, consumables, links, openIssues };
}

/** Everything that has happened to a machine, most recent first. */
export async function getMachineHistory(machine: Machine): Promise<HistoryEvent[]> {
  const pb = client();
  const byMachine = { filter: pb.filter("machine = {:id}", { id: machine.id }) };
  const [changes, maintenance, issues, updates] = await Promise.all([
    pb.collection("machine_changes").getFullList<MachineChange>(byMachine),
    pb.collection("maintenance_logs").getFullList<MaintenanceLog>(byMachine),
    pb.collection("tool_issues").getFullList<ToolIssue>(byMachine),
    pb.collection("issue_updates").getFullList<IssueUpdate>({ ...byMachine, expand: "issue" }),
  ]);

  const events: HistoryEvent[] = [
    { key: `created-${machine.id}`, kind: "created", date: isoDate(machine.created), title: "Added to the tool library" },
    ...changes.map((c): HistoryEvent => ({
      key: c.id,
      kind: "updated",
      date: isoDate(c.created),
      title: "Information updated",
      body: c.summary,
      actor: c.author_display,
    })),
    ...maintenance.map((m): HistoryEvent => {
      // performed_on is only set for backdated work (the dialog leaves it empty for today):
      // place it on its day (stored as midnight UTC) and show it without a time.
      const backdated = !!m.performed_on;
      return {
        key: m.id,
        kind: "maintenance",
        date: isoDate(backdated ? m.performed_on : m.created),
        dayOnly: backdated,
        title: m.title,
        body: m.notes,
        actor: m.author_display,
      };
    }),
    ...issues.map((i): HistoryEvent => ({
      key: i.id,
      kind: "issue_reported",
      date: isoDate(i.created),
      title: i.title,
      body: i.severity === "out_of_operation" ? "Reported as taking the machine out of operation." : undefined,
      actor: i.reporter_display,
      href: `/issues/${i.id}`,
    })),
    ...updates.map((u): HistoryEvent => {
      const issueTitle = u.expand?.issue?.title ?? "issue";
      const verb = { needs_repair: "Needs repair", repair_in_progress: "Repair started", completed: "Closed" };
      return {
        key: u.id,
        kind: "issue_update",
        date: isoDate(u.created),
        title: u.new_status ? `${verb[u.new_status]}: ${issueTitle}` : `Comment: ${issueTitle}`,
        body: u.comment,
        actor: u.author_display,
        href: `/issues/${u.issue}`,
        status: u.new_status || undefined,
      };
    }),
  ];
  return events.sort((a, b) => b.date.localeCompare(a.date));
}

/** A tool issue with its machine and updates (oldest first), or null if it doesn't exist. */
export async function getIssue(id: string) {
  const pb = client();
  try {
    const issue = await pb.collection("tool_issues").getOne<ToolIssue>(id, { expand: "machine" });
    const updates = await pb.collection("issue_updates").getFullList<IssueUpdate>({
      filter: pb.filter("issue = {:id}", { id }),
      sort: "created",
    });
    return { issue, updates };
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) return null;
    throw err;
  }
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
