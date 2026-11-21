"""
Save every trade the bot has made to a CSV file (opens in Excel / Google Sheets).

Useful for tax records: in Australia, for example, the ATO treats every crypto
sale or swap as a capital gains event.

Usage (from the trading-bot folder; ./bot.sh trades does this for you):
    python scripts/export_trades.py --db-url sqlite:///user_data/tradesv3.dryrun.sqlite
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

HEADER = [
    "Trade #", "Pair", "Still open", "Bought (UTC)", "Amount of coin", "Buy price", "Buy value",
    "Buy fee", "Sold (UTC)", "Sell price", "Sell value", "Sell fee", "Profit/loss after fees",
    "Profit/loss %", "Currency", "Why it sold",
]


def first(*values):
    return next((v for v in values if v is not None), None)


def row(trade) -> list:
    j = trade.to_json()
    amount, open_rate, close_rate = j["amount"], j["open_rate"], j.get("close_rate")
    closed = not j["is_open"] and close_rate is not None
    buy_value = amount * open_rate
    sell_value = amount * close_rate if closed else None
    buy_fee = first(j.get("fee_open_cost"), buy_value * (j.get("fee_open") or 0))
    sell_fee = first(j.get("fee_close_cost"), sell_value * (j.get("fee_close") or 0)) if closed else None
    profit = first(j.get("close_profit_abs"), trade.calc_profit(close_rate)) if closed else None
    ratio = first(j.get("close_profit"), trade.calc_profit_ratio(close_rate)) if closed else None
    values = [
        j["trade_id"], j["pair"], j["is_open"], j["open_date"], amount, open_rate, buy_value,
        buy_fee, j.get("close_date"), close_rate, sell_value, sell_fee, profit,
        None if ratio is None else round(ratio * 100, 3), j.get("quote_currency"), j.get("exit_reason"),
    ]
    return ["" if v is None else (round(v, 8) if isinstance(v, float) else v) for v in values]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--db-url", required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    from freqtrade.persistence import Trade, init_db

    init_db(args.db_url)
    trades = sorted(Trade.get_trades_proxy(), key=lambda t: t.open_date_utc)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(HEADER)
        for trade in trades:
            writer.writerow(row(trade))
    print(f"Saved {len(trades)} trades to {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
