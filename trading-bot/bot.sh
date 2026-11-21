#!/usr/bin/env bash
# One-word commands for the trading bot. Run ./bot.sh with no arguments to see
# them all.
set -euo pipefail
cd "$(dirname "$0")"

# Optional .env file picks the bot: empty = trend bot (default); for the
# experimental ML bot put BOT_CONFIG=config.ml.json and
# IMPROVER_SETTINGS=improver.ml.json in it.
if [[ -f .env ]]; then set -a; source .env; set +a; fi
BOT_CONFIG="${BOT_CONFIG:-config.json}"

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

live_mode() {
  grep -qE '"dry_run"[[:space:]]*:[[:space:]]*false' "$PRIVATE_CONFIG" 2>/dev/null
}

check_live_db() {
  # Paper trades and real trades must never share a database.
  if live_mode && ! grep -q 'tradesv3.live.sqlite' "$PRIVATE_CONFIG"; then
    echo "Refusing to start: real-money mode needs its own trade database."
    echo "Add this line to $PRIVATE_CONFIG:"
    echo '  "db_url": "sqlite:///user_data/tradesv3.live.sqlite",'
    exit 1
  fi
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
    echo "Downloading price history (takes a minute or two)..."
    if grep -qE '"timeframe": *"1d"' "user_data/$BOT_CONFIG"; then
      download_history --days 3450   # daily bot: everything back to 2017 for long backtests
    else
      download_history
    fi
    echo "Setup done. Next: ./bot.sh backtest   or   ./bot.sh start"
    ;;
  update-data)
    download_history "${@:2}"
    ;;
  backtest)
    # Default: the last 365 days (try ./bot.sh backtest 20190101- for the long view).
    # Costs: Kraken's worst-case 0.4% fee + 0.1% slippage per buy or sell.
    # Uses the current baseline, i.e. including every improvement kept so far.
    ensure_baseline
    timerange="${2:-$(days_ago 365)-}"
    $COMPOSE run --rm --no-deps freqtrade backtesting \
      --config "/freqtrade/user_data/$BOT_CONFIG" \
      --config /freqtrade/user_data/config.baseline.json \
      --timerange "$timerange" --fee 0.005 --cache none --export trades
    ;;
  start)
    ensure_private_config
    ensure_baseline
    check_live_db
    mkdir -p user_data/logs
    $COMPOSE up -d
    if live_mode; then
      echo "Bot started with REAL MONEY. New improvements wait for ./bot.sh approve."
    else
      echo "Bot started in PAPER-TRADING mode (no real money)."
    fi
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
  trades)
    if live_mode; then
      db="sqlite:///user_data/tradesv3.live.sqlite"; out="user_data/trades-real-money.csv"
    else
      # Paper trades live in the database named in the active bot config.
      db=$(grep -o '"db_url": *"[^"]*"' "user_data/$BOT_CONFIG" | cut -d'"' -f4); out="user_data/trades-paper.csv"
    fi
    $COMPOSE run --rm --no-deps --entrypoint python freqtrade \
      /freqtrade/storepilot_scripts/export_trades.py --db-url "$db" --out "/freqtrade/$out"
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
  trades        Save every trade to a CSV spreadsheet (for your records / tax)
  update-data   Re-download price history
EOF
    ;;
esac
