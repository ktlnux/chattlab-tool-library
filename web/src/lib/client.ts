// Browser-side PocketBase client and member sign-in state.
// Import only from client <script> tags; the server uses ./pb.ts.
import PocketBase, { ClientResponseError, type RecordModel } from "pocketbase";

export const pb = new PocketBase(window.location.origin);
pb.autoCancellation(false);

export type ContactMethod = "email" | "phone" | "discord";

export interface Member extends RecordModel {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  preferred_contact: ContactMethod | "";
  discord_username: string;
  /** Set by editors: this member's issue reports skip review. */
  trusted: boolean;
}

export const CONTACT_LABELS: Record<ContactMethod, string> = {
  email: "Email",
  phone: "Phone",
  discord: "Discord",
};

/** The signed-in member, or null. (Editors sign in to the dashboard separately.) */
export function currentMember(): Member | null {
  const record = pb.authStore.record;
  if (!pb.authStore.isValid || record?.collectionName !== "users") return null;
  return record as Member;
}

/** Refresh the saved sign-in with the server, dropping it if the account is gone. */
export async function refreshMember(): Promise<Member | null> {
  if (!currentMember()) return null;
  try {
    await pb.collection("users").authRefresh();
  } catch (err) {
    if (err instanceof ClientResponseError && err.status !== 0) pb.authStore.clear();
  }
  return currentMember();
}

/** "Kim Reyes" -> "Kim R.", matching how the server shows names. */
export function shortName(first: string, last: string) {
  first = first.trim();
  last = last.trim();
  if (!first && !last) return "Member";
  return last ? `${first} ${last.charAt(0).toUpperCase()}.`.trim() : first;
}

/** What a steward needs to get back to someone about an issue. */
export function missingContactInfo(m: Pick<Member, "first_name" | "last_name" | "preferred_contact" | "email" | "phone" | "discord_username">) {
  const missing: string[] = [];
  if (!m.first_name?.trim()) missing.push("first name");
  if (!m.last_name?.trim()) missing.push("last name");
  if (!m.preferred_contact) missing.push("preferred contact method");
  else if (m.preferred_contact === "email" && !m.email?.trim()) missing.push("email address");
  else if (m.preferred_contact === "phone" && !m.phone?.trim()) missing.push("phone number");
  else if (m.preferred_contact === "discord" && !m.discord_username?.trim()) missing.push("Discord username");
  return missing;
}

/** A readable message from a PocketBase error (the server's own messages are written for members). */
export function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ClientResponseError) {
    if (err.status === 429) return "Too many attempts from this network. Please wait a few minutes and try again.";
    if (err.status === 0) return "Couldn't reach the server. Check your connection and try again.";
    const fieldError = Object.values(err.response?.data ?? {})[0] as { message?: string } | undefined;
    return fieldError?.message || err.response?.message || fallback;
  }
  return fallback;
}

/** Link to the sign-in page that returns here afterwards. */
export function signInUrl(next = window.location.pathname + window.location.hash) {
  return `/signin?next=${encodeURIComponent(next)}`;
}
