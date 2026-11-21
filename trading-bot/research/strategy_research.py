"""
Strategy research: which kind of crypto strategy actually holds up?

Tests several well-known strategy families on ~9 years of daily prices for 10
coins, with Kraken fees, and judges them only on data they were not tuned on.

RULES (fixed before any results were looked at)
------------------------------------------------
Data       Daily candles from data.binance.vision (USDT pairs as a stand-in for
           Kraken USD pairs), Aug 2017 -> Nov 2026. A coin can only be traded once
           it has 200 days of history, so newly listed coins can't leak in.
Execution  Signals use data up to a day's close; trades happen at that close.
           Long only, no leverage, unused money sits in cash.
Costs      Main test: 0.40% Kraken taker fee + 0.10% slippage = 0.50% per buy or
           sell. Second test: 0.25% maker fee + 0.05% slippage = 0.30%.
Tuning     Walk-forward. For each calendar year 2019-2026, each family uses the
           parameter with the best Sharpe ratio on ALL data BEFORE that year,
           then gets judged on that year. Only these out-of-sample years count.
Pass mark  A family passes only if, out of sample (2019 -> Nov 2026), after
           0.50% costs, ALL of these hold:
             1. it made money (CAGR > 0)
             2. its worst drop is smaller than buy-and-hold BTC's
             3. its Calmar ratio (CAGR / worst drop) beats buy-and-hold BTC's
             4. it still made money with its single best year removed
             5. it did better than buy-and-hold BTC from Jan 2025 to Nov 2026

Known biases: the 10 coins are ones that are still big today (coins that died
are missing, which flatters strategies that hold many coins); Binance prices
stand in for Kraken's.

Usage:  python research/strategy_research.py     (writes research/RESULTS.md)
"""

from __future__ import annotations

import itertools
import math
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
COINS = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "LTC", "LINK", "BCH", "XLM"]
MIN_HISTORY = 200
COST_TAKER = 0.0050
COST_MAKER = 0.0030
OOS_START = "2019-01-01"
RECENT_START = "2025-01-01"
ML_BOT_WINDOW = ("2025-11-01", "2026-11-20")  # same window as the ML bot's -29.2% backtest


# --------------------------------------------------------------------------- data
def load_panel() -> dict[str, pd.DataFrame]:
    frames = {}
    for coin in COINS:
        df = pd.read_feather(DATA / f"{coin}-1d.feather").set_index("date")
        frames[coin] = df
    panel = {
        field: pd.DataFrame({c: f[field] for c, f in frames.items()}).sort_index()
        for field in ("open", "high", "low", "close")
    }
    idx = pd.date_range(panel["close"].index[0], panel["close"].index[-1], freq="D", tz="UTC")
    for field in panel:
        # A missing day inside a coin's history is filled from the previous day.
        panel[field] = panel[field].reindex(idx).ffill(limit=3)
    return panel


def eligible(close: pd.DataFrame) -> pd.DataFrame:
    return close.notna().cumsum() >= MIN_HISTORY


# --------------------------------------------------------------------------- simulator
@dataclass
class Result:
    equity: pd.Series      # portfolio value, starts at 1.0
    daily: pd.Series       # daily returns after costs
    exposure: pd.Series    # fraction of money invested
    trades: int            # number of buys + sells


def simulate(target: pd.DataFrame, close: pd.DataFrame, cost: float, band: float = 0.02) -> Result:
    """Hold `target` weights (decided at each close). Trade only when a position
    opens/closes or drifts more than `band` from its target."""
    rets = close.pct_change().fillna(0.0).to_numpy()
    tgt = target.fillna(0.0).to_numpy()
    n_days, n_coins = tgt.shape
    w = np.zeros(n_coins)
    equity = 1.0
    eq = np.empty(n_days)
    daily = np.empty(n_days)
    expo = np.empty(n_days)
    trades = 0
    for i in range(n_days):
        start = equity
        if i > 0:
            port = float(w @ rets[i])
            equity *= 1.0 + port
            if 1.0 + port > 0:
                w = w * (1.0 + rets[i]) / (1.0 + port)
        diff = tgt[i] - w
        opening = (w <= 1e-12) & (tgt[i] > 0)
        closing = (w > 1e-12) & (tgt[i] <= 0)
        move = opening | closing | (np.abs(diff) > band)
        diff = np.where(move, diff, 0.0)
        trades += int(opening.sum() + closing.sum())
        equity *= 1.0 - cost * np.abs(diff).sum()
        w = w + diff
        eq[i] = equity
        daily[i] = equity / start - 1.0
        expo[i] = w.sum()
    idx = close.index
    return Result(pd.Series(eq, idx), pd.Series(daily, idx), pd.Series(expo, idx), trades)


