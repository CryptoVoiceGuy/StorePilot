# Self-learning crypto trading bot

A crypto trading bot that runs 24/7, retrains its own machine-learning model on
the newest market data every few hours, and paper-trades BTC, ETH and SOL on
Kraken with a pretend $50 wallet. Alongside it, a second process keeps
experimenting with the bot's settings **like a scientist**. It changes one thing
at a time, tests it, and keeps the change only if it proves better.

It is built on [freqtrade](https://github.com/freqtrade/freqtrade) (57k GitHub
stars, free, open source) and its machine-learning module
[FreqAI](https://www.freqtrade.io/en/stable/freqai/).

> **This bot is not proven to make money, and right now it doesn't.** See
> [Honest results so far](#honest-results-so-far). It starts in paper-trading
> mode (real prices, fake money) and stays there unless you change it on purpose.

---

## How it learns

1. **It retrains itself every 6 hours.** The model is thrown away and re-trained
   on the last 60 days of prices, with recent days counting more. When the market
   changes, the model changes with it.
2. **It calibrates its own buy threshold.** It tracks its own recent predictions
   and only buys when the current one clearly stands out. It never buys on a
   predicted move too small to cover Kraken's fees (about 0.8% for a buy plus a sell).
3. **It learns from its own losing streaks.** Before every buy it checks its last 6
   closed trades. If they lost money overall, it becomes 50% pickier until results
   recover.

Every hour the model answers one question for each coin: *"Over the next 12 hours,
how far above or below today's price will the average price be?"* If the answer
is a clear "up", it buys. When the answer turns to "down", it sells.

## How it improves itself (the scientific method)

The improver (`scripts/improver.py`) runs this loop forever:

```
  1. CHANGE 1 VARIABLE  ->  2. TEST          ->  3. MEASURE          ->  4. NEW BASELINE
     exactly one setting     replay months of     score it against       keep it only if it
     moved one step          prices, retraining   the goal and the       wins; otherwise
                             weekly like live     current baseline       throw it away
        ^                                                                     |
        +------------- the next change starts from the (new) baseline --------+
```

- **The goal** (in `user_data/improver.json`): *profit after fees, minus half of
  the worst drop.* A change that earns a bit more but risks a lot more doesn't count.
- **What it may change:** 14 settings, including the buy threshold, stop-loss, how
  many days the model trains on, how far ahead it predicts, and model size.
  Each experiment moves exactly one of them one step up or down from the current baseline.
- **Two tests, not one.** A change is first tested on older months (the
  "search" window, about 8 months). If it wins there, it must **also** win on the
  most recent 4 months, which played no part in choosing it. Most changes that
  look good by luck fail this second test.
- **Rules against fooling itself:** it must beat the baseline by a clear margin
  (2 points), it must make enough trades to count (at least 15, then 6), and every
  experiment is recorded, including failures.
- **It never stops.** Each kept change becomes the new baseline that later
  experiments build on. When every one-step change has been tried, it waits for a
  new week of market data and starts again, because the market keeps changing.
- **Going live:** in paper-trading mode a proven change goes live straight away
  (the running bot reloads its settings and trains a fresh model). In real-money
  mode it waits for you to run `./bot.sh approve`.

See what it has done with `./bot.sh experiments`. These are its first three real
experiments (Nov 2026). All three made things worse, so all three were thrown away:

```
Current baseline: B0 (since 2026-11-21) - starting settings
  Same as config.json: no change has passed the test yet.

Experiments: 3 run, 0 kept, 3 discarded or failed.

ID    Date       Base Change                                     Search score       Confirm score  Result
E1    2026-11-21 B0   selflearning.min_edge 0.012 -> 0.01        -26.07 -> -36.36   -              DISCARDED
E2    2026-11-21 B0   selflearning.signal_strength 1.0 -> 0.5    -26.07 -> -33.65   -              DISCARDED
E3    2026-11-21 B0   selflearning.streak_penalty 1.5 -> 1.25    -26.07 -> -46.02   -              DISCARDED
```

Each experiment takes about 1.5–5 minutes of computer time. It runs at low priority
so it never slows the trading bot, with a 15-minute pause between experiments.

## Safety rules built in

| Rule | Setting |
|---|---|
| Money | Paper trading with a pretend $50 (`dry_run: true`) |
| Direction | Buys only. No shorting, no leverage, no borrowing |
| Positions | At most 2 coins at once, about $25 each |
| Max loss per trade | 5% stop-loss |
| Lock in gains | Once a trade is up 2.5%, a 1% trailing stop protects the profit |
| Max holding time | 24 hours |
| Two stop-losses in a day | Stops buying for 12 hours |
| Down 15% in a week | Stops buying for 2 days |
| A coin keeps losing | That coin is benched for 2 days |

## Honest results so far

Backtest from **Nov 2025 to Nov 2026**, run "walk-forward". The model retrained
every week on only the 60 days before that week, so it never saw the future.
Fees were charged at Kraken's worst case of 0.4% per buy or sell.

| | Start | End | Result |
|---|---|---|---|
| **This bot (current version)** | $50 | $35.42 | **−29.2%** (47 trades, 32% won) |
| Earlier version (before a bug fix) | $50 | $41.62 | −16.8% (45 trades, 42% won) |
| Just holding BTC, ETH and SOL | | | **−52.9%** |

What this tells us:
- It lost much less than holding through a very bad year for crypto, mostly
  because it sits in cash most of the time.
- **It still lost money.** A small, sensible fix moved the result by 12 points,
  which means most of what you see is luck, not skill. There's no reliable edge yet.
- Win rate isn't the thing to watch. The most common way it lost money was the
  5% stop-loss: 7 trades lost 18% between them.

## What you need

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Mac,
  Windows or Linux). It runs the bot in a sealed box with everything installed.
- **A computer that stays on**, for 24/7 running. Either your own computer
  (don't let it sleep) or a small cloud server (4 GB RAM recommended, because the
  bot and the improver run side by side; roughly $10–20 a month). On a $50
  account a server costs more than the bot could plausibly earn, so run it on your
  own computer while it's in paper mode.
- On Windows, run the commands below in **WSL** or **Git Bash**.

## Quick start

```bash
cd trading-bot
./bot.sh setup      # creates a dashboard password, downloads the bot and price history
./bot.sh backtest   # optional: replay the last year to see how it would have done
./bot.sh start      # starts paper trading + the self-improvement loop, 24/7
./bot.sh login      # shows the dashboard address and password
```

Then open **http://localhost:8080** in your browser and log in.

Other commands: `./bot.sh experiments` (what the improver tried and kept),
`./bot.sh logs` (watch it live; `./bot.sh logs improver` for only the
experiments), `./bot.sh status`, `./bot.sh stop`, `./bot.sh restart` (after
editing settings). Run `./bot.sh` on its own to see them all.

The bot restarts by itself after a crash or a computer reboot. Keep Docker
Desktop set to start when you log in.

## Reading the dashboard

When you judge the bot, look at these in order:

1. **Total profit after fees.** This is the only number that pays you.
2. **Compared with just holding BTC.** If holding did better, the bot isn't
   adding anything.
3. **Max drawdown.** The worst drop from a high point. Could you live with it
   with real money?
4. Win rate comes last. A bot can win 90% of trades and still lose money.

## Before you ever use real money

Only consider it if **all** of these are true:

- [ ] At least **2 months** of paper trading with a profit after fees
- [ ] It beat simply holding BTC over the same period
- [ ] The worst drawdown was something you'd be OK losing for real
- [ ] You understand why it made each trade (the dashboard shows this)

If you get there: create a Kraken API key with **trading permission only, never
withdrawal permission**. Put the key and secret in `user_data/config.private.json`
under `"exchange"`, set `"dry_run": false` there, and start with an amount you'd
be fine losing completely.

## Ideas for what to add next

Each of these would plug into the improver as one more "variable" to test:

1. **Model tournament.** Let the improver also swap the kind of model (LightGBM,
   XGBoost, CatBoost) and keep whichever wins.
2. **News and sentiment.** Add a "how positive is crypto news right now" score as
   an extra input. Then let the improver test whether it actually helps, because
   it usually adds noise.
3. **Live paper results as the final test.** Promote a change only after it has
   also beaten the old settings in a few weeks of side-by-side paper trading.
4. **Reinforcement learning.** FreqAI has a mode where the bot learns by trial and
   error in simulation. It's powerful, but it overfits easily.

## What's in this folder

```
trading-bot/
├── bot.sh                     # the one-word commands
├── docker-compose.yml         # runs the bot and the improver 24/7
├── scripts/
│   ├── download_history.py    # fetches price history (see note below)
│   └── improver.py            # the self-improvement loop
└── user_data/
    ├── config.json            # starting settings (pairs, wallet, risk, learning)
    ├── improver.json          # the improver's goal, test windows and the variables it may change
    ├── config.baseline.json   # changes the improver has proven better (created automatically)
    ├── config.private.json    # your password/keys, created by setup, never committed
    ├── experiments/           # the improver's lab notebook: journal.jsonl + state
    └── strategies/
        └── SelfLearningStrategy.py   # the brain: features, predictions, buy/sell rules
```

### Technical notes

- **Why Kraken:** it's available in the US and most other countries and is
  officially supported by freqtrade. To use another exchange, change
  `exchange.name` and the pair names in `config.json`. Binance has lower fees but
  blocks the US.
- **Where the price history comes from:** Kraken only gives out the last 720
  candles, which isn't enough to train or backtest. So `download_history.py` seeds
  history from Binance's free public archive (data.binance.vision). Prices on the
  two exchanges are within a fraction of a percent of each other, and the bot
  tops up from Kraken while it runs. The model uses only price-based ratios, not
  raw volume, so the two sources blend cleanly. FreqAI blocks Kraken by default
  for this reason, so `override_exchange_checks` is switched on.
- **Model:** LightGBM regressor, about 84–164 features (RSI, ADX, rate of change,
  distance from moving averages, volatility, Bollinger position, on 1h and 4h
  candles, plus BTC as a market signal). It retrains every 6 hours live and every
  7 days in backtests.
- **Improver internals:** settings are layered as `config.json`, then
  `config.baseline.json`, then `config.private.json`, with later files winning.
  Every experiment backtest uses its own model folder, which is deleted afterwards.
  Each live baseline gets a fresh one too, so a model is never reused with
  different inputs. Price history is re-downloaded from the Binance archive once
  a week, so every experiment in a week compares on identical data. To restart
  the experiments from scratch, stop the bot and delete
  `user_data/experiments/` and `user_data/config.baseline.json`.
- **Tested with** freqtrade 2026.10 (the Docker image is pinned to that version).
