// Read and fill the inputs rendered by ContactFields.astro.
import type { ContactMethod, Member } from "../lib/client";

export interface ContactValues {
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  preferred_contact: ContactMethod | "";
  discord_username: string;
}

export function readContactFields(form: HTMLFormElement): ContactValues {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const values: ContactValues = {
    first_name: text("first_name"),
    last_name: text("last_name"),
    phone: text("phone"),
    preferred_contact: text("preferred_contact") as ContactMethod | "",
    discord_username: text("discord_username"),
  };
  if (form.querySelector("[name=email]")) values.email = text("email");
  return values;
}

export function fillContactFields(form: HTMLFormElement, member: Partial<Member>) {
  for (const name of ["first_name", "last_name", "phone", "discord_username"] as const) {
    const input = form.querySelector<HTMLInputElement>(`[name=${name}]`);
    if (input) input.value = member[name] ?? "";
  }
  for (const radio of form.querySelectorAll<HTMLInputElement>("[name=preferred_contact]")) {
    radio.checked = radio.value === member.preferred_contact;
  }
  form.querySelector(".contact-fields")?.dispatchEvent(new Event("contact-fields:filled"));
}