# --------------------------------------------------------------------------- strategy families
def per_coin_weights(signal: pd.DataFrame, elig: pd.DataFrame) -> pd.DataFrame:
    """Each eligible coin gets an equal slice of the money; the slice is invested
    only while that coin's signal is on."""
    n = elig.sum(axis=1).replace(0, np.nan)
    return (signal & elig).astype(float).div(n, axis=0).fillna(0.0)


def sma_trend(p, n):
    close = p["close"]
    return per_coin_weights(close > close.rolling(n).mean(), eligible(close))


def ts_momentum(p, lookback):
    close = p["close"]
    return per_coin_weights(close / close.shift(lookback) - 1 > 0, eligible(close))


def donchian(p, entry, exit_):
    close, high, low = p["close"], p["high"], p["low"]
    upper = high.rolling(entry).max().shift(1)
    lower = low.rolling(exit_).min().shift(1)
    state = pd.DataFrame(False, index=close.index, columns=close.columns)
    for coin in close.columns:
        c, u, lo = close[coin].to_numpy(), upper[coin].to_numpy(), lower[coin].to_numpy()
        on = False
        col = np.zeros(len(c), dtype=bool)
        for i in range(len(c)):
            if not on and c[i] > u[i]:
                on = True
            elif on and c[i] < lo[i]:
                on = False
            col[i] = on
        state[coin] = col
    return per_coin_weights(state, eligible(close))


def btc_trend(p, n):
    close = p["close"]
    w = pd.DataFrame(0.0, index=close.index, columns=close.columns)
    w["BTC"] = (close["BTC"] > close["BTC"].rolling(n).mean()).astype(float)
    w.loc[~eligible(close)["BTC"], "BTC"] = 0.0
    return w


def rotation(p, top_k, lookback, regime_n=200):
    """When BTC is above its `regime_n`-day average, hold the `top_k` coins with
    the strongest `lookback`-day gain (only coins that are actually rising).
    Re-picked every Monday; goes to cash the day BTC drops below its average."""
    close = p["close"]
    elig = eligible(close)
    mom = close / close.shift(lookback) - 1
    regime = close["BTC"] > close["BTC"].rolling(regime_n).mean()
    w = pd.DataFrame(np.nan, index=close.index, columns=close.columns)
    for day in close.index:
        if day.dayofweek == 0:
            m = mom.loc[day].where(elig.loc[day] & (mom.loc[day] > 0)).dropna()
            picks = m.nlargest(top_k).index
            row = pd.Series(0.0, index=close.columns)
            row[picks] = 1.0 / top_k
            w.loc[day] = row
    w = w.ffill().fillna(0.0)
    w[~regime] = 0.0
    return w


@dataclass
class Family:
    name: str
    plain: str
    build: Callable
    grid: list[tuple]


FAMILIES = [
    Family("btc_trend", "Hold BTC only while it is above its N-day average", btc_trend,
           [(50,), (100,), (150,), (200,)]),
    Family("sma_trend", "Each coin: hold it while it is above its N-day average", sma_trend,
           [(50,), (100,), (150,), (200,)]),
    Family("ts_momentum", "Each coin: hold it while it is up over the last L days", ts_momentum,
           [(30,), (60,), (90,), (180,)]),
    Family("donchian", "Each coin: buy a breakout to an N-day high, sell at an M-day low", donchian,
           [(20, 10), (55, 20), (100, 50)]),
    Family("rotation", "If BTC is in an uptrend, hold the K strongest coins (weekly)", rotation,
           [(k, lb) for k, lb in itertools.product([1, 3], [30, 90])]),
]


