// Shared helpers for the tool issue hooks. Loaded with require() inside each handler,
// because PocketBase runs every hook handler in its own isolated JS runtime.

const STEWARD = "Steward";

// "Kim Reyes" -> "Kim R." (the only form of a person's name the public site shows)
function displayName(first, last) {
  first = (first || "").trim();
  last = (last || "").trim();
  if (!first && !last) return "Member";
  return last ? `${first} ${last.charAt(0).toUpperCase()}.`.trim() : first;
}

// Who made a request, as shown in history: a member's short name, or "Steward" for editors.
function actor(e) {
  if (e.hasSuperuserAuth()) return { id: "", display: STEWARD };
  const auth = e.auth;
  if (auth && auth.collection().name === "users") {
    return { id: auth.id, display: displayName(auth.getString("first_name"), auth.getString("last_name")) };
  }
  return { id: "", display: "" };
}

function setClosedAt(issue) {
  issue.set("closed_at", issue.getString("status") === "completed" ? new DateTime() : "");
}

// A machine's status follows its open, approved issues that take it out of operation:
// any still needing repair -> out of service; otherwise any being repaired -> repair in
// progress; none open -> working. Only called when such an issue changes, so a status an
// editor set by hand for other reasons is left alone until then. Issues awaiting a steward's
// approval never change it.
function syncMachineStatus(app, machineId) {
  const open = app.findRecordsByFilter(
    "tool_issues",
    "machine = {:machine} && approved = true && severity = 'out_of_operation' && status != 'completed'",
    "",
    0,
    0,
    { machine: machineId }
  );
  let next = "working";
  for (let i = 0; i < open.length; i++) {
    if (open[i].getString("status") === "needs_repair") {
      next = "out_of_service";
      break;
    }
    next = "repair_in_progress";
  }
  const machine = app.findRecordById("machines", machineId);
  if (machine.getString("status") !== next) {
    machine.set("status", next);
    app.save(machine);
  }
}

module.exports = { STEWARD, displayName, actor, setClosedAt, syncMachineStatus };
