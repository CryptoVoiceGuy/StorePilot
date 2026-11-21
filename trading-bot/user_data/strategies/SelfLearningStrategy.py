"""
SelfLearningStrategy
====================

A long-only crypto strategy whose buy/sell decisions come from a machine
learning model that keeps re-training itself on the newest market data.

How it "learns"
---------------
1. Re-training (FreqAI): every few hours (``live_retrain_hours`` in
   config.json) the bot throws its model away and trains a fresh one on the
   last ``train_period_days`` of prices, weighting recent days more heavily.
   When the market changes character, the model follows it.
2. Self-calibrating bar: the bot tracks the spread of its own recent
   predictions and only buys when the current prediction stands out from
   that recent normal, never below a fixed minimum that covers fees.
3. Losing-streak brake: before every buy it looks at its own last few closed
   trades. If they lost money overall, it raises the bar and becomes pickier
   until results recover.

What the model predicts
-----------------------
For each coin, every hour: "over the next 12 hours, how far above or below
today's price will the average price be?" A prediction of +0.015 means the
model expects prices about 1.5% higher on average.

What it does NOT do
-------------------
It does not short, use leverage, or borrow. It never risks more than the
wallet holds. None of this guarantees a profit; it is an experiment, so run
it in dry-run (paper) mode first.
"""

from __future__ import annotations

import logging
from datetime import datetime
from functools import reduce

import numpy as np
import talib.abstract as ta
from pandas import DataFrame
from technical import qtpylib

from freqtrade.persistence import Trade
from freqtrade.strategy import IStrategy


logger = logging.getLogger(__name__)


