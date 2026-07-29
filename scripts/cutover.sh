#!/usr/bin/env bash
#
# PlotSlop cutover — plotslop.com onto this VPS.
#
#   [VPS] bash scripts/cutover.sh              # DRY RUN. Prints the plan. Default.
#   [VPS] bash scripts/cutover.sh --check      # Preconditions only.
#   [VPS] bash scripts/cutover.sh --apply      # Actually does it.
#
# DRY RUN IS THE DEFAULT AND THAT IS THE POINT. This edits nginx on a box that is also
# serving sang3r.com. A bad config here does not degrade PlotSlop — it stops nginx from
# LOADING and takes Sanger down with it. So every mutating step goes through run(), which
# prints under dry-run and executes only under --apply.
#
# Written 2026-07-29 and NOT RUN. What it needs is Jackson's: the secrets, the DNS record,
# and the decision to go. See NEEDS-JACKSON.md.

set -euo pipefail

SRC=/root/Plot-Twists
ENV_FILE=/etc/plotslop/env
DOMAIN=plotslop.com
WWW=www.plotslop.com
EXPECTED_IP=187.77.218.14
EXPECTED_V6=2a02:4780:4:1c0b::1
NGINX_AVAILABLE=/etc/nginx/sites-available
NGINX_ENABLED=/etc/nginx/sites-enabled
WEBROOT=/var/www/certbot
CERT_EMAIL="${CERTBOT_EMAIL:-realjacksons@gmail.com}"

MODE=dry
case "${1:-}" in
  --apply) MODE=apply ;;
  --check) MODE=check ;;
  ""|--dry-run) MODE=dry ;;
  *) echo "usage: $0 [--apply|--dry-run|--check]" >&2; exit 2 ;;
esac

c_red=$'\e[31m'; c_grn=$'\e[32m'; c_ylw=$'\e[33m'; c_dim=$'\e[2m'; c_off=$'\e[0m'
ok()   { echo "  ${c_grn}ok${c_off}    $*"; }
warn() { echo "  ${c_ylw}warn${c_off}  $*"; }
fail() { echo "  ${c_red}FAIL${c_off}  $*"; FAILED=$((FAILED+1)); }
step() { echo; echo "${c_dim}── $* ${c_off}"; }

run() {
  if [[ $MODE == apply ]]; then
    echo "  ${c_grn}+${c_off} $*"
    "$@"
  else
    echo "  ${c_dim}would run:${c_off} $*"
  fi
}

FAILED=0

# ═════════════════════════════════════════════════════════════════════════════
# PRECONDITIONS — hard gates, not advice.
#
# The secrets gate matters most because it is the only failure here that is QUIET.
# Everything else fails loudly at deploy time. Placeholder secrets produce a site that
# loads, accepts players, seats them, and then fails at the exact moment someone tries to
# generate a script — i.e. in front of an audience rather than in front of whoever deployed.
# ═════════════════════════════════════════════════════════════════════════════
step "preconditions"

[[ $EUID -eq 0 ]] || fail "must run as root (nginx + systemd + certbot)"
[[ -d $SRC ]] || fail "missing source tree $SRC"
[[ -f $ENV_FILE ]] && ok "$ENV_FILE exists" || fail "missing $ENV_FILE"

check_secret() {
  local key="$1" val
  val="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true)"
  val="${val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"

  if [[ -z $val ]]; then
    fail "$key is empty — this is the current state, waiting on Jackson"
    return
  fi
  # Placeholder shapes, including the ones this repo actually uses.
  if [[ $val =~ ^(REPLACE|CHANGEME|TODO|xxx|your|placeholder|PLACEHOLDER|sk-ant-harness) ]] \
     || [[ $val =~ (REPLACE_ME|FILL_ME|PLACEHOLDER|^\<.*\>$) ]]; then
    fail "$key still looks like a placeholder ('${val:0:16}…')"
    return
  fi
  # Shape checks catch a value pasted onto the wrong line, which an emptiness check passes.
  case "$key" in
    ANTHROPIC_API_KEY)
      [[ $val == sk-ant-* ]] && ok "$key present (sk-ant-…, ${#val} chars)" \
        || fail "$key does not start with sk-ant-" ;;
    CLERK_SECRET_KEY)
      [[ $val == sk_* ]] && ok "$key present (${#val} chars)" \
        || fail "$key does not start with sk_ (Clerk secret keys do)" ;;
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
      [[ $val == pk_* ]] && ok "$key present (${#val} chars)" \
        || fail "$key does not start with pk_ (Clerk publishable keys do)" ;;
    *) ok "$key present" ;;
  esac
}

