/// <reference path="../pb_data/types.d.ts" />

// Members sign in with email and password instead of emailed codes.
// Accounts created under email-code sign-in have a random password: those members use
// "Forgot password?" (needs email set up), or an editor sets a new password in the dashboard.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.passwordAuth.enabled = true;
  users.passwordAuth.identityFields = ["email"];
  users.otp.enabled = false;
  users.resetPasswordTemplate.subject = "Reset your {APP_NAME} password";
  app.save(users);

  const settings = app.settings();
  const ours = ["users:requestOTP", "users:authWithPassword", "users:requestPasswordReset"];
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules.filter((rule) => !ours.includes(rule.label)),
    // Generous because everyone on the space's Wi-Fi shares one IP.
    { label: "users:authWithPassword", audience: "", duration: 600, maxRequests: 20 },
    { label: "users:requestPasswordReset", audience: "", duration: 600, maxRequests: 10 },
  ];
  app.save(settings);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.passwordAuth.enabled = false;
  users.otp.enabled = true;
  app.save(users);

  const settings = app.settings();
  const ours = ["users:requestOTP", "users:authWithPassword", "users:requestPasswordReset"];
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules.filter((rule) => !ours.includes(rule.label)),
    { label: "users:requestOTP", audience: "", duration: 600, maxRequests: 10 },
  ];
  app.save(settings);
});
