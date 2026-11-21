"""
Seed the bot with price history from Binance's public data archive.

Why this exists
---------------
The bot trades (or paper-trades) on Kraken, but Kraken's API only hands out
the most recent 720 candles. The machine-learning model needs months of
history to train and to be backtested, so we fill that history in from
https://data.binance.vision (free, no account, no API key).

Binance BTC/USDT and Kraken BTC/USD trade within a fraction of a percent of
each other, so the prices are a close stand-in. Once the bot is running it
tops the data up from Kraken itself.

Usage (from the trading-bot folder):
    python scripts/download_history.py                # default pairs, 450 days
    python scripts/download_history.py --days 200 --pairs BTC/USD ETH/USD
"""

from __future__ import annotations

import argparse
import io
import sys
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

import pandas as pd
import requests

BASE_URL = "https://data.binance.vision/data/spot"
DEFAULT_PAIRS = ["BTC/USD", "ETH/USD", "SOL/USD"]
DEFAULT_TIMEFRAMES = ["1h", "4h"]
COLUMNS = ["date", "open", "high", "low", "close", "volume"]


def binance_symbol(pair: str) -> str:
    """Kraken-style 'BTC/USD' -> Binance archive symbol 'BTCUSDT'."""
    base, quote = pair.split("/")
    if quote in ("USD", "USDT"):
        quote = "USDT"
    return f"{base}{quote}"


def month_starts(start: date, end: date) -> list[date]:
    months = []
    cur = date(start.year, start.month, 1)
    while cur <= end:
        months.append(cur)
        cur = date(cur.year + (cur.month // 12), cur.month % 12 + 1, 1)
    return months


def fetch_zip_csv(session: requests.Session, url: str) -> pd.DataFrame | None:
    resp = session.get(url, timeout=60)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        with zf.open(zf.namelist()[0]) as fh:
            raw = pd.read_csv(fh, header=None, usecols=range(6))
    # Some archive files carry a header row; drop it if present.
    raw = raw[pd.to_numeric(raw[0], errors="coerce").notna()].astype(float)
    raw.columns = COLUMNS
    # Since 2025 the spot archive uses microsecond timestamps; before that, milliseconds.
    unit = "us" if raw["date"].iloc[0] > 1e14 else "ms"
    raw["date"] = pd.to_datetime(raw["date"].astype("int64"), unit=unit, utc=True)
    return raw


def download_pair(pair: str, timeframe: str, days: int) -> pd.DataFrame:
    symbol = binance_symbol(pair)
    today = datetime.now(UTC).date()
    start = today - timedelta(days=days)
    this_month = date(today.year, today.month, 1)

    urls = []
    for m in month_starts(start, today):
        if m < this_month:
            urls.append(
                f"{BASE_URL}/monthly/klines/{symbol}/{timeframe}/"
                f"{symbol}-{timeframe}-{m:%Y-%m}.zip"
            )
    # Current month: daily files (yesterday is usually the latest published).
    day = max(this_month, start)
    while day < today:
        urls.append(
            f"{BASE_URL}/daily/klines/{symbol}/{timeframe}/{symbol}-{timeframe}-{day:%Y-%m-%d}.zip"
        )
        day += timedelta(days=1)

    with requests.Session() as session, ThreadPoolExecutor(max_workers=4) as pool:
        frames = [f for f in pool.map(lambda u: fetch_zip_csv(session, u), urls) if f is not None]

    if not frames:
        raise RuntimeError(f"No data found on data.binance.vision for {symbol} {timeframe}")
    df = pd.concat(frames).drop_duplicates("date").sort_values("date").reset_index(drop=True)
    return df[df["date"] >= pd.Timestamp(start, tz="UTC")]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--pairs", nargs="+", default=DEFAULT_PAIRS)
    parser.add_argument("--timeframes", nargs="+", default=DEFAULT_TIMEFRAMES)
    parser.add_argument("--days", type=int, default=450)
    parser.add_argument("--exchange", default="kraken", help="Which exchange folder to store data under")
    parser.add_argument("--datadir", default=str(Path(__file__).resolve().parent.parent / "user_data" / "data"))
    args = parser.parse_args()

    # Imported here so `--help` works without freqtrade installed.
    from freqtrade.data.history import get_datahandler
    from freqtrade.enums import CandleType

    datadir = Path(args.datadir) / args.exchange
    datadir.mkdir(parents=True, exist_ok=True)
    handler = get_datahandler(datadir, "feather")

    for pair in args.pairs:
        for tf in args.timeframes:
            df = download_pair(pair, tf, args.days)
            handler.ohlcv_store(pair, tf, df, CandleType.SPOT)
            print(f"{pair:10} {tf:>3}: {len(df):6} candles  {df['date'].iloc[0]:%Y-%m-%d} -> {df['date'].iloc[-1]:%Y-%m-%d %H:%M}")
    print(f"Saved to {datadir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