if [[ -f $ENV_FILE ]]; then
  check_secret ANTHROPIC_API_KEY
  check_secret CLERK_SECRET_KEY
  check_secret NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  # Firebase must stay UNSET. DECISIONS.md #7 is open: nobody has read the deployed
  # Firestore rules. Setting these stops server/db/index.ts falling back to the JSON
  # adapter, and the live database silently becomes a project with unknown security rules.
  for k in FIREBASE_SERVICE_ACCOUNT_KEY NEXT_PUBLIC_FIREBASE_PROJECT_ID; do
    if grep -qE "^${k}=." "$ENV_FILE" 2>/dev/null; then
      fail "$k is SET — that switches the live DB to Firebase and DECISIONS.md #7 is open"
    else
      ok "$k unset (JSON adapter stays the database)"
    fi
  done
fi

# ── DNS ─────────────────────────────────────────────────────────────────────
resolved="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1}' | head -1 || true)"
if [[ -z $resolved ]]; then
  fail "$DOMAIN does not resolve"
elif [[ $resolved == "$EXPECTED_IP" ]]; then
  ok "$DOMAIN → $resolved"
else
  fail "$DOMAIN → $resolved, expected $EXPECTED_IP (2.57.91.91 is the Hostinger parked page)"
fi

# AAAA is optional, but a WRONG one is worse than none: certbot may validate over v6 and
# fail while everything looks healthy over v4 — then renewal breaks two months later.
# `getent ahostsv6` returns IPv4-MAPPED addresses (::ffff:a.b.c.d) when the name has no AAAA
# at all, so an unfiltered read here reports a bogus "wrong AAAA" for every v4-only domain.
# Caught by this script's own first run against plotslop.com, which has no AAAA. Filter them.
aaaa="$(getent ahostsv6 "$DOMAIN" 2>/dev/null | awk '{print $1}' | grep -v '^::ffff:' | head -1 || true)"
if [[ -z $aaaa ]]; then
  ok "no AAAA record (v4-only validation)"
elif [[ $aaaa == "$EXPECTED_V6" ]]; then
  ok "$DOMAIN AAAA → $aaaa (nginx listens here)"
else
  fail "$DOMAIN AAAA is $aaaa, not this box — HTTP-01 may validate over v6 and fail"
fi

id plotslop &>/dev/null && ok "plotslop system user exists" || fail "missing plotslop system user"
[[ -x /usr/bin/certbot ]] && ok "certbot $(certbot --version 2>&1 | awk '{print $2}')" || fail "certbot not installed"
nginx -t &>/dev/null && ok "existing nginx config is valid" || fail "nginx config is ALREADY broken — fix before touching it"

step "current state"
echo "  nginx:        $(systemctl is-active nginx 2>/dev/null || true)"
echo "  plotslop:     $(systemctl is-active plotslop 2>/dev/null || true) / $(systemctl is-enabled plotslop 2>/dev/null || true)"
echo "  sanger-next:  $(systemctl is-active sanger-next 2>/dev/null || true)   ${c_dim}(must stay up — shares this nginx)${c_off}"
echo "  certificate:  $([[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]] && echo present || echo absent)"

if [[ $MODE == check ]]; then
  echo
  [[ $FAILED -eq 0 ]] && echo "${c_grn}preconditions pass${c_off}" \
                      || echo "${c_red}$FAILED precondition(s) FAILED${c_off}"
  exit $(( FAILED > 0 ? 1 : 0 ))
fi

if [[ $FAILED -ne 0 && $MODE == apply ]]; then
  echo
  echo "${c_red}refusing to apply: $FAILED precondition(s) failed.${c_off}"
  echo "Nothing has been changed."
  exit 1
fi

# ═════════════════════════════════════════════════════════════════════════════
# PLAN
# ═════════════════════════════════════════════════════════════════════════════

