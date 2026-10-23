# Editing guide

For stewards and volunteers who keep machine pages up to date. No coding needed.

## Logging in

Go to **https://tools.chattlab.space/_/** (or "Editor login" at the bottom of any page) and sign
in with the account an admin created for you.

> Editor accounts can change everything, including the database structure. Only use the
> **records** (the rows of data). Don't use the gear icon on a collection, and don't add or delete
> fields or collections. Ask a technical maintainer if a page needs a new kind of field.

## The four collections

| Collection | What goes in it |
|---|---|
| **machines** | One record per machine: name, photo, instructions, manuals |
| **troubleshooting** | Problem → fix entries, each linked to one machine |
| **consumables** | Blades, bits, filament, cartridges. One record can be linked to several machines |
| **contacts** | Stewards or roles members can reach out to |

## Adding a machine

1. **machines** → **New record**.
2. **code**: a short, permanent ID printed on the sticker, e.g. `TS01` (table saw #1), `LZ02`.
   Letters, numbers and dashes only. **It can't be changed after saving**, because the sticker
   depends on it.
3. Fill in name, make, model, serial, **category** (e.g. "Saws") and **area** (e.g. "Wood Shop").
   Reuse existing spellings so the browse filters stay tidy.
4. **summary**: one or two sentences on what the machine is for.
5. **photo**: one clear photo of the whole machine.
6. **status**: shown beside the code at the top of the machine's page:
   - **working**: ready to use.
   - **repair_in_progress**: someone is fixing it; members should not use it yet.
   - **out_of_service**: broken or tagged out, with no repair under way yet.

   Update it whenever a machine is tagged out or comes back into service.
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

The "Having a problem?" section is the first thing members see after scanning a sticker, so this
is the most valuable content.

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

## Printing QR stickers

1. Go to **https://tools.chattlab.space/labels**.
2. Tick the machines, click **Show selected**, then **Print**.
3. Each label is 3.5" × 2". Print on sticker paper or plain paper and laminate it. Scan a sticker
   with your phone to check it before putting it on the machine.

## Removing a machine

Delete its **machines** record. Its troubleshooting entries are deleted with it. Remove the sticker
too, or scanning it will show "Machine not found".
