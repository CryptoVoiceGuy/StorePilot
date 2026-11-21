# Self-learning crypto trading bot

A crypto trading bot that runs 24/7, retrains its own machine-learning model on
the newest market data every few hours, and paper-trades BTC, ETH and SOL on
Kraken with a pretend $50 wallet.

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
  (don't let it sleep) or a small cloud server (about $5–6 a month, with 2 GB
  RAM recommended). On a $50 account, a $5 server costs 10% of your money every
  month. Run it on your own computer while it's in paper mode.
- On Windows, run the commands below in **WSL** or **Git Bash**.

## Quick start

```bash
cd trading-bot
./bot.sh setup      # creates a dashboard password, downloads the bot and price history
./bot.sh backtest   # optional: replay the last year to see how it would have done
./bot.sh start      # starts paper trading 24/7 in the background
./bot.sh login      # shows the dashboard address and password
```

Then open **http://localhost:8080** in your browser and log in.

Other commands: `./bot.sh logs` (watch it live), `./bot.sh status`,
`./bot.sh stop`, `./bot.sh restart` (after editing settings).

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

## Ideas for making it self-improving

Possible next steps, from most to least useful:

1. **Automatic re-tuning.** Once a week, re-optimize the buy threshold on the latest
   data, and only keep the new settings if they also do better on data they weren't
   tuned on.
2. **Model tournament.** Train several kinds of models side by side in paper mode
   and automatically promote whichever has done best over the last month.
3. **News and sentiment.** Add a "how positive is crypto news right now" score as
   an extra input. Then test whether it actually helps, because it usually adds noise.
4. **Reinforcement learning.** FreqAI has a mode where the bot learns by trial and
   error in simulation. It's powerful, but it overfits easily.

## What's in this folder

```
trading-bot/
├── bot.sh                     # the one-word commands
├── docker-compose.yml         # how Docker runs the bot 24/7
├── scripts/
│   └── download_history.py    # fetches price history (see note below)
└── user_data/
    ├── config.json            # all settings (pairs, wallet, risk, learning)
    ├── config.private.json    # your password/keys, created by setup, never committed
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
- **Tested with** freqtrade 2026.10 (the Docker image is pinned to that version).
