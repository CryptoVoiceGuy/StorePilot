"""
TrendStrategy
=============

The one strategy family that passed the pre-registered research test
(research/RESULTS.md): hold each coin only while it is in an uptrend.

Rule, checked once a day at the daily close (00:00 UTC, 11am in Sydney):
    - coin closes ABOVE its N-day average price  -> own it
    - coin closes BELOW its N-day average price  -> sell it, sit in cash

Each of the 10 coins gets an equal slice of the wallet. In long downtrends
most slices sit in cash, which is how it avoided much of the 2022 and 2025-26
crashes. The price is giving up part of the big rallies.

Knobs (config "trend" section; the improver tunes them one at a time):
    sma_period   N, the averaging window in days (research walk-forward pick: 50)
    exit_buffer  sell only when the close is this far below the average
                 (0.02 = 2%), to avoid buying and selling on tiny wiggles
    btc_filter   if true, only hold other coins while BTC itself is above its average

It is not a money machine: from Jan 2025 to Nov 2026 it lost about 30%
(holding BTC lost 37%). See README "Honest results".
"""

from __future__ import annotations

from pandas import DataFrame

from freqtrade.strategy import IStrategy, informative


class TrendStrategy(IStrategy):
    INTERFACE_VERSION = 3

    timeframe = "1d"
    can_short = False
    process_only_new_candles = True
    use_exit_signal = True
    exit_profit_only = False
    ignore_roi_if_entry_signal = True
    startup_candle_count: int = 210

    # Exits come from the trend rule, not from profit targets.
    minimal_roi = {"0": 100.0}
    # Wide emergency stop only (the research had none; adding it did not hurt the
    # 2019-2026 backtest). config.json places it on Kraken itself, so it still
    # protects you if your computer is off.
    stoploss = -0.25
    trailing_stop = False

    DEFAULT_KNOBS = {"sma_period": 50, "exit_buffer": 0.0, "btc_filter": False}

    @property
    def knobs(self) -> dict:
        return {**self.DEFAULT_KNOBS, **self.config.get("trend", {})}

    plot_config = {"main_plot": {"sma": {"color": "orange"}}}

    @informative("1d", "BTC/{stake}", fmt="btc_{column}")
    def populate_indicators_btc(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        period = int(self.knobs["sma_period"])
        dataframe["uptrend"] = (dataframe["close"] > dataframe["close"].rolling(period).mean()).astype(int)
        return dataframe

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        period = int(self.knobs["sma_period"])
        dataframe["sma"] = dataframe["close"].rolling(period).mean()
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        knobs = self.knobs
        cond = (dataframe["close"] > dataframe["sma"]) & (dataframe["volume"] > 0)
        if knobs["btc_filter"] and not metadata["pair"].startswith("BTC/"):
            cond &= dataframe["btc_uptrend"] == 1
        dataframe.loc[cond, ["enter_long", "enter_tag"]] = (1, "uptrend")
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        knobs = self.knobs
        cond = dataframe["close"] < dataframe["sma"] * (1 - float(knobs["exit_buffer"]))
        if knobs["btc_filter"] and not metadata["pair"].startswith("BTC/"):
            cond |= dataframe["btc_uptrend"] == 0
        dataframe.loc[cond, ["exit_long", "exit_tag"]] = (1, "downtrend")
        return dataframe
