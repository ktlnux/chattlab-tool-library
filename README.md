# Chattlab Tool Library

Documentation for every tool and machine at Chattlab. Each machine has a QR sticker linking to
`https://tools.chattlab.space/m/<CODE>`, a page with troubleshooting steps, operating instructions,
consumables, manuals, and who to contact.

- **PocketBase** (`pocketbase/`): database, file storage, and the editor dashboard at `/_/`.
- **Astro** (`web/`): the public site, rendered on the server so pages load fast on a phone.
- **Caddy** (`Caddyfile`): HTTPS and routing. `/api/*` and `/_/` go to PocketBase; everything else goes to Astro.

## Pages

| URL | What it is |
|---|---|
| `/` | Browse and search all machines |
| `/m/<CODE>` | A machine's page (what the QR sticker opens) |
| `/issues/<id>` | A tool issue and its updates |
| `/signin`, `/account` | Member sign-in (email and password) and profile |
| `/labels` | Printable QR sticker sheet |
| `/_/` | Editor dashboard (PocketBase) |

## Local development

Requires Node 22.23+ (or 24).

```bash
./scripts/dev-pocketbase.sh
```

The first run downloads PocketBase into `pocketbase/bin/` and applies the migrations. In a second
terminal, create the dev superuser, then load the sample machines and the dev member (see
[Dev accounts](#dev-accounts)):

```bash
./scripts/dev-superuser.sh
```

```bash
node scripts/seed.mjs
```

Then start the site:

```bash
cd web && npm install && npm run dev
```

The site runs at http://localhost:4321. In development, Vite proxies `/api` and `/_/` to
PocketBase, the same way Caddy does in production.

### Dev accounts

There are two kinds of login, and local development has one of each, both using
`dev@example.test` and the password `devpassword123`:

| | Dev superuser | Dev member |
|---|---|---|
| What it's for | The PocketBase dashboard (editing machines, reading issue reports) | The site itself (reporting issues as a member, posting issue updates, logging maintenance) |
| Where to sign in | http://127.0.0.1:8090/_/ | http://localhost:4321/signin |
| How | Email and password | Email and password |
| Created by | `./scripts/dev-superuser.sh` | `node scripts/seed.mjs` |

You can also create more members from the site's "Create an account" link. **Forgot password?**
works locally without a mail server: the reset link is printed in the terminal running
`./scripts/dev-pocketbase.sh`, like:

```
[dev] Password reset link for dev@example.test: http://localhost:4321/_/#/auth/confirm-password-reset/…  (printed here, not emailed)
```

The dev script turns this on with `PB_DEV_PRINT_EMAILS=1` (`pocketbase/pb_hooks/dev_mail.pb.js`);
production never sets it and emails the link as normal.

- **Create the dev superuser, or reset its password** (PocketBase must have been started once so
  the database exists; it can be running or stopped):
  ```bash
  ./scripts/dev-superuser.sh
  ```
- **Create the dev member, or reset its password** (and load sample machines; PocketBase must be
  running):
  ```bash
  node scripts/seed.mjs
  ```
- **Use your own email** for both by setting `PB_EMAIL` (and `PB_PASSWORD` for the superuser):
  ```bash
  PB_EMAIL=you@example.com PB_PASSWORD=a-local-password ./scripts/dev-superuser.sh
  ```
  ```bash
  PB_EMAIL=you@example.com PB_PASSWORD=a-local-password node scripts/seed.mjs
  ```
- These accounts only exist in your local `pocketbase/pb_data`, which isn't committed. Production
  accounts are created on the server; see [docs/deploy.md](docs/deploy.md).

### Changing the schema

Edit collections in your **local** dashboard (http://127.0.0.1:8090/_/). PocketBase writes each
change to a new file in `pocketbase/pb_migrations/`. Commit those files; production applies them
on the next deploy. Production has auto-migrations turned off, so schema edits made there are not
recorded. Don't make them.

## Deploying

See [docs/deploy.md](docs/deploy.md). Editors should read [docs/editing-guide.md](docs/editing-guide.md).
