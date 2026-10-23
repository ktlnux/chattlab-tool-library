/// <reference path="../pb_data/types.d.ts" />

// Local development only: print password reset links in the PocketBase terminal instead of
// emailing them, so no mail server is needed. Enabled by PB_DEV_PRINT_EMAILS=1, which only
// scripts/dev-pocketbase.sh sets; production (Docker) sends real emails.
onMailerRecordPasswordResetSend((e) => {
  if ($os.getenv("PB_DEV_PRINT_EMAILS") !== "1") {
    e.next();
    return;
  }
  const link = `${e.app.settings().meta.appURL}/_/#/auth/confirm-password-reset/${e.meta["token"]}`;
  console.log(`\n[dev] Password reset link for ${e.record.email()}: ${link}  (printed here, not emailed)\n`);
  // Not calling e.next() skips sending the email.
}, "users");
