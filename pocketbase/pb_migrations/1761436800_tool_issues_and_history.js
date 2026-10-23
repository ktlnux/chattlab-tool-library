/// <reference path="../pb_data/types.d.ts" />

// Member accounts, tool issues with updates, a maintenance log and a machine change log.
//
// - users: profile fields (name, phone, preferred contact) and email-code (OTP) sign-in.
// - tool_issues: replaces issue_reports. Reporter contact details are hidden fields, so only
//   superusers (the dashboard) can see them; the site only ever shows reporter_display ("Kim R.").
// - issue_updates: comments and status changes on an issue, added by signed-in members.
// - maintenance_logs: maintenance entries added by signed-in members or editors.
// - machine_changes: written by hooks when an editor changes a machine in the dashboard.

const timestamps = [
  { type: "autodate", name: "created", onCreate: true, onUpdate: false },
  { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
];
const CONTACT_METHODS = ["email", "phone", "discord"];
const ISSUE_STATUSES = ["needs_repair", "repair_in_progress", "completed"];
const MEMBERS_ONLY = '@request.auth.collectionName = "users"';

migrate((app) => {
  const machines = app.findCollectionByNameOrId("machines");

  // --- Member profiles and email-code sign-in ---
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("name");
  users.fields.add(
    new TextField({ name: "first_name", max: 60 }),
    new TextField({ name: "last_name", max: 60 }),
    new TextField({ name: "phone", max: 30 }),
    new SelectField({ name: "preferred_contact", maxSelect: 1, values: CONTACT_METHODS }),
    new TextField({ name: "discord_username", max: 60 })
  );
  users.otp.enabled = true;
  users.otp.duration = 600;
  users.otp.length = 6;
  users.otp.emailTemplate.subject = "Your {APP_NAME} sign-in code";
  users.otp.emailTemplate.body =
    "<p>Hello,</p>\n<p>Your sign-in code is: <strong>{OTP}</strong></p>\n" +
    "<p>It expires in 10 minutes. If you didn't try to sign in, you can ignore this email.</p>";
  // Members sign in with emailed codes only; editors can still create accounts in the dashboard.
  users.passwordAuth.enabled = false;
  app.save(users);

  // --- Tool issues ---
  const issues = new Collection({
    type: "base",
    name: "tool_issues",
    listRule: "",
    viewRule: "",
    // Members and visitors report through POST /api/tool-issues/report (pb_hooks/tool_issues.pb.js),
    // which can write the hidden reporter fields; direct creates are for editors only.
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "machine", collectionId: machines.id, maxSelect: 1, required: true, cascadeDelete: true },
      { type: "text", name: "title", required: true, max: 150, presentable: true },
      { type: "text", name: "details", max: 4000 },
      { type: "select", name: "severity", required: true, maxSelect: 1, values: ["out_of_operation", "operational"] },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ISSUE_STATUSES },
      { type: "date", name: "closed_at" },
      { type: "relation", name: "reporter", collectionId: users.id, maxSelect: 1 },
      // Public: "Kim R." Everything below it is hidden from everyone except superusers.
      { type: "text", name: "reporter_display", max: 80 },
      { type: "text", name: "reporter_first_name", max: 60, hidden: true },
      { type: "text", name: "reporter_last_name", max: 60, hidden: true },
      { type: "email", name: "reporter_email", hidden: true },
      { type: "text", name: "reporter_phone", max: 30, hidden: true },
      { type: "select", name: "reporter_preferred_contact", maxSelect: 1, values: CONTACT_METHODS, hidden: true },
      { type: "text", name: "reporter_discord", max: 60, hidden: true },
      ...timestamps,
    ],
    indexes: ["CREATE INDEX idx_tool_issues_machine ON tool_issues (machine, status)"],
  });
  app.save(issues);

  const updates = new Collection({
    type: "base",
    name: "issue_updates",
    listRule: "",
    viewRule: "",
    createRule: MEMBERS_ONLY,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "issue", collectionId: issues.id, maxSelect: 1, required: true, cascadeDelete: true },
      // Copied from the issue by a hook so the machine's history is one query.
      { type: "relation", name: "machine", collectionId: machines.id, maxSelect: 1, cascadeDelete: true },
      { type: "relation", name: "author", collectionId: users.id, maxSelect: 1 },
      { type: "text", name: "author_display", max: 80 },
      { type: "text", name: "comment", max: 4000 },
      { type: "select", name: "new_status", maxSelect: 1, values: ISSUE_STATUSES },
      ...timestamps,
    ],
    indexes: ["CREATE INDEX idx_issue_updates_issue ON issue_updates (issue)", "CREATE INDEX idx_issue_updates_machine ON issue_updates (machine)"],
  });
  app.save(updates);

  // --- Maintenance log ---
  const maintenance = new Collection({
    type: "base",
    name: "maintenance_logs",
    listRule: "",
    viewRule: "",
    createRule: MEMBERS_ONLY,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "machine", collectionId: machines.id, maxSelect: 1, required: true, cascadeDelete: true },
      { type: "text", name: "title", required: true, max: 150, presentable: true },
      { type: "text", name: "notes", max: 4000 },
      // When the work was done, if not when it was logged.
      { type: "date", name: "performed_on" },
      { type: "relation", name: "author", collectionId: users.id, maxSelect: 1 },
      { type: "text", name: "author_display", max: 80 },
      ...timestamps,
    ],
    indexes: ["CREATE INDEX idx_maintenance_logs_machine ON maintenance_logs (machine)"],
  });
  app.save(maintenance);

  // --- Machine change log (written by hooks only) ---
  const changes = new Collection({
    type: "base",
    name: "machine_changes",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "machine", collectionId: machines.id, maxSelect: 1, required: true, cascadeDelete: true },
      { type: "text", name: "summary", max: 500, presentable: true },
      { type: "text", name: "author_display", max: 80 },
      ...timestamps,
    ],
    indexes: ["CREATE INDEX idx_machine_changes_machine ON machine_changes (machine)"],
  });
  app.save(changes);

  // --- Move existing issue reports into tool issues ---
  let oldReports = null;
  try {
    oldReports = app.findCollectionByNameOrId("issue_reports");
  } catch (_) {}
  if (oldReports) {
    for (const report of app.findAllRecords("issue_reports")) {
      const issue = new Record(issues);
      issue.set("machine", report.getString("machine"));
      issue.set("title", report.getString("summary"));
      issue.set("details", report.getString("details"));
      issue.set("severity", report.getBool("machine_disabled") ? "out_of_operation" : "operational");
      issue.set("status", "needs_repair");
      issue.set("reporter_display", "Anonymous");
      issue.set("created", report.getString("created"));
      app.save(issue);
    }
    app.delete(oldReports);
  }

  // --- Rate limits for guest and member submissions ---
  const settings = app.settings();
  const ours = ["issue_reports:create", "POST /api/tool-issues/report", "users:create", "users:requestOTP", "issue_updates:create", "maintenance_logs:create"];
  settings.rateLimits.enabled = true;
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules.filter((rule) => !ours.includes(rule.label)),
    // Generous because everyone on the space's Wi-Fi shares one IP.
    { label: "POST /api/tool-issues/report", audience: "@guest", duration: 600, maxRequests: 10 },
    { label: "users:create", audience: "@guest", duration: 600, maxRequests: 10 },
    { label: "users:requestOTP", audience: "", duration: 600, maxRequests: 10 },
    { label: "issue_updates:create", audience: "@auth", duration: 600, maxRequests: 30 },
    { label: "maintenance_logs:create", audience: "@auth", duration: 600, maxRequests: 30 },
  ];
  app.save(settings);
}, (app) => {
  for (const name of ["machine_changes", "maintenance_logs", "issue_updates", "tool_issues"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
  const users = app.findCollectionByNameOrId("users");
  for (const name of ["first_name", "last_name", "phone", "preferred_contact", "discord_username"]) {
    users.fields.removeByName(name);
  }
  users.fields.add(new TextField({ name: "name", max: 255 }));
  users.otp.enabled = false;
  users.passwordAuth.enabled = true;
  app.save(users);
});