step "1. build + sync to the runtime tree"
echo "  ${c_dim}deploy.sh prompts before restarting — CONSTRAINT-1, a restart ends every live"
echo "  game. That prompt is deliberate and is not bypassed here.${c_off}"
run bash "$SRC/scripts/deploy.sh"

step "2. nginx bootstrap — port 80 only, so certbot can validate"
echo "  ${c_dim}The real config names a cert that does not exist yet, and nginx refuses to LOAD"
echo "  with a missing cert file — which would take sang3r.com down, not just PlotSlop.${c_off}"
run mkdir -p "$WEBROOT"
run cp "$SRC/deploy/nginx/plotslop.com.bootstrap.conf" "$NGINX_AVAILABLE/$DOMAIN"
run ln -sfn "$NGINX_AVAILABLE/$DOMAIN" "$NGINX_ENABLED/$DOMAIN"
run nginx -t
run systemctl reload nginx

step "3. certificate"
echo "  ${c_dim}--webroot, not --nginx: the nginx plugin rewrites the site file in place, and ours"
echo "  is version-controlled with the reasoning for each timeout. Let it write nothing.${c_off}"
run certbot certonly --webroot -w "$WEBROOT" \
    -d "$DOMAIN" -d "$WWW" \
    --email "$CERT_EMAIL" --agree-tos --no-eff-email --non-interactive

step "4. swap in the real config (TLS + WebSocket upgrade)"
run cp "$SRC/deploy/nginx/plotslop.com.conf" "$NGINX_AVAILABLE/$DOMAIN"
run nginx -t
run systemctl reload nginx

step "5. install the unit and start the service"
run cp "$SRC/deploy/systemd/plotslop.service" /etc/systemd/system/plotslop.service
run systemctl daemon-reload
run systemctl enable plotslop
run systemctl start plotslop

step "6. BLOCKING — re-verify isolation on the RUNNING unit"
cat <<'CHECKS'
  Deliberately NOT automated. These need a human reading numbers, and "the script said ok"
  is exactly the class of evidence this checklist exists to replace.

  Every isolation measurement so far was taken on a TRANSIENT systemd-run unit carrying the
  same directives. That proves the directives work. It does not prove THIS unit gets them:
  a typo, an override drop-in or a delegated cgroup would look identical from outside.

    [ ] Effective limits — the unit file is the claim, the cgroup is the fact:
        systemctl show plotslop -p MemoryMax,MemoryHigh,MemorySwapMax,CPUQuotaPerSecUSec,TasksMax,User
        cat /sys/fs/cgroup/system.slice/plotslop.service/{memory.max,memory.high,memory.swap.max,cpu.max}

    [ ] OOM kill fires AND the process DIES rather than stalling:
        journalctl -u plotslop | grep oom-kill    → and Restart=always brought it back.
        A reclaim-throttled stall is worse than a crash — Restart= never fires.

    [ ] CPU quota bites under a MULTI-threaded load. A single-threaded spinner proves
        nothing: it uses one core whatever the quota says. Compare CPU-seconds over a
        fixed wall window.

    [ ] ProtectHome denies /root from inside the SERVICE's namespace:
        systemctl show plotslop -p MainPID → nsenter -t <pid> -m -- ls /root   (must fail)

    [ ] Data dir is inside the tree and nowhere else:
        ls /proc/<pid>/cwd → /srv/plotslop; a write outside ReadWritePaths returns EROFS.

  Record the numbers, not the word "verified". HANDOFF.md §5.
CHECKS

step "7. smoke"
run curl -fsS -o /dev/null -w "  https://$DOMAIN → %{http_code}\n" "https://$DOMAIN/"
cat <<'SMOKE'
  A 200 is NOT evidence the WebSocket path works. Open the site and start a room. A wrong
  proxy config passes curl and fails under a real socket — which is the entire reason
  /socket.io/ has its own location block with its own timeouts.
SMOKE

echo
if [[ $MODE == dry ]]; then
  echo "${c_ylw}DRY RUN — nothing above was executed.${c_off}"
  echo "Re-run with --apply once the preconditions pass and you have decided to go."
else
  echo "${c_grn}cutover applied.${c_off} Step 6 is still yours and is still blocking."
fi
