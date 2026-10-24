/// <reference path="../pb_data/types.d.ts" />

// Members stay signed in: sign-in tokens last a year, and the site renews them at most once a
// day while the member keeps using it (web/src/lib/client.ts), so a device in use never expires.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.authToken.duration = 31536000;
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.authToken.duration = 432000;
  app.save(users);
});
