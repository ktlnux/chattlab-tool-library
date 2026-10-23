#!/usr/bin/env bash
# Run PocketBase locally for development, downloading the binary on first use.
# Schema edits made in the local dashboard are written to pocketbase/pb_migrations (commit them).
set -euo pipefail

PB_VERSION=0.40.5
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/pocketbase/bin/pocketbase"

if [[ ! -x "$BIN" ]] || ! "$BIN" --version | grep -q "$PB_VERSION"; then
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "$arch" in
    x86_64) arch=amd64 ;;
    aarch64 | arm64) arch=arm64 ;;
  esac
  echo "Downloading PocketBase $PB_VERSION ($os/$arch)..."
  mkdir -p "$ROOT/pocketbase/bin"
  tmp="$(mktemp -d)"
  curl -fsSL -o "$tmp/pb.zip" \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${os}_${arch}.zip"
  unzip -oq "$tmp/pb.zip" pocketbase -d "$ROOT/pocketbase/bin"
  rm -rf "$tmp"
fi

# Print member password reset links in this terminal instead of emailing them
# (pocketbase/pb_hooks/dev_mail.pb.js).
export PB_DEV_PRINT_EMAILS=1

exec "$BIN" "${@:-serve}" \
  --dir "$ROOT/pocketbase/pb_data" \
  --migrationsDir "$ROOT/pocketbase/pb_migrations" \
  --hooksDir "$ROOT/pocketbase/pb_hooks"
