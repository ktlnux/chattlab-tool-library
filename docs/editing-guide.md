# Editing guide

For stewards and volunteers who keep machine pages up to date. No coding needed.

## Logging in

Go to **https://tools.chattlab.space/_/** (or "Editor login" at the bottom of any page) and sign
in with the account an admin created for you.

> Editor accounts can change everything, including the database structure. Only use the
> **records** (the rows of data). Don't use the gear icon on a collection, and don't add or delete
> fields or collections. Ask a technical maintainer if a page needs a new kind of field.

## The collections

| Collection | What goes in it |
|---|---|
| **machines** | One record per machine: name, photo, instructions, manuals |
| **troubleshooting** | Problem → fix entries, each linked to one machine |
| **consumables** | Blades, bits, filament, cartridges. One record can be linked to several machines |
| **contacts** | Stewards or roles members can reach out to |
| **documentation_links** | Links to outside manuals, videos and support pages, each linked to one machine |
| **tool_issues** | Problems reported from a machine page, with reporter contact details (see "Tool issues") |
| **issue_updates** | Comments and status changes on tool issues |
| **maintenance_logs** | Maintenance done on a machine (see "Maintenance log") |
| **machine_changes** | Automatic log of edits to machines; don't edit by hand |
| **users** | Member accounts (see "Member accounts") |

## Adding a machine

1. **machines** → **New record**.
2. **code**: a short, permanent ID printed on the sticker, e.g. `TS01` (table saw #1), `LZ02`.
   Letters, numbers and dashes only. **It can't be changed after saving**, because the sticker
   depends on it.
3. Fill in name, make, model, serial, **category** (e.g. "Saws") and **area** (e.g. "Wood Shop").
   Reuse existing spellings so the browse filters stay tidy.
4. **summary**: one or two sentences on what the machine is for, shown at the top of the page.
   **description**: a longer write-up shown in "Details & specs": what it's good for, how it's
   set up, quirks. Only the first three lines show until a member taps "Read more", so put the
   most useful sentence first.
5. **photo**: one clear photo of the whole machine.
6. **status**: shown beside the code at the top of the machine's page:
   - **working**: ready to use.
   - **repair_in_progress**: someone is fixing it; members should not use it yet.
   - **out_of_service**: broken or tagged out, with no repair under way yet.

   Tool issues that take the machine out of operation update this automatically (see "Tool
   issues"). Set it by hand for anything else, e.g. a machine tagged out for a reason nobody
   reported on the site.
7. **training_required**: tick if members need sign-off first.
8. **safety** and **quick_start**: use the editor's bullet and numbered lists. Keep it short;
   people read it standing at the machine.
9. **specs**: optional extra technical detail.
10. **documents**: upload manuals, schematics and wiring diagrams (PDF or images, up to 50 MB each).
   The file name is what members see, so name files clearly first, e.g.
   `Owners Manual.pdf` or `Wiring Diagram.pdf`. They show as "Owners manual" and "Wiring diagram",
   with a PDF tag next to them.
11. **contacts**: pick who to contact about this machine.

## Adding troubleshooting entries

The "Troubleshooting" section is where members go when something's wrong, so this is some of the
most valuable content.

**troubleshooting** → **New record**:
- **machine**: pick the machine.
- **symptom**: what the member notices, in their words: "Saw won't start", "Laser not cutting through".
- **likely_cause**: one line.
- **fix**: steps to try. If members shouldn't attempt it, say so and tell them to tag the machine out.
- **sort**: lower numbers show first. Put the most common problems first.

## Consumables and contacts

- **consumables**: include the exact **spec** (size, arbor, teeth, thread pitch…), part number,
  and where it's stored in the space. Link it to every machine it fits.
- **contacts**: prefer roles and channels ("#woodshop on Discord") over personal phone numbers or
  emails; pages are public. **contact_link** (optional) makes a "Message" button. Use a link
  starting with `https://` or `mailto:`.

## Documentation links

The "Documentation" section of a machine page lists its uploaded **documents** (PDFs, images)
followed by any outside links. To add a link: **documentation_links** → **New record**:
- **machine**: pick the machine.
- **title**: what members see, e.g. "Manufacturer support page" or "Blade change video".
- **url**: the full address, starting with `https://`.
- **sort**: lower numbers show first.

Prefer uploading a PDF when the manufacturer allows it: outside links can move or disappear.

## Printing QR stickers

1. Go to **https://tools.chattlab.space/labels**.
2. Tick the machines, click **Show selected**, then **Print**.
3. Each label is 3.5" × 2". Print on sticker paper or plain paper and laminate it. Scan a sticker
   with your phone to check it before putting it on the machine.

## Tool issues

When a machine's status is **working**, its page shows a **Report an issue** button. Anyone can
use it. Visitors give their name, email, optional phone and preferred contact method (email,
phone or Discord); signed-in members only fill in what's missing from their account.

Each report becomes a **tool_issues** record:

- **title**: the reporter's one-line description. Rename it if that makes it clearer.
- **details**: what they wrote.
- **severity**: **out_of_operation** if they said the machine can't be used at all, otherwise
  **operational**.
- **status**: **needs_repair** → **repair_in_progress** → **completed**. "Completed" means closed;
  **closed_at** is filled in automatically.
- **reporter_*** fields: the reporter's name and contact details. **Only editors can see these.**
  The site only ever shows "first name + last initial", e.g. "Kim R.". **reporter** links to their
  member account if they were signed in.

Nobody is notified when an issue comes in, so check **tool_issues** regularly (filter by
`status != "completed"` to see open ones).

**Working an issue.** Signed-in members (and you) can post updates from the issue's page on the
site: a comment, a status change, or both. Closed issues can be reopened the same way. Each issue
has its own page, linked from the machine's "Open issues" list and its History. You can also change
**status** directly in the dashboard; that adds a "Steward" update to the issue's history.

**Machine status follows issues that take it out of operation:**

| Open out-of-operation issues | Machine status |
|---|---|
| any **needs_repair** | out_of_service |
| only **repair_in_progress** | repair_in_progress |
| none | working |

This only kicks in when such an issue changes, so a status you set by hand for another reason
stays until then. Issues marked **operational** never change the machine's status.

## Maintenance log

Signed-in members can tap **Log maintenance** in a machine's History section to record work done:
what was done, optional notes, and the date (leave it as today unless the work was done earlier).
You can also add entries in **maintenance_logs**. Entries show in the machine's History with
who logged them.

## History

Each machine page ends with a **History** timeline, most recent first: when the machine was
added, edits made in the dashboard (from **machine_changes**, written automatically, listing which
fields changed), maintenance, issues reported, and issue updates. People are shown as "first name +
last initial"; edits made in the dashboard show as "Steward".

## Member accounts

Members sign in on the site with their email: they're emailed a 6-digit code, and there are no
passwords. Their first sign-in creates their account. To set someone up yourself, add a **users**
record with their **email** and any password (it's never used), and fill in their details if
you know them.

Each member's **first_name**, **last_name**, **phone**, **preferred_contact** and
**discord_username** are private: only editors and the member can see them.

## Removing a machine

Delete its **machines** record. Its troubleshooting entries, documentation links, tool issues,
maintenance log and history are deleted with it. Remove the sticker
too, or scanning it will show "Machine not found".
