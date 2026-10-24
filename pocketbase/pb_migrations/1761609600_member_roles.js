/// <reference path="../pb_data/types.d.ts" />

// Member roles: only signed-in members can report issues, and their reports wait for a steward's
// approval unless an editor has marked them trusted.
//
// - users.trusted: set by editors in the dashboard; members can't set it on themselves.
// - tool_issues.approved: unapproved issues show as "Pending review" and don't change the
//   machine's status (pb_hooks/lib/issues.js).

const REPORT_ROUTE = "POST /api/tool-issues/report";

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new BoolField({ name: "trusted" }));
  // Sign-up stays public. Superusers bypass these rules, so editors can still set trusted.
  users.createRule = "@request.body.trusted:isset = false";
  users.updateRule = "id = @request.auth.id && @request.body.trusted:isset = false";
  app.save(users);

  const issues = app.findCollectionByNameOrId("tool_issues");
  issues.fields.add(new BoolField({ name: "approved" }));
  app.save(issues);
  // Everything reported so far stays as it was.
  app.db().newQuery("UPDATE tool_issues SET approved = TRUE").execute();

  const settings = app.settings();
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules.filter((rule) => rule.label !== REPORT_ROUTE),
    // Generous because everyone on the space's Wi-Fi shares one IP.
    { label: REPORT_ROUTE, audience: "@auth", duration: 600, maxRequests: 10 },
  ];
  app.save(settings);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("trusted");
  users.createRule = "";
  users.updateRule = "id = @request.auth.id";
  app.save(users);

  const issues = app.findCollectionByNameOrId("tool_issues");
  issues.fields.removeByName("approved");
  app.save(issues);

  const settings = app.settings();
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules.filter((rule) => rule.label !== REPORT_ROUTE),
    { label: REPORT_ROUTE, audience: "@guest", duration: 600, maxRequests: 10 },
  ];
  app.save(settings);
});
