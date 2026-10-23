/// <reference path="../pb_data/types.d.ts" />

// Members report machine problems from the machine page without logging in.
// Reports are only visible to editors, in the dashboard's issue_reports collection.

migrate((app) => {
  const machines = app.findCollectionByNameOrId("machines");

  // Show machine names (not record IDs) wherever a machine is linked in the dashboard.
  machines.fields.getByName("name").presentable = true;
  app.save(machines);

  const reports = new Collection({
    type: "base",
    name: "issue_reports",
    listRule: null,
    viewRule: null,
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "machine", collectionId: machines.id, maxSelect: 1, required: true, cascadeDelete: true },
      { type: "text", name: "summary", required: true, max: 120 },
      { type: "text", name: "details", max: 2000 },
      // true when the reporter said the machine can't be used at all; marks it out of service.
      { type: "bool", name: "machine_disabled" },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
  });
  app.save(reports);

  const settings = app.settings();
  // Caddy passes the visitor's IP in X-Forwarded-For; without this every request looks like it comes from Caddy.
  settings.trustedProxy.headers = ["X-Forwarded-For"];
  settings.trustedProxy.useLeftmostIP = false;
  // Limit anonymous report spam. Generous because everyone on the space's Wi-Fi shares one IP.
  settings.rateLimits.enabled = true;
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules.filter((rule) => rule.label !== "issue_reports:create"),
    { label: "issue_reports:create", audience: "@guest", duration: 600, maxRequests: 10 },
  ];
  app.save(settings);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("issue_reports"));

  const machines = app.findCollectionByNameOrId("machines");
  machines.fields.getByName("name").presentable = false;
  app.save(machines);

  const settings = app.settings();
  settings.rateLimits.rules = settings.rateLimits.rules.filter((rule) => rule.label !== "issue_reports:create");
  app.save(settings);
});
