# Crypto trend bot (with a self-improving loop)

A crypto trading bot that runs 24/7 and paper-trades 10 major coins on Kraken with
a pretend wallet of about A$100 (US$65). It follows one simple rule that came out
of a proper research test: **own a coin only while it is in an uptrend; otherwise
sit in cash.** Alongside it, a second process keeps experimenting with the bot's
settings **like a scientist**. It changes one thing at a time, tests it, and keeps
the change only if it proves better.

It is built on [freqtrade](https://github.com/freqtrade/freqtrade) (57k GitHub
stars, free, open source).

> **This is not a fast money machine.** In past bull markets it made a lot. In
> the falling market of 2025–26 it lost a little (−4%) while just holding
> Bitcoin lost 38%. Its worst drop in testing was about 50–60%. It starts in
> paper-trading mode (real prices, fake money) and stays there unless you change
> it on purpose. See [Honest results](#honest-results).

---

## How it trades

Once a day, at the daily close (00:00 UTC, which is 10–11am in Sydney), for each of
10 coins (BTC, ETH, SOL, XRP, ADA, DOGE, LTC, LINK, BCH, XLM):

- **Close above its 50-day average price:** own it.
- **Close more than 1% below its 50-day average:** sell it and hold cash.

Each coin gets an equal slice of the wallet (about US$6.50 each). In a long
downtrend most slices sit in cash, and that's how it sidestepped much of the
2022 and 2025–26 crashes. The cost is buying back in after a rally has already
started, so it misses part of every rally.

## How we picked this strategy

The first version of this bot used machine learning to predict prices hour by
hour. It lost money: −29% in a year, and it still roughly broke even with zero
fees. In other words the model had no real edge. So we ran a proper test
(`research/`):

- **Data:** 9 years of daily prices for 10 coins (2017–2026), including three
  crashes and two big booms.
- **Strategies tested:** five well-known families. Hold Bitcoin only in uptrends;
  hold each coin only in uptrends; momentum; breakouts; rotating into the
  strongest coins.
- **Costs:** Kraken's full 0.4% fee plus 0.1% slippage on every trade.
- **Rules fixed in advance:** the rules and a 5-point pass mark were committed to
  git before any results were run. Each strategy's settings were chosen only from
  past data, then judged on the following year.

**Only one family passed: hold each coin only while it's above its average.** It
passed narrowly. Full results are in [`research/RESULTS.md`](research/RESULTS.md).

## How it improves itself (the scientific method)

The improver (`scripts/improver.py`) runs this loop forever:

```
  1. CHANGE 1 VARIABLE  ->  2. TEST          ->  3. MEASURE          ->  4. NEW BASELINE
     exactly one setting     replay years of      score it against       keep it only if it
     moved one step          real prices          the goal and the       wins; otherwise
                                                  current baseline       throw it away
        ^                                                                     |
        +------------- the next change starts from the (new) baseline --------+
```

- **The goal** (in `user_data/improver.json`): *profit after costs, minus half of
  the worst drop.* A change that earns a bit more but risks a lot more doesn't count.
- **What it may change:** the averaging period (30–200 days), the sell buffer
  (0–5%), whether coins may only be held while Bitcoin is also in an uptrend, and
  the emergency stop-loss. Each experiment moves exactly one of them one step.
- **Two tests, not one.** A change is first tested on 4 years of older data. If
  it wins there by a clear margin, it must **also** win on the most recent 1.5
  years, which played no part in choosing it.
- **It never stops.** Each kept change becomes the new baseline. When everything
  has been tried, it waits for a new week of data and starts again.
- **Going live:** in paper-trading mode a proven change goes live straight away
  (the running bot reloads its settings). In real-money mode it waits for you to
  run `./bot.sh approve`.

Its first real run (`./bot.sh experiments`):

```
Current baseline: B1 (since 2026-11-21) - E2: trend.exit_buffer 0.0 -> 0.01
  trend.exit_buffer: 0.0 -> 0.01

Experiments: 9 run, 1 kept, 8 discarded or failed.

ID    Base Change                               Search score       Confirm score      Result
E1    B0   trend.sma_period 50 -> 30            105.36 -> 44.4     -                  DISCARDED
E2    B0   trend.exit_buffer 0.0 -> 0.01        105.36 -> 117.52   -26.58 -> -21.4    KEPT (now B1)
E3    B1   trend.btc_filter false -> true       117.52 -> 163.63   -21.4 -> -22.39    DISCARDED
E4    B1   stoploss -0.25 -> -0.35              117.52 -> 118.42   -                  DISCARDED
E5    B1   trend.sma_period 50 -> 30            117.52 -> 89.67    -                  DISCARDED
E6    B1   trend.exit_buffer 0.01 -> 0.0        117.52 -> 105.36   -                  DISCARDED
E7    B1   stoploss -0.25 -> -0.15              117.52 -> 104.2    -                  DISCARDED
E8    B1   trend.sma_period 50 -> 75            117.52 -> 33.1     -                  DISCARDED
E9    B1   trend.exit_buffer 0.01 -> 0.02       117.52 -> 118.41   -                  DISCARDED
```

E3 shows why there are two tests. The Bitcoin filter looked much better on the
older data (117 → 164) but slightly worse on the newest 1.5 years, so it was
thrown away. Each experiment takes about 10 seconds.

## Honest results

Freqtrade backtests of the bot as it stands now (50-day average, 1% sell buffer),
starting with US$65 and paying 0.5% on every buy and sell:

| Period | This bot | Just holding Bitcoin | Old ML bot |
|---|---|---|---|
| Jan 2019 → Nov 2026 | **+1,968%** (US$65 → US$1,344), worst drop −49% | +1,452%, worst drop −77% | – |
| Jan 2025 → Nov 2026 (falling market) | **−3.6%**, worst drop −34% | −37.7% | – |
| Nov 2025 → Nov 2026 | **−10.3%** | −46.5% | −29.2% |

**Why the first row is too good to expect again:**

- **Hindsight in the coin list.** These 10 coins are the ones still big *today*.
  In 2019 nobody knew SOL would exist or DOGE would boom, and coins that later
  collapsed aren't in the test. That flatters the result.
- **Hindsight in the settings.** The 50 days and the 1% buffer were picked using
  data that overlaps these years.
- **The realistic figure is the stricter research test,** where settings were
  only ever picked from earlier years: about **+35% a year, worst drop −63%,
  2019–2026.** Treat even that as an optimistic ceiling, not a forecast.

**What that means for A$100:** in a bull market it has done very well. In a bear
market it loses slowly while mostly sitting in cash. At some point expect to see
A$100 fall to around A$50 before it (maybe) recovers. All of its past gains came
from crypto booms. If crypto never booms again, this bot won't make money either.

## Safety rules built in

| Rule | Setting |
|---|---|
| Money | Paper trading with a pretend US$65, about A$100 (`dry_run: true`) |
| Direction | Buys only. No shorting, no leverage, no borrowing |
| Positions | Up to 10 coins, about US$6.50 each (Kraken's minimums are US$2.60–3.50) |
| Selling | When a coin's daily close is more than 1% below its 50-day average |
| Emergency stop | −25% on any one coin, **held by Kraken itself**, so it protects you even when your computer is off |
| Pace | About 90 trades (a buy plus a sell) a year across all 10 coins, checked once a day |

## What you need

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Mac,
  Windows or Linux). It runs the bot in a sealed box with everything installed.
- **A computer that's on around the daily close** (10–11am Sydney time). The bot
  only acts once a day, and the stop-loss sits on Kraken, so a laptop that's on
  during the day is fine.
- On Windows, run the commands below in **WSL** or **Git Bash**.

## Quick start

```bash
cd trading-bot
./bot.sh setup               # creates a dashboard password, downloads the bot and price history
./bot.sh backtest 20190101-  # optional: replay 2019 to now and see how it would have done
./bot.sh start               # starts paper trading + the self-improvement loop
./bot.sh login               # shows the dashboard address and password
```

Then open **http://localhost:8080** in your browser and log in.

Other commands: `./bot.sh experiments` (what the improver tried and kept),
`./bot.sh trades` (save every trade to a spreadsheet), `./bot.sh logs` (watch it
live; `./bot.sh logs improver` for only the experiments), `./bot.sh status`,
`./bot.sh stop`, `./bot.sh restart`. Run `./bot.sh` on its own to see them all.

The bot restarts by itself after a crash or a computer reboot. Keep Docker
Desktop set to start when you log in.

## Reading the dashboard

When you judge the bot, look at these in order:

1. **Total profit after fees.** This is the only number that pays you.
2. **Compared with just holding Bitcoin.** In a rising market it will usually be
   *behind* holding. It earns its keep by losing less in falls.
3. **Max drawdown.** The worst drop from a high point. Could you live with it with
   real money?
4. Win rate comes last. Trend strategies typically win fewer than half their
   trades: many small losses on false starts, a few big wins on real trends.

## Before you ever use real money

This bot is slow. It may sit in cash for weeks in a falling market, so judge it
over months, not days. Only consider real money if **all** of these are true:

- [ ] At least **3 months** of paper trading, and it behaved as described: buying
      coins in uptrends and selling when trends broke
- [ ] You've seen and accepted its worst-case drop (about half the money)
- [ ] You accept it can lose money for a whole year in a bear market
- [ ] It's money you can afford to lose completely

If you get there: create a Kraken API key with **trading permission only, never
withdrawal permission**. Add these lines to `user_data/config.private.json`, next to
the `"api_server"` part that's already there. Never paste keys into a chat or commit them.

```json
  "dry_run": false,
  "db_url": "sqlite:///user_data/tradesv3.live.sqlite",
  "exchange": { "key": "YOUR-KRAKEN-API-KEY", "secret": "YOUR-KRAKEN-API-SECRET" },
```

The separate `db_url` keeps real trades apart from paper trades. `./bot.sh start`
refuses to start in real-money mode without it. In real-money mode the improver
still runs, but new settings wait for `./bot.sh approve`.

### If you're in Australia

- **Trade the USD pairs, not the AUD ones.** Kraken lists BTC/AUD, ETH/AUD and
  SOL/AUD, but in Nov 2026 their spreads (the gap between buy and sell prices)
  were 0.11–0.26%, against 0.00–0.05% on the USD pairs, with about 100 times less
  trading. Deposit AUD into Kraken, convert it to USD once (A$100 ≈ US$66 at
  0.658), and let the bot trade in USD.
- **Tax:** the ATO treats every crypto sale or swap as a capital gains event, so
  each trade the bot makes needs a record. `./bot.sh trades` saves every trade
  (dates, prices, fees, profit or loss) to a CSV spreadsheet in `user_data/`. Talk
  to an accountant or check the ATO's crypto guidance before trading real money.

## The old machine-learning bot (experimental)

The original hourly ML bot (`SelfLearningStrategy`, settings in
`config.ml.json` and `improver.ml.json`) is still here for experimenting. In
testing it lost money: −29% over Nov 2025 → Nov 2026, and −2.7% even with zero
fees. To run it instead of the trend bot, create a file called `.env` in this
folder containing:

```
BOT_CONFIG=config.ml.json
IMPROVER_SETTINGS=improver.ml.json
```

Then run `./bot.sh setup` and `./bot.sh start`. It needs a computer that's on
24/7. It uses its own paper-trade database. Delete `user_data/experiments/` and
`user_data/config.baseline.json` when switching, because they belong to the
other bot's experiments.

## Ideas for what to add next

1. **Cheaper orders.** With limit orders at about 0.3% instead of 0.5% per trade,
   the research result improved clearly (worst drop −60%, better
   return-for-risk than holding Bitcoin). Making sure most orders fill as "maker"
   orders is the cheapest win available.
2. **A coin list that updates itself,** for example the 10 biggest coins each
   month. This removes the hindsight in the fixed list and keeps the bot on the
   coins that matter now.
3. **Position sizing by volatility:** smaller slices for wilder coins (DOGE) and
   bigger for calmer ones (BTC), to shrink the worst drop.
4. Each new idea goes into the improver as one more variable, so it gets the same
   two-test treatment.

## What's in this folder

```
trading-bot/
├── bot.sh                       # the one-word commands
├── docker-compose.yml           # runs the bot and the improver
├── research/
│   ├── strategy_research.py     # the pre-registered strategy test
│   └── RESULTS.md               # its results
├── scripts/
│   ├── download_history.py      # fetches price history (see note below)
│   ├── improver.py              # the self-improvement loop
│   └── export_trades.py         # trades -> CSV spreadsheet
└── user_data/
    ├── config.json              # the trend bot's settings (coins, wallet, rule, stop-loss)
    ├── improver.json            # the improver's goal, test windows and the variables it may change
    ├── config.baseline.json     # changes the improver has proven better (created automatically)
    ├── config.private.json      # your password/keys, created by setup, never committed
    ├── config.ml.json, improver.ml.json   # the experimental ML bot
    ├── experiments/             # the improver's lab notebook: journal.jsonl + state
    └── strategies/
        ├── TrendStrategy.py         # the trend rule
        └── SelfLearningStrategy.py  # the experimental ML strategy
```

### Technical notes

- **Why Kraken:** it's available in Australia, the US and most other countries
  and is officially supported by freqtrade.
- **Where the price history comes from:** Kraken only gives out the last 720
  candles, about 2 years of daily ones. That's plenty for the live bot, but not
  for long backtests. `download_history.py` fills in older history from Binance's
  free public archive (data.binance.vision). Prices there are within a fraction
  of a percent of Kraken's. Refreshes merge into what's already on disk, so older
  history is never thrown away.
- **Settings are layered** as `config.json`, then `config.baseline.json`, then
  `config.private.json`, with later files winning. To restart the experiments from
  scratch, stop the bot and delete `user_data/experiments/` and
  `user_data/config.baseline.json`.
- **Tested with** freqtrade 2026.10 (the Docker image is pinned to that version).