class SelfLearningStrategy(IStrategy):
    INTERFACE_VERSION = 3

    timeframe = "1h"
    can_short = False
    process_only_new_candles = True
    use_exit_signal = True
    startup_candle_count: int = 60

    # Take-profit ladder (minutes held -> minimum profit to sell).
    # After 24h the position is closed whatever happens, so money is never stuck.
    minimal_roi = {"0": 0.06, "240": 0.03, "720": 0.01, "1440": -1}

    # Hard safety net: never lose more than 5% on a single trade.
    stoploss = -0.05
    # Once a trade is up 2.5%, lock in profit with a 1% trailing stop.
    trailing_stop = True
    trailing_stop_positive = 0.01
    trailing_stop_positive_offset = 0.025
    trailing_only_offset_is_reached = True

    # --- Tunable knobs -----------------------------------------------------------
    # Defaults below; the "selflearning" section of config.json overrides them,
    # and the self-improvement loop (scripts/improver.py) tunes them one at a time.
    DEFAULT_KNOBS = {
        # Minimum predicted move before buying. Kraken charges up to 0.4% per side,
        # so a round trip costs ~0.8%; this must stay comfortably above that.
        "min_edge": 0.012,
        # How unusual (in standard deviations of recent predictions) a signal must be.
        "signal_strength": 1.0,
        # Losing-streak brake: look back this many closed trades...
        "streak_lookback": 6,
        # ...and if they lost money overall, multiply the bar by this.
        "streak_penalty": 1.5,
    }

    @property
    def knobs(self) -> dict:
        return {**self.DEFAULT_KNOBS, **self.config.get("selflearning", {})}

    plot_config = {
        "main_plot": {},
        "subplots": {
            "Prediction": {
                "&-s_close": {"color": "blue"},
                "entry_bar": {"color": "orange"},
            },
            "Model OK": {"do_predict": {"color": "brown"}},
        },
    }

    @property
    def protections(self):
        return [
            # Wait 2 candles after selling a coin before buying it again.
            {"method": "CooldownPeriod", "stop_duration_candles": 2},
            # Two stop-losses within a day -> stop all buying for 12 hours.
            {
                "method": "StoplossGuard",
                "lookback_period_candles": 24,
                "trade_limit": 2,
                "stop_duration_candles": 12,
                "only_per_pair": False,
            },
            # Down more than 15% over the last week -> stop buying for 2 days.
            {
                "method": "MaxDrawdown",
                "lookback_period_candles": 168,
                "trade_limit": 3,
                "stop_duration_candles": 48,
                "max_allowed_drawdown": 0.15,
            },
            # A coin that keeps losing gets benched for 2 days.
            {
                "method": "LowProfitPairs",
                "lookback_period_candles": 336,
                "trade_limit": 4,
                "stop_duration_candles": 48,
                "required_profit": 0.0,
            },
        ]

    # ------------------------------------------------------------------------
    # Features: what the model gets to look at.
    # Everything is a ratio or oscillator (no raw prices or raw volume), so
    # the model works the same whether BTC is at $30k or $130k, and history
    # seeded from Binance blends cleanly with live Kraken data.
    # ------------------------------------------------------------------------
    def feature_engineering_expand_all(
        self, dataframe: DataFrame, period: int, metadata: dict, **kwargs
    ) -> DataFrame:
        close = dataframe["close"]
        dataframe["%-rsi-period"] = ta.RSI(dataframe, timeperiod=period)
        dataframe["%-adx-period"] = ta.ADX(dataframe, timeperiod=period)
        dataframe["%-roc-period"] = ta.ROC(dataframe, timeperiod=period)
        dataframe["%-dist_sma-period"] = close / ta.SMA(dataframe, timeperiod=period) - 1
        dataframe["%-atr_pct-period"] = ta.ATR(dataframe, timeperiod=period) / close
        dataframe["%-volatility-period"] = close.pct_change().rolling(period).std()

        bb = qtpylib.bollinger_bands(qtpylib.typical_price(dataframe), window=period, stds=2)
        width = bb["upper"] - bb["lower"]
        dataframe["%-bb_width-period"] = width / bb["mid"]
        dataframe["%-bb_pos-period"] = (close - bb["lower"]) / width.replace(0, np.nan)
        return dataframe

    def feature_engineering_expand_basic(
        self, dataframe: DataFrame, metadata: dict, **kwargs
    ) -> DataFrame:
        close = dataframe["close"]
        dataframe["%-ret_1"] = close.pct_change()
        dataframe["%-ret_4"] = close.pct_change(4)
        dataframe["%-candle_body"] = (close - dataframe["open"]) / dataframe["open"]
        dataframe["%-candle_range"] = (dataframe["high"] - dataframe["low"]) / close
        return dataframe

    def feature_engineering_standard(
        self, dataframe: DataFrame, metadata: dict, **kwargs
    ) -> DataFrame:
        hour = dataframe["date"].dt.hour
        dow = dataframe["date"].dt.dayofweek
        dataframe["%-hour_sin"] = np.sin(2 * np.pi * hour / 24)
        dataframe["%-hour_cos"] = np.cos(2 * np.pi * hour / 24)
        dataframe["%-dow_sin"] = np.sin(2 * np.pi * dow / 7)
        dataframe["%-dow_cos"] = np.cos(2 * np.pi * dow / 7)
        return dataframe

    # ------------------------------------------------------------------------
    # Target: what the model is trying to predict.
    # ------------------------------------------------------------------------
    def set_freqai_targets(self, dataframe: DataFrame, metadata: dict, **kwargs) -> DataFrame:
        horizon = self.freqai_info["feature_parameters"]["label_period_candles"]
        # Average close over the next `horizon` candles, relative to now.
        dataframe["&-s_close"] = (
            dataframe["close"].shift(-horizon).rolling(horizon).mean() / dataframe["close"] - 1
        )
        return dataframe

    # ------------------------------------------------------------------------
    # Trading logic
    # ------------------------------------------------------------------------
    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe = self.freqai.start(dataframe, metadata, self)

        # Self-calibrating bar: mean + k * std of the model's recent predictions,
        # never lower than the fee-covering minimum.
        knobs = self.knobs
        if "&-s_close_mean" in dataframe and "&-s_close_std" in dataframe:
            adaptive = dataframe["&-s_close_mean"] + knobs["signal_strength"] * dataframe["&-s_close_std"]
        else:
            adaptive = 0.0
        dataframe["entry_bar"] = np.maximum(adaptive, knobs["min_edge"])
        return dataframe

    def populate_entry_trend(self, df: DataFrame, metadata: dict) -> DataFrame:
        conditions = [
            df["do_predict"] == 1,
            df["&-s_close"] > df["entry_bar"],
            df["volume"] > 0,
        ]
        df.loc[reduce(lambda a, b: a & b, conditions), ["enter_long", "enter_tag"]] = (1, "ml_up")
        return df

    def populate_exit_trend(self, df: DataFrame, metadata: dict) -> DataFrame:
        # Sell when the model no longer expects prices to rise.
        conditions = [df["do_predict"] == 1, df["&-s_close"] < 0]
        df.loc[reduce(lambda a, b: a & b, conditions), ["exit_long", "exit_tag"]] = (1, "ml_down")
        return df

    def confirm_trade_entry(
        self,
        pair: str,
        order_type: str,
        amount: float,
        rate: float,
        time_in_force: str,
        current_time: datetime,
        entry_tag: str | None,
        side: str,
        **kwargs,
    ) -> bool:
        """Losing-streak brake: learn from our own recent results."""
        knobs = self.knobs
        recent = self._recent_closed_trades(current_time, int(knobs["streak_lookback"]))
        if len(recent) < knobs["streak_lookback"]:
            return True
        streak_profit = sum(t.close_profit or 0.0 for t in recent)
        if streak_profit >= 0:
            return True

        dataframe, _ = self.dp.get_analyzed_dataframe(pair, self.timeframe)
        if dataframe.empty:
            return False
        last = dataframe.iloc[-1]
        stricter_bar = last["entry_bar"] * knobs["streak_penalty"]
        if last["&-s_close"] > stricter_bar:
            return True
        logger.info(
            "Skipping %s: last %d trades lost %.2f%% combined, so the bar is raised to %.2f%% "
            "(model predicts %.2f%%).",
            pair,
            len(recent),
            streak_profit * 100,
            stricter_bar * 100,
            last["&-s_close"] * 100,
        )
        return False

    @staticmethod
    def _recent_closed_trades(current_time: datetime, count: int) -> list:
        trades = [
            t
            for t in Trade.get_trades_proxy(is_open=False)
            if t.close_date_utc is not None and t.close_date_utc <= current_time
        ]
        trades.sort(key=lambda t: t.close_date_utc)
        return trades[-count:]
