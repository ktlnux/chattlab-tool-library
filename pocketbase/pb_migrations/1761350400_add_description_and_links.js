/// <reference path="../pb_data/types.d.ts" />

// Adds a longer machine description (shown in "Details & specs") and a collection of
// external documentation links (shown in "Documentation" alongside uploaded PDFs).

migrate((app) => {
  const machines = app.findCollectionByNameOrId("machines");

  // Place the description right after the short summary in the dashboard form.
  let afterSummary = 0;
  for (let i = 0; i < machines.fields.length; i++) {
    if (machines.fields[i].name === "summary") afterSummary = i + 1;
  }
  machines.fields.addAt(afterSummary, new EditorField({ name: "description" }));
  app.save(machines);

  const links = new Collection({
    type: "base",
    name: "documentation_links",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "relation", name: "machine", collectionId: machines.id, maxSelect: 1, required: true, cascadeDelete: true },
      { type: "text", name: "title", required: true, max: 150, presentable: true },
      { type: "url", name: "url", required: true },
      // Lower numbers show first.
      { type: "number", name: "sort", onlyInt: true },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
  });
  app.save(links);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("documentation_links"));

  const machines = app.findCollectionByNameOrId("machines");
  machines.fields.removeByName("description");
  app.save(machines);
});
