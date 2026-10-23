# Deploying

Production runs on a DigitalOcean Droplet (Ubuntu, 1 GB RAM) with Docker Compose.
DNS is at Namecheap: an A record for `tools.chattlab.space` points at the Droplet.

**The domain is printed on every QR sticker.** Keep auto-renew on at Namecheap, and never change
`DOMAIN` once stickers are printed.

## First-time setup

1. **Firewall.** In DigitalOcean, attach a Cloud Firewall allowing inbound SSH (22), HTTP (80),
   HTTPS (443 TCP) and HTTP/3 (443 UDP). Use the Cloud Firewall rather than `ufw`: Docker's
   published ports bypass `ufw`.
2. **Docker.** If the Droplet doesn't have it yet: `curl -fsSL https://get.docker.com | sh`
3. **Get the code** onto the Droplet:
   ```bash
   git clone <repo-url> /opt/chattlab-library
   cd /opt/chattlab-library
   cp .env.example .env
   nano .env   # set ACME_EMAIL
   ```
4. **Stop anything else using ports 80/443**, such as a leftover test container (`docker ps`, then
   `docker stop <id>`).
5. **Start everything:**
   ```bash
   docker compose up -d --build
   ```
   Caddy gets the HTTPS certificate automatically within a minute. Check with
   `docker compose logs caddy`.
6. **Create the first editor (superuser) account.** PocketBase prints a one-time setup link in its
   logs:
   ```bash
   docker compose logs pocketbase | grep pbinstall
   ```
   The link starts with `http://0.0.0.0:8090`. Replace that part with `https://tools.chattlab.space`
   and open it to set the email and password. If no link shows up, create the account from the shell
   instead (the leading space keeps the password out of shell history):
   ```bash
    docker compose exec pocketbase /pb/pocketbase superuser upsert you@example.com 'a-long-password' --dir=/pb/pb_data
   ```
7. **Dashboard settings** (`https://tools.chattlab.space/_/` → Settings):
   - **Application:** name "Chattlab Tool Library", URL `https://tools.chattlab.space`.
   - **Backups:** turn on auto backups (e.g. cron `0 3 * * *`, keep 14), and under "Store backups
     in S3" enter a Backblaze B2 (or Cloudflare R2) bucket's endpoint, region and keys. Click
     "Initialize new backup" once and confirm it appears in the bucket.
   - In Collections → `_superusers` → options, consider turning on **MFA** for editor logins.
8. **Email (required for member sign-in).** Members sign in with codes sent by email, so
   PocketBase needs an outgoing mail service. See "Setting up email" below.

## Setting up email

1. Sign up with a transactional email service that has a free tier, e.g. Resend, Mailgun,
   SendGrid or Brevo, and add `chattlab.space` as a sending domain.
2. The service lists a few DNS records (SPF, DKIM, sometimes a return-path CNAME). Add them in
   Namecheap → Advanced DNS and wait for the service to show the domain as verified. Without
   them, codes land in spam or bounce.
3. **DigitalOcean blocks the usual SMTP ports (25, 465, 587) on new Droplets.** Use the service's
   alternate port instead: e.g. **2587** (STARTTLS) or **2465** (TLS) on Resend, **2525** on
   Mailgun or SendGrid. Check the service's docs for current values.
4. Dashboard → Settings → **Mail settings**:
   - Sender name `Chattlab Tool Library`, sender address `noreply@chattlab.space`.
   - Turn on **Use SMTP mail server** and enter the service's host, the alternate port, and the
     SMTP username and password (or API key) it gives you.
   - Click **Send test email** and check it arrives.
5. Sign in at `https://tools.chattlab.space/signin` with your own email to check the whole flow.

## Updating

```bash
cd /opt/chattlab-library
git pull
docker compose up -d --build
```

Schema migrations in `pocketbase/pb_migrations/` are applied automatically when PocketBase starts.
Content is never touched by a deploy.

## Adding editors

Each editor needs their own superuser account: Dashboard → Collections → `_superusers` → New record.
Remove accounts when people step down.

## Restoring from a backup

Dashboard → Settings → Backups → choose a backup → Restore. Or, from the shell:

```bash
docker compose stop pocketbase
# replace ./pb_data with the unzipped backup contents
docker compose start pocketbase
```

## Moving to self-hosting (later)

1. Install Docker on the in-space machine (mini PC, NAS, or Raspberry Pi 5; images build for amd64 and arm64).
2. Clone the repo and copy `.env`.
3. Take a fresh backup and restore it into `./pb_data` there.
4. Expose it with **Cloudflare Tunnel** so there's no port forwarding: move the domain's DNS to
   Cloudflare, create a tunnel to `http://web:4321` / `http://pocketbase:8090` (or to Caddy), and
   remove the `ports:` from Caddy, or drop Caddy entirely.
5. Once the new host serves the site, shut down the Droplet. Stickers keep working because the
   domain hasn't changed.
6. Keep the offsite backups going. A computer in the shop is not a backup.