# --------------------------------------------------------------------------- metrics
def stats(daily: pd.Series) -> dict:
    daily = daily.dropna()
    eq = (1 + daily).cumprod()
    years = len(daily) / 365.0
    total = eq.iloc[-1] - 1
    cagr = eq.iloc[-1] ** (1 / years) - 1 if years > 0 and eq.iloc[-1] > 0 else -1.0
    dd = (eq / eq.cummax() - 1).min()
    sd = daily.std()
    sharpe = daily.mean() / sd * math.sqrt(365) if sd > 0 else 0.0
    calmar = cagr / abs(dd) if dd < 0 else float("inf")
    return {"total": total, "cagr": cagr, "max_dd": dd, "sharpe": sharpe, "calmar": calmar}


def yearly(daily: pd.Series) -> pd.Series:
    return (1 + daily).groupby(daily.index.year).prod() - 1


def walk_forward(results: dict[tuple, Result], start_year: int, end_year: int) -> tuple[pd.Series, list]:
    """Each year, use the parameters with the best Sharpe on all earlier data."""
    pieces, choices = [], []
    prev = None
    for year in range(start_year, end_year + 1):
        before = f"{year - 1}-12-31"
        best = max(results, key=lambda prm: stats(results[prm].daily[:before].loc[
            results[prm].exposure[:before].gt(0).idxmax():])["sharpe"]
            if results[prm].exposure[:before].gt(0).any() else -9)
        piece = results[best].daily[str(year)].copy()
        if prev is not None and best != prev and len(piece):
            piece.iloc[0] -= COST_TAKER  # charge a full switch of the portfolio
        pieces.append(piece)
        choices.append((year, best))
        prev = best
    return pd.concat(pieces), choices


# --------------------------------------------------------------------------- report
def pct(x: float) -> str:
    return f"{x * 100:+.1f}%"


