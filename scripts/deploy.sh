#!/usr/bin/env bash
#
# PlotSlop deploy — /root/Plot-Twists (source, root-owned, editable)
#                 → /srv/plotslop      (runtime, plotslop-owned, isolated)
#
# WHY THE TWO TREES. sang3r.com runs on this box as User=root out of /root/Sanger and
# holds Jackson's personal data. PlotSlop has a demonstrated memory-exhaustion path
# (50 rooms in ~2s) and open defects. Running it from /root would mean either running as
# root — no isolation at all — or fighting ownership on a tree that is edited as root.
# A separate runtime tree lets the unit set ProtectHome=true, which makes /root
# INVISIBLE to the process rather than merely mode-protected. See AUDIT.md → "VPS
# co-tenancy".
#
# NOTE: `next build` requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY at BUILD time. Publishable
# keys are not secrets. Without it the build fails — that was the Chunk 1 root cause.
set -euo pipefail

SRC=/root/Plot-Twists
DST=/srv/plotslop
ENV_FILE=/etc/plotslop/env

[[ $EUID -eq 0 ]] || { echo "must run as root (needs chown to plotslop)"; exit 1; }
id plotslop &>/dev/null || { echo "missing 'plotslop' system user — see AUDIT.md"; exit 1; }
[[ -f $ENV_FILE ]] || { echo "missing $ENV_FILE — the unit will not start without it"; exit 1; }

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a
[[ -n ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-} ]] || {
  echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is unset — 'next build' will fail. Set it in $ENV_FILE."
  exit 1
}

echo "==> building in $SRC"
cd "$SRC"
npm ci
npm run build

echo "==> syncing to $DST"
# --delete keeps the runtime tree exact. data/ is EXCLUDED and never deleted: it is the
# live database under the JSON adapter (rooms, playerStats, progression, gameHistory).
rsync -a --delete \
  --exclude '.git' \
  --exclude 'data' \
  --exclude '__tests__' \
  --exclude 'coverage' \
  --exclude 'scripts/harness' \
  --exclude '.env*' \
  --exclude '.mcp.json' \
  "$SRC"/ "$DST"/

echo "==> pruning dev dependencies in the runtime tree"
# Done in $DST, not $SRC, so the source tree keeps jest/tsx-for-tests intact.
# tsx itself is a runtime dependency (ExecStart uses it), so --omit=dev keeps it.
( cd "$DST" && npm prune --omit=dev )

mkdir -p "$DST/data"
chown -R plotslop:plotslop "$DST"
chmod 750 "$DST/data"

echo "==> restarting"
# CONSTRAINT-1: this drops EVERY live Socket.IO connection and ends every game in flight.
# Weekday daytime only. Never Friday-Sunday evening. See AUDIT.md → CONSTRAINT-1.
#
# The reasoning changed on 2026-07-29 even though the constraint did not. This used to say
# "because host-disconnect recovery is still broken (D3)". D3 is FIXED — host migration
# landed in Chunk 2 item 3 — but that does not soften this one bit, and it is worth being
# precise about why: migration promotes a surviving player when the HOST drops, and a
# restart drops everyone at once. There is no survivor to promote. The real cause is
# CONSTRAINT-1 itself: all game state is process-local, so it dies with the process.
read -rp "Restarting ends every live game mid-round. Continue? [y/N] " ok
[[ ${ok,,} == y ]] || { echo "aborted; new code is staged in $DST but not running"; exit 0; }

systemctl restart plotslop
sleep 3
systemctl --no-pager --lines=20 status plotslop
