/// <reference path="../pb_data/types.d.ts" />

// Reject submissions that filled in the form's hidden "website" field (only bots do).
onRecordCreateRequest((e) => {
  if (e.requestInfo().body["website"]) {
    throw new BadRequestError("Your report could not be sent.");
  }
  e.next();
}, "issue_reports");

// A report saying the machine can't be used at all marks it out of service.
onRecordAfterCreateSuccess((e) => {
  if (e.record.getBool("machine_disabled")) {
    const machine = e.app.findRecordById("machines", e.record.getString("machine"));
    if (machine.getString("status") !== "out_of_service") {
      machine.set("status", "out_of_service");
      e.app.save(machine);
    }
  }
  e.next();
}, "issue_reports");
