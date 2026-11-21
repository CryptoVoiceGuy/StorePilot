#!/usr/bin/env bash
# One-word commands for the self-learning trading bot. Run ./bot.sh with no
# arguments to see them all.
set -euo pipefail
cd "$(dirname "$0")"

export FT_UID="$(id -u)" FT_GID="$(id -g)"
PRIVATE_CONFIG="user_data/config.private.json"
COMPOSE="docker compose"

random_string() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "${1:-24}"; }

days_ago() {
  # GNU date (Linux) first, then BSD date (macOS).
  date -u -d "-$1 days" +%Y%m%d 2>/dev/null || date -u -v-"$1"d +%Y%m%d
}

ensure_private_config() {
  if [[ -f "$PRIVATE_CONFIG" ]]; then return; fi
  cat >"$PRIVATE_CONFIG" <<EOF
{
  "api_server": {
    "enabled": true,
    "listen_ip_address": "0.0.0.0",
    "listen_port": 8080,
    "verbosity": "error",
    "enable_openapi": false,
    "jwt_secret_key": "$(random_string 48)",
    "ws_token": "$(random_string 32)",
    "CORS_origins": [],
    "username": "admin",
    "password": "$(random_string 20)"
  }
}
EOF
  chmod 600 "$PRIVATE_CONFIG"
  echo "Created $PRIVATE_CONFIG with a random dashboard password (kept out of git)."
}

show_login() {
  local user pass
  user=$(grep -o '"username": *"[^"]*"' "$PRIVATE_CONFIG" | cut -d'"' -f4)
  pass=$(grep -o '"password": *"[^"]*"' "$PRIVATE_CONFIG" | cut -d'"' -f4)
  echo "Dashboard: http://localhost:8080   username: $user   password: $pass"
}

ensure_baseline() {
  # Settings the self-improvement loop has proven better; starts empty.
  [[ -f user_data/config.baseline.json ]] || echo '{}' >user_data/config.baseline.json
}

download_history() {
  $COMPOSE run --rm --no-deps --entrypoint python freqtrade \
    /freqtrade/storepilot_scripts/download_history.py "$@"
}

improver() {
  $COMPOSE run --rm --no-deps --entrypoint python improver \
    /freqtrade/storepilot_scripts/improver.py "$@"
}

case "${1:-help}" in
  setup)
    mkdir -p user_data/logs user_data/data
    ensure_private_config
    ensure_baseline
    $COMPOSE pull
    echo "Downloading ~16 months of price history (takes under a minute)..."
    download_history
    echo "Setup done. Next: ./bot.sh backtest   or   ./bot.sh start"
    ;;
  update-data)
    download_history "${@:2}"
    ;;
  backtest)
    # Default: the last 365 days, retraining weekly exactly like the live bot.
    # The fee is Kraken's worst-case 0.4% per buy or sell.
    # Uses the current baseline, i.e. including every improvement kept so far.
    ensure_baseline
    timerange="${2:-$(days_ago 365)-}"
    $COMPOSE run --rm --no-deps freqtrade backtesting \
      --config /freqtrade/user_data/config.json \
      --config /freqtrade/user_data/config.baseline.json \
      --timerange "$timerange" --fee 0.004 --cache none --export trades
    ;;
  start)
    ensure_private_config
    ensure_baseline
    mkdir -p user_data/logs
    $COMPOSE up -d
    echo "Bot started in PAPER-TRADING mode (no real money)."
    echo "The self-improvement loop is running too: ./bot.sh experiments shows what it has tried."
    show_login
    ;;
  stop)
    $COMPOSE down
    ;;
  restart)
    $COMPOSE restart
    ;;
  logs)
    # ./bot.sh logs            -> both
    # ./bot.sh logs improver   -> only the self-improvement loop
    $COMPOSE logs -f --tail 100 "${@:2}"
    ;;
  experiments)
    improver report "${@:2}"
    ;;
  improve-once)
    ensure_baseline
    improver once
    ;;
  approve)
    improver approve
    ;;
  status)
    $COMPOSE ps
    ;;
  login)
    show_login
    ;;
  *)
    cat <<'EOF'
Usage: ./bot.sh <command>

  setup         First-time setup: dashboard password, Docker image, price history
  backtest      Replay the last year with the current settings (optional: a
                timerange like 20260101-20260601)
  start         Start paper trading + the self-improvement loop, 24/7
  stop          Stop everything
  restart       Restart (e.g. after editing config.json)
  logs          Watch what it is doing right now (Ctrl+C to stop watching);
                "./bot.sh logs improver" shows only the experiments
  status        Is it running?
  login         Show the dashboard address and password
  experiments   What the self-improvement loop has tried, kept and thrown away
  improve-once  Run one experiment now (in the foreground)
  approve       Real-money mode only: put the latest proven improvement live
  update-data   Re-download price history
EOF
    ;;
esac