def run() -> str:
    panel = load_panel()
    close = panel["close"]
    last_year = close.index[-1].year
    lines: list[str] = []
    out = lines.append

    out("# Strategy research results\n")
    out(f"Daily data {close.index[0]:%Y-%m-%d} -> {close.index[-1]:%Y-%m-%d}, coins: {', '.join(COINS)}.")
    out("Rules, costs and pass mark are in the header of `strategy_research.py` and were fixed before testing.\n")

    # Benchmarks
    btc_bh = pd.DataFrame(0.0, index=close.index, columns=close.columns)
    btc_bh["BTC"] = 1.0
    btc_bh.loc[~eligible(close)["BTC"], "BTC"] = 0.0
    elig = eligible(close)
    ew_bh = elig.astype(float).div(elig.sum(axis=1).replace(0, np.nan), axis=0).fillna(0.0)
    benchmarks = {
        "Buy & hold BTC": simulate(btc_bh, close, COST_TAKER, band=1.0),
        "Buy & hold all 10 coins (equal, rebalanced at >2% drift)": simulate(ew_bh, close, COST_TAKER),
    }

    fam_results: dict[str, dict] = {}
    for cost_name, cost in (("taker", COST_TAKER), ("maker", COST_MAKER)):
        for fam in FAMILIES:
            res = {prm: simulate(fam.build(panel, *prm), close, cost) for prm in fam.grid}
            wf, choices = walk_forward(res, int(OOS_START[:4]), last_year)
            fam_results.setdefault(fam.name, {})[cost_name] = (res, wf, choices)

    btc = benchmarks["Buy & hold BTC"].daily[OOS_START:]
    btc_s = stats(btc)
    btc_recent = stats(btc[RECENT_START:])["total"]

    out("## Out-of-sample results, 2019 -> Nov 2026 (0.50% per trade)\n")
    out("| Strategy | Total | Per year (CAGR) | Worst drop | Calmar | Sharpe | Jan 2025 -> now | Passes? |")
    out("|---|---|---|---|---|---|---|---|")
    for name, r in benchmarks.items():
        d = r.daily[OOS_START:]
        s = stats(d)
        out(f"| {name} | {pct(s['total'])} | {pct(s['cagr'])} | {pct(s['max_dd'])} | {s['calmar']:.2f} | "
            f"{s['sharpe']:.2f} | {pct(stats(d[RECENT_START:])['total'])} | benchmark |")
    verdicts = {}
    for fam in FAMILIES:
        _, wf, _ = fam_results[fam.name]["taker"]
        s = stats(wf)
        yr = yearly(wf)
        without_best = stats(wf[~wf.index.year.isin([yr.idxmax()])])["cagr"]
        recent = stats(wf[RECENT_START:])["total"]
        checks = {
            "made money": s["cagr"] > 0,
            "smaller worst drop than BTC": s["max_dd"] > btc_s["max_dd"],
            "better Calmar than BTC": s["calmar"] > btc_s["calmar"],
            "made money without its best year": without_best > 0,
            "beat BTC since Jan 2025": recent > btc_recent,
        }
        verdicts[fam.name] = checks
        ok = all(checks.values())
        out(f"| {fam.plain} | {pct(s['total'])} | {pct(s['cagr'])} | {pct(s['max_dd'])} | {s['calmar']:.2f} | "
            f"{s['sharpe']:.2f} | {pct(recent)} | {'**YES**' if ok else 'no'} |")

    out("\n### Why each family passed or failed\n")
    for fam in FAMILIES:
        failed = [k for k, v in verdicts[fam.name].items() if not v]
        out(f"- **{fam.plain}**: " + ("passed all 5 checks." if not failed else "failed: " + "; ".join(failed) + "."))

    out("\n## Year by year (out of sample, 0.50% per trade)\n")
    years = list(range(int(OOS_START[:4]), last_year + 1))
    out("| Strategy | " + " | ".join(str(y) for y in years) + " |")
    out("|---|" + "---|" * len(years))
    for name, r in benchmarks.items():
        yr = yearly(r.daily[OOS_START:])
        out(f"| {name} | " + " | ".join(pct(yr.get(y, 0.0)) for y in years) + " |")
    for fam in FAMILIES:
        yr = yearly(fam_results[fam.name]["taker"][1])
        out(f"| {fam.plain} | " + " | ".join(pct(yr.get(y, 0.0)) for y in years) + " |")

    out("\n## Same window as the ML bot's backtest (Nov 2025 -> Nov 2026)\n")
    out("The current ML bot lost **-29.2%** in this window (freqtrade backtest, 0.40% fee).\n")
    out("| Strategy | Return |")
    out("|---|---|")
    a, b = ML_BOT_WINDOW
    for name, r in benchmarks.items():
        out(f"| {name} | {pct(stats(r.daily[a:b])['total'])} |")
    for fam in FAMILIES:
        out(f"| {fam.plain} | {pct(stats(fam_results[fam.name]['taker'][1][a:b])['total'])} |")

    out("\n## With cheaper limit orders (0.30% per trade), out of sample\n")
    out("| Strategy | Total | CAGR | Worst drop | Calmar |")
    out("|---|---|---|---|---|")
    for fam in FAMILIES:
        s = stats(fam_results[fam.name]["maker"][1])
        out(f"| {fam.plain} | {pct(s['total'])} | {pct(s['cagr'])} | {pct(s['max_dd'])} | {s['calmar']:.2f} |")

    out("\n## Parameters picked each year (walk-forward) and trading activity\n")
    out("| Strategy | Picked per year | Trades per year (fixed params, whole period) | Avg. invested |")
    out("|---|---|---|---|")
    for fam in FAMILIES:
        res, _, choices = fam_results[fam.name]["taker"]
        picks = ", ".join(f"{y}:{'/'.join(map(str, p))}" for y, p in choices)
        n_years = len(close) / 365
        tpy = "; ".join(f"{'/'.join(map(str, p))}: {r.trades / n_years:.0f}" for p, r in res.items())
        expo = np.mean([r.exposure[OOS_START:].mean() for r in res.values()])
        out(f"| {fam.name} | {picks} | {tpy} | {expo * 100:.0f}% |")

    out("\n## Every parameter, whole period 2018 -> 2026, no walk-forward (for transparency only)\n")
    out("Picking the best row from this table would be cheating (it uses hindsight).\n")
    out("| Strategy | Params | Total | CAGR | Worst drop | Sharpe |")
    out("|---|---|---|---|---|---|")
    for fam in FAMILIES:
        for prm, r in fam_results[fam.name]["taker"][0].items():
            s = stats(r.daily["2018-03-01":])
            out(f"| {fam.name} | {'/'.join(map(str, prm))} | {pct(s['total'])} | {pct(s['cagr'])} | "
                f"{pct(s['max_dd'])} | {s['sharpe']:.2f} |")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    report = run()
    (HERE / "RESULTS.md").write_text(report)
    print(report)
    sys.exit(0)
