# Strategy research results

Daily data 2017-08-17 -> 2026-11-20, coins: BTC, ETH, SOL, XRP, ADA, DOGE, LTC, LINK, BCH, XLM.
Rules, costs and pass mark are in the header of `strategy_research.py` and were fixed before testing.

## Out-of-sample results, 2019 -> Nov 2026 (0.50% per trade)

| Strategy | Total | Per year (CAGR) | Worst drop | Calmar | Sharpe | Jan 2025 -> now | Passes? |
|---|---|---|---|---|---|---|---|
| Buy & hold BTC | +1492.0% | +42.0% | -76.6% | 0.55 | 0.88 | -37.0% | benchmark |
| Buy & hold all 10 coins (equal, rebalanced at >2% drift) | +1857.9% | +45.8% | -79.7% | 0.57 | 0.88 | -57.4% | benchmark |
| Hold BTC only while it is above its N-day average | +940.1% | +34.5% | -73.2% | 0.47 | 0.88 | -20.2% | no |
| Each coin: hold it while it is above its N-day average | +962.2% | +34.9% | -62.7% | 0.56 | 0.84 | -29.8% | **YES** |
| Each coin: hold it while it is up over the last L days | +471.3% | +24.7% | -66.3% | 0.37 | 0.68 | -54.3% | no |
| Each coin: buy a breakout to an N-day high, sell at an M-day low | +622.9% | +28.5% | -55.9% | 0.51 | 0.81 | -33.5% | no |
| If BTC is in an uptrend, hold the K strongest coins (weekly) | +347.7% | +20.9% | -74.1% | 0.28 | 0.62 | -56.4% | no |

### Why each family passed or failed

- **Hold BTC only while it is above its N-day average**: failed: better Calmar than BTC.
- **Each coin: hold it while it is above its N-day average**: passed all 5 checks.
- **Each coin: hold it while it is up over the last L days**: failed: better Calmar than BTC; made money without its best year; beat BTC since Jan 2025.
- **Each coin: buy a breakout to an N-day high, sell at an M-day low**: failed: better Calmar than BTC.
- **If BTC is in an uptrend, hold the K strongest coins (weekly)**: failed: better Calmar than BTC; beat BTC since Jan 2025.

## Year by year (out of sample, 0.50% per trade)

| Strategy | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|
| Buy & hold BTC | +94.3% | +302.0% | +59.8% | -64.2% | +155.6% | +121.3% | -6.3% | -32.7% |
| Buy & hold all 10 coins (equal, rebalanced at >2% drift) | -0.1% | +297.2% | +580.1% | -69.0% | +147.5% | +121.4% | -23.1% | -44.6% |
| Hold BTC only while it is above its N-day average | +126.6% | +178.3% | +30.6% | -54.4% | +84.5% | +88.1% | -14.2% | -7.0% |
| Each coin: hold it while it is above its N-day average | +26.6% | +73.7% | +449.8% | -48.5% | +54.5% | +57.2% | -16.5% | -15.9% |
| Each coin: hold it while it is up over the last L days | -22.6% | +50.9% | +633.0% | -42.5% | +56.4% | +62.1% | -27.7% | -36.7% |
| Each coin: buy a breakout to an N-day high, sell at an M-day low | +4.5% | +94.2% | +249.5% | -32.5% | +42.2% | +59.5% | -19.6% | -17.2% |
| If BTC is in an uptrend, hold the K strongest coins (weekly) | -17.0% | +85.1% | +166.9% | -0.5% | +57.2% | +60.0% | -37.4% | -30.3% |

## Same window as the ML bot's backtest (Nov 2025 -> Nov 2026)

The current ML bot lost **-29.2%** in this window (freqtrade backtest, 0.40% fee).

| Strategy | Return |
|---|---|
| Buy & hold BTC | -46.2% |
| Buy & hold all 10 coins (equal, rebalanced at >2% drift) | -58.8% |
| Hold BTC only while it is above its N-day average | -7.0% |
| Each coin: hold it while it is above its N-day average | -16.5% |
| Each coin: hold it while it is up over the last L days | -39.2% |
| Each coin: buy a breakout to an N-day high, sell at an M-day low | -21.6% |
| If BTC is in an uptrend, hold the K strongest coins (weekly) | -37.4% |

