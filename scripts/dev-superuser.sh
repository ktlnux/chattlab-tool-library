#!/usr/bin/env bash
# Create (or reset the password of) a superuser in the LOCAL development database
# (pocketbase/pb_data). Never use these credentials in production.
# Override with PB_EMAIL / PB_PASSWORD; scripts/seed.mjs uses the same defaults.
set -euo pipefail

EMAIL="${PB_EMAIL:-dev@example.test}"
PASSWORD="${PB_PASSWORD:-devpassword123}"

"$(dirname "$0")/dev-pocketbase.sh" superuser upsert "$EMAIL" "$PASSWORD"
echo "Dashboard: http://127.0.0.1:8090/_/  (email: $EMAIL)"
