/// <reference path="../pb_data/types.d.ts" />

// "Report an issue" from the machine page, by a signed-in member.
// A custom route rather than a normal create, because the reporter's contact details go into
// hidden (superuser-only) fields, which PocketBase won't accept from a member directly.
// Reports from members who aren't trusted wait for a steward's approval.
routerAdd("POST", "/api/tool-issues/report", (e) => {
  const { displayName, syncMachineStatus } = require(`${__hooks}/lib/issues.js`);
  const user = e.auth;
  if (!user || user.collection().name !== "users") {
    throw new UnauthorizedError("Sign in to report an issue.");
  }
  const body = e.requestInfo().body;
  const text = (key) => String(body[key] ?? "").trim();

  // Spam trap: only bots fill in the form's hidden "website" field.
  if (text("website")) throw new BadRequestError("Your report could not be sent.");

  let machine;
  try {
    machine = e.app.findRecordById("machines", text("machine"));
  } catch (_) {
    throw new BadRequestError("Unknown machine.");
  }
  const title = text("title");
  if (!title) throw new BadRequestError("Please say briefly what's wrong.");
  const severity = text("severity");
  if (severity !== "out_of_operation" && severity !== "operational") {
    throw new BadRequestError("Please choose whether the machine can still be used.");
  }

  // Contact details come from the member's profile, copied so the report keeps them even if
  // the profile changes later.
  const contact = {
    first: user.getString("first_name"),
    last: user.getString("last_name"),
    email: user.email(),
    phone: user.getString("phone"),
    method: user.getString("preferred_contact"),
    discord: user.getString("discord_username"),
  };
  if (!contact.first || !contact.last || !contact.method || !contact[contact.method]) {
    throw new BadRequestError("Please finish your profile on your account page first, so a steward can reach you.");
  }
  const approved = user.getBool("trusted");

  const issue = new Record(e.app.findCollectionByNameOrId("tool_issues"));
  issue.load({
    machine: machine.id,
    title: title,
    details: text("details"),
    severity: severity,
    status: "needs_repair",
    approved: approved,
    reporter: user.id,
    reporter_display: displayName(contact.first, contact.last),
    reporter_first_name: contact.first,
    reporter_last_name: contact.last,
    reporter_email: contact.email,
    reporter_phone: contact.phone,
    reporter_preferred_contact: contact.method,
    reporter_discord: contact.discord,
  });
  e.app.save(issue); // validates field types and limits

  if (approved && severity === "out_of_operation") syncMachineStatus(e.app, machine.id);

  return e.json(200, {
    id: issue.id,
    title: issue.getString("title"),
    severity: severity,
    status: issue.getString("status"),
    approved: approved,
    reporter_display: issue.getString("reporter_display"),
  });
});

// An editor creating an issue in the dashboard: approve it, and fill in the public name and
// machine status.
onRecordCreateRequest((e) => {
  const { STEWARD, displayName, syncMachineStatus } = require(`${__hooks}/lib/issues.js`);
  const issue = e.record;
  issue.set("approved", true);
  if (!issue.getString("reporter_display")) {
    const first = issue.getString("reporter_first_name");
    issue.set("reporter_display", first ? displayName(first, issue.getString("reporter_last_name")) : STEWARD);
  }
  e.next();
  if (issue.getString("severity") === "out_of_operation") {
    syncMachineStatus(e.app, issue.getString("machine"));
  }
}, "tool_issues");

// An editor changing an issue directly in the dashboard: keep closed_at, the machine's status
// and the issue's history in step, as if they had posted an update.
onRecordUpdateRequest((e) => {
  const { STEWARD, setClosedAt, syncMachineStatus } = require(`${__hooks}/lib/issues.js`);
  const issue = e.record;
  const before = issue.original();
  const statusChanged = before.getString("status") !== issue.getString("status");
  const severityChanged = before.getString("severity") !== issue.getString("severity");
  const approvalChanged = before.getBool("approved") !== issue.getBool("approved");
  if (statusChanged) setClosedAt(issue);

  e.next();

  if (approvalChanged && issue.getBool("approved")) {
    const update = new Record(e.app.findCollectionByNameOrId("issue_updates"));
    update.set("issue", issue.id);
    update.set("machine", issue.getString("machine"));
    update.set("author_display", STEWARD);
    update.set("comment", "Reviewed and approved.");
    e.app.save(update);
  }
  if (statusChanged) {
    const update = new Record(e.app.findCollectionByNameOrId("issue_updates"));
    update.set("issue", issue.id);
    update.set("machine", issue.getString("machine"));
    update.set("author_display", STEWARD);
    update.set("new_status", issue.getString("status"));
    e.app.save(update);
  }
  if ((statusChanged || severityChanged || approvalChanged) &&
      (issue.getString("severity") === "out_of_operation" || before.getString("severity") === "out_of_operation")) {
    syncMachineStatus(e.app, issue.getString("machine"));
  }
}, "tool_issues");

// A comment and/or status change on an issue, from a signed-in member (or the dashboard).
onRecordCreateRequest((e) => {
  const { actor, setClosedAt, syncMachineStatus } = require(`${__hooks}/lib/issues.js`);
  const update = e.record;
  const issue = e.app.findRecordById("tool_issues", update.getString("issue"));
  const who = actor(e);

  update.set("machine", issue.getString("machine"));
  update.set("author", who.id);
  update.set("author_display", who.display);
  update.set("comment", update.getString("comment").trim());
  // Choosing the issue's current status isn't a change.
  if (update.getString("new_status") === issue.getString("status")) update.set("new_status", "");
  if (!update.getString("comment") && !update.getString("new_status")) {
    throw new BadRequestError("Add a comment or change the status.");
  }

  e.next();

  const newStatus = update.getString("new_status");
  if (newStatus) {
    issue.set("status", newStatus);
    setClosedAt(issue);
    e.app.save(issue);
    if (issue.getString("severity") === "out_of_operation") {
      syncMachineStatus(e.app, issue.getString("machine"));
    }
  }
}, "issue_updates");

// Maintenance entries record who logged them.
onRecordCreateRequest((e) => {
  const { actor } = require(`${__hooks}/lib/issues.js`);
  const who = actor(e);
  e.record.set("author", who.id);
  e.record.set("author_display", who.display);
  e.record.set("title", e.record.getString("title").trim());
  e.next();
}, "maintenance_logs");
