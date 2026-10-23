/// <reference path="../pb_data/types.d.ts" />

// Adds a status to each machine, shown beside its code on the machine page.
// Existing machines start as "working".

migrate((app) => {
  const machines = app.findCollectionByNameOrId("machines");
  machines.fields.add(
    new SelectField({
      name: "status",
      required: true,
      maxSelect: 1,
      values: ["working", "repair_in_progress", "out_of_service"],
    })
  );
  app.save(machines);

  app.db().newQuery("UPDATE machines SET status = 'working' WHERE status = '' OR status IS NULL").execute();
}, (app) => {
  const machines = app.findCollectionByNameOrId("machines");
  machines.fields.removeByName("status");
  app.save(machines);
});