## With cheaper limit orders (0.30% per trade), out of sample

| Strategy | Total | CAGR | Worst drop | Calmar |
|---|---|---|---|---|
| Hold BTC only while it is above its N-day average | +964.3% | +34.9% | -71.3% | 0.49 |
| Each coin: hold it while it is above its N-day average | +1437.8% | +41.4% | -59.8% | 0.69 |
| Each coin: hold it while it is up over the last L days | +776.4% | +31.7% | -62.1% | 0.51 |
| Each coin: buy a breakout to an N-day high, sell at an M-day low | +717.5% | +30.5% | -54.4% | 0.56 |
| If BTC is in an uptrend, hold the K strongest coins (weekly) | +516.1% | +25.9% | -72.2% | 0.36 |

## Parameters picked each year (walk-forward) and trading activity

| Strategy | Picked per year | Trades per year (fixed params, whole period) | Avg. invested |
|---|---|---|---|
| btc_trend | 2019:100, 2020:150, 2021:150, 2022:50, 2023:150, 2024:150, 2025:150, 2026:150 | 50: 19; 100: 12; 150: 7; 200: 7 | 57% |
| sma_trend | 2019:50, 2020:100, 2021:50, 2022:50, 2023:50, 2024:50, 2025:50, 2026:50 | 50: 189; 100: 137; 150: 98; 200: 84 | 48% |
| ts_momentum | 2019:180, 2020:60, 2021:30, 2022:30, 2023:30, 2024:30, 2025:30, 2026:30 | 30: 244; 60: 174; 90: 133; 180: 95 | 50% |
| donchian | 2019:20/10, 2020:55/20, 2021:20/10, 2022:20/10, 2023:20/10, 2024:20/10, 2025:20/10, 2026:55/20 | 20/10: 82; 55/20: 39; 100/50: 20 | 37% |
| rotation | 2019:1/90, 2020:3/90, 2021:3/30, 2022:3/90, 2023:3/90, 2024:1/90, 2025:3/90, 2026:1/90 | 1/30: 25; 1/90: 18; 3/30: 54; 3/90: 38 | 52% |

## Every parameter, whole period 2018 -> 2026, no walk-forward (for transparency only)

Picking the best row from this table would be cheating (it uses hindsight).

| Strategy | Params | Total | CAGR | Worst drop | Sharpe |
|---|---|---|---|---|---|
| btc_trend | 50 | +1113.8% | +33.1% | -61.8% | 0.88 |
| btc_trend | 100 | +1200.2% | +34.1% | -41.4% | 0.90 |
| btc_trend | 150 | +1369.5% | +36.0% | -46.6% | 0.94 |
| btc_trend | 200 | +411.4% | +20.6% | -66.8% | 0.65 |
| sma_trend | 50 | +1280.4% | +35.1% | -62.7% | 0.85 |
| sma_trend | 100 | +520.0% | +23.2% | -77.1% | 0.67 |
| sma_trend | 150 | +926.3% | +30.6% | -66.3% | 0.78 |
| sma_trend | 200 | +551.6% | +23.9% | -66.1% | 0.67 |
| ts_momentum | 30 | +649.7% | +25.9% | -66.3% | 0.71 |
| ts_momentum | 60 | +409.0% | +20.5% | -74.2% | 0.62 |
| ts_momentum | 90 | +175.5% | +12.3% | -77.1% | 0.48 |
| ts_momentum | 180 | +325.9% | +18.1% | -68.7% | 0.57 |
| donchian | 20/10 | +747.6% | +27.7% | -55.9% | 0.80 |
| donchian | 55/20 | +883.1% | +29.9% | -57.7% | 0.83 |
| donchian | 100/50 | +536.0% | +23.6% | -57.6% | 0.69 |
| rotation | 1/30 | +183.0% | +12.7% | -74.7% | 0.54 |
| rotation | 1/90 | +4339.9% | +54.4% | -69.9% | 0.89 |
| rotation | 3/30 | +1140.8% | +33.4% | -74.5% | 0.79 |
| rotation | 3/90 | +1248.1% | +34.7% | -65.1% | 0.80 |
