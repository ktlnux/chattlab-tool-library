/// <reference path="../pb_data/types.d.ts" />

// Initial schema for the machine library.
// Everyone can read; only superusers (editors in the admin dashboard) can write.

const timestamps = [
  { type: "autodate", name: "created", onCreate: true, onUpdate: false },
  { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
];

const publicReadOnly = {
  listRule: "",
  viewRule: "",
  createRule: null,
  updateRule: null,
  deleteRule: null,
};

migrate((app) => {
  const contacts = new Collection({
    type: "base",
    name: "contacts",
    ...publicReadOnly,
    fields: [
      { type: "text", name: "name", required: true, max: 100 },
      { type: "text", name: "role", max: 100 },
      // What members see, e.g. "@woodshop on Discord". Avoid personal phone numbers/emails.
      { type: "text", name: "contact_method", max: 200 },
      // Optional tap-to-message link: https://..., mailto:..., etc.
      { type: "text", name: "contact_link", max: 500 },
      ...timestamps,
    ],
  });
  app.save(contacts);

  const machines = new Collection({
    type: "base",
    name: "machines",
    ...publicReadOnly,
    fields: [
      // Permanent ID printed on the QR sticker (/m/<code>). Locked after creation by pb_hooks.
      { type: "text", name: "code", required: true, min: 2, max: 12, pattern: "^[A-Za-z0-9-]+$" },
      { type: "text", name: "name", required: true, max: 150 },
      { type: "text", name: "make", max: 100 },
      { type: "text", name: "model", max: 100 },
      { type: "text", name: "serial", max: 100 },
      { type: "text", name: "category", max: 60 },
      { type: "text", name: "area", max: 60 },
      { type: "text", name: "summary", max: 400 },
      {
        type: "file",
        name: "photo",
        maxSelect: 1,
        maxSize: 10 * 1024 * 1024,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        thumbs: ["800x0"],
      },
      { type: "bool", name: "training_required" },
      { type: "editor", name: "safety" },
      { type: "editor", name: "quick_start" },
      { type: "editor", name: "specs" },
      {
        type: "file",
        name: "documents",
        maxSelect: 30,
        maxSize: 50 * 1024 * 1024,
        mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
      },
      { type: "relation", name: "contacts", collectionId: contacts.id, maxSelect: 10 },
      ...timestamps,
    ],
    indexes: ["CREATE UNIQUE INDEX idx_machines_code ON machines (code)"],
  });
  app.save(machines);

  const troubleshooting = new Collection({
    type: "base",
    name: "troubleshooting",
    ...publicReadOnly,
    fields: [
      { type: "relation", name: "machine", collectionId: machines.id, maxSelect: 1, required: true, cascadeDelete: true },
      { type: "text", name: "symptom", required: true, max: 200 },
      { type: "text", name: "likely_cause", max: 300 },
      { type: "editor", name: "fix" },
      // Lower numbers show first.
      { type: "number", name: "sort", onlyInt: true },
      ...timestamps,
    ],
  });
  app.save(troubleshooting);

  const consumables = new Collection({
    type: "base",
    name: "consumables",
    ...publicReadOnly,
    fields: [
      { type: "text", name: "name", required: true, max: 150 },
      // e.g. 10" diameter, 40T, 5/8" arbor
      { type: "text", name: "spec", max: 300 },
      { type: "text", name: "part_number", max: 100 },
      { type: "text", name: "storage_location", max: 150 },
      { type: "url", name: "purchase_url" },
      { type: "text", name: "notes", max: 500 },
      // One consumable can fit several machines.
      { type: "relation", name: "machines", collectionId: machines.id, maxSelect: 50 },
      ...timestamps,
    ],
  });
  app.save(consumables);
}, (app) => {
  for (const name of ["consumables", "troubleshooting", "machines", "contacts"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
