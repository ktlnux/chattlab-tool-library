/// <reference path="../pb_data/types.d.ts" />

// Machine codes are printed on QR stickers, so they are normalized to
// uppercase on create and cannot be changed afterwards.

onRecordCreate((e) => {
  e.record.set("code", e.record.getString("code").trim().toUpperCase());
  e.next();
}, "machines");

onRecordUpdate((e) => {
  const before = e.record.original().getString("code");
  if (e.record.getString("code") !== before) {
    throw new BadRequestError(
      `Machine code "${before}" is printed on its QR sticker and cannot be changed. Create a new machine instead.`
    );
  }
  e.next();
}, "machines");

// Log what an editor changed in the dashboard, for the machine page's History section.
// (Status changes made by tool issue hooks don't go through a request, so they aren't logged
// here; the issue's own updates already appear in the history.)
onRecordUpdateRequest((e) => {
  const { STEWARD } = require(`${__hooks}/lib/issues.js`);
  const labels = {
    name: "name", make: "make", model: "model", serial: "serial number", category: "category",
    area: "area", summary: "summary", description: "description", photo: "photo",
    training_required: "training requirement", safety: "safety notes", quick_start: "quick start",
    specs: "specs", documents: "documents", contacts: "contacts", status: "status",
  };
  const before = e.record.original();
  const changed = [];
  for (const [field, label] of Object.entries(labels)) {
    if (JSON.stringify(before.get(field)) !== JSON.stringify(e.record.get(field))) changed.push(label);
  }

  e.next();

  if (changed.length === 0) return;
  let summary = `Updated ${changed.join(", ")}`;
  if (changed.includes("status")) {
    const names = { working: "Working", repair_in_progress: "Repair in progress", out_of_service: "Out of service" };
    summary += ` (status: ${names[e.record.getString("status")] || e.record.getString("status")})`;
  }
  const log = new Record(e.app.findCollectionByNameOrId("machine_changes"));
  log.set("machine", e.record.id);
  log.set("summary", summary);
  log.set("author_display", STEWARD);
  e.app.save(log);
}, "machines");
