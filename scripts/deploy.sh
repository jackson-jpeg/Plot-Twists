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

# --include=dev is LOAD-BEARING and this is the bug that kept the service from ever starting.
#
# The `source $ENV_FILE` above runs under `set -a`, so it exports everything in that file —
# including NODE_ENV=production, which is correct for the RUNTIME and wrong for the BUILD.
# npm reads NODE_ENV and silently sets `omit=dev`, so a plain `npm ci` here installs 454
# production packages and skips typescript, which is a devDependency.
#
# `next build` then finds tsconfig.json with no typescript, helpfully installs typescript@latest
# (6.0.3) and REWRITES package.json and package-lock.json, clobbering the deliberate exact pin
# at 5.9.3. ts-jest@29.4.6 declares peer typescript ">=4.3 <6", so the `npm prune --omit=dev`
# below then dies on ERESOLVE and takes the whole deploy with it — after the build has already
# succeeded, which is why the log looks fine right up to the failure.
#
# Verified rather than reasoned: `NODE_ENV=production npm config get omit` prints "dev";
# unset, it prints empty.
npm ci --include=dev
npm run build

# The build must not have edited its own inputs. Next's auto-install is silent, writes to
# package.json, and is the sort of thing that gets committed by accident three days later.
# A pinned dependency changing during a deploy is a stop condition, not a warning.
if ! git -C "$SRC" diff --quiet -- package.json package-lock.json; then
  echo "ABORT: the build modified package.json/package-lock.json:"
  git -C "$SRC" --no-pager diff --stat -- package.json package-lock.json
  echo "Almost certainly a dependency auto-install. Investigate before deploying."
  exit 1
fi

echo "==> syncing to $DST"
# --delete keeps the runtime tree exact. data/ is EXCLUDED and never deleted: it is the
# live database under the JSON adapter (rooms, playerStats, progression, gameHistory).
#
# THE LEADING SLASH ON '/data' IS THE WHOLE FIX. An rsync pattern with no slash matches a
# name at EVERY depth, so a bare 'data' excluded server/data/ as well — the directory holding
# communityPacks.ts, which cardpack.service.ts imports at startup. The runtime tree therefore
# came out missing a source file the app requires, and the service died on
# MODULE_NOT_FOUND '../data/communityPacks' the first time it was ever started.
#
# The failure was invisible from the source tree, where the file plainly exists, and invisible
# from the build, which compiles the Next app rather than the Socket.IO server. '/data' anchors
# the pattern to the transfer root, so only the top-level database is spared.
rsync -a --delete \
  --exclude '.git' \
  --exclude '/data' \
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

# reset-failed FIRST, and this is not defensive tidying — it cost this session about an hour.
#
# The unit carries StartLimitBurst=5 / StartLimitIntervalSec=300. If a previous deploy left the
# service crashlooping, those five starts are already spent, and systemd LATCHES that state: the
# next `systemctl restart` refuses to spawn a process at all and logs only
#
#     plotslop.service: Start request repeated too quickly.
#
# The dangerous part is what that looks like to whoever is deploying. `journalctl` still shows the
# OLD crash — the stack trace from the previous, already-fixed bug — sitting directly above the
# limiter message. So a deploy that fixed the problem reads exactly like a deploy that did not,
# and the natural response is to go and "re-fix" something that was never broken.
#
# That is precisely what happened on 2026-07-29: the rsync fix for server/data/ was correct and
# already applied, but the restart never ran, so the MODULE_NOT_FOUND from the previous attempt
# was the newest thing in the log. Clearing the counter is what revealed the service was fine.
systemctl reset-failed plotslop 2>/dev/null || true
systemctl restart plotslop
sleep 3
systemctl --no-pager --lines=20 status plotslop
