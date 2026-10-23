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
| `/signin`, `/account` | Member sign-in (emailed code) and profile |
| `/labels` | Printable QR sticker sheet |
| `/_/` | Editor dashboard (PocketBase) |

## Local development

Requires Node 22.23+ (or 24).

```bash
./scripts/dev-pocketbase.sh
```

The first run downloads PocketBase into `pocketbase/bin/` and applies the migrations. Open the link
it prints to create a local superuser, then in a second terminal:

```bash
PB_EMAIL=you@example.com PB_PASSWORD=yourpassword node scripts/seed.mjs
```

```bash
cd web && npm install && npm run dev
```

The site runs at http://localhost:4321. In development, Vite proxies `/api` and `/_/` to
PocketBase, the same way Caddy does in production.

### Changing the schema

Edit collections in your **local** dashboard (http://127.0.0.1:8090/_/). PocketBase writes each
change to a new file in `pocketbase/pb_migrations/`. Commit those files; production applies them
on the next deploy. Production has auto-migrations turned off, so schema edits made there are not
recorded. Don't make them.

## Deploying

See [docs/deploy.md](docs/deploy.md). Editors should read [docs/editing-guide.md](docs/editing-guide.md).
