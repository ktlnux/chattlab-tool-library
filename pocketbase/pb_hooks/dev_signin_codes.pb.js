/// <reference path="../pb_data/types.d.ts" />

// Local development only: print member sign-in codes in the PocketBase terminal instead of
// emailing them, so no mail server is needed. Enabled by PB_DEV_PRINT_CODES=1, which only
// scripts/dev-pocketbase.sh sets; production (Docker) sends real emails.
onMailerRecordOTPSend((e) => {
  if ($os.getenv("PB_DEV_PRINT_CODES") !== "1") {
    e.next();
    return;
  }
  const code = e.meta["password"];
  console.log(`\n[dev] Sign-in code for ${e.record.email()}: ${code}  (printed here, not emailed)\n`);
  // Not calling e.next() skips sending the email.
}, "users");
