"""
Self-improvement loop for SelfLearningStrategy, run like a science experiment.

    1. CHANGE 1 VARIABLE  pick exactly one setting and move it one step
    2. TEST               walk-forward backtest (the model retrains every week
                          and never sees the future)
    3. MEASURE            score it against the goal and against the baseline
    4. NEW BASELINE       keep it only if it wins on the search window AND on
                          newer data it was not chosen on; otherwise discard it

Every new baseline becomes the starting point for the next experiment, and the
loop never stops: when every one-step change has been tried, it waits for a new
week of market data and starts again. Each experiment, kept or not, is written
to user_data/experiments/journal.jsonl.

In paper-trading mode a new baseline goes live straight away (the running bot
reloads its settings). In real-money mode it waits for `./bot.sh approve`.

Commands:
    python scripts/improver.py loop      # run experiments forever (what Docker runs)
    python scripts/improver.py once      # run a single experiment
    python scripts/improver.py report    # show the journal and the current baseline
    python scripts/improver.py approve   # real-money mode: apply the pending baseline
"""

from __future__ import annotations

import argparse
import copy
import fcntl
import json
import os
import shutil
import subprocess
import sys
import time
import zipfile
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any

SCRIPTS = Path(__file__).resolve().parent
USER_DATA = SCRIPTS.parent / "user_data"
EXP_DIR = USER_DATA / "experiments"
STATE_FILE = EXP_DIR / "state.json"
JOURNAL_FILE = EXP_DIR / "journal.jsonl"
PENDING_FILE = EXP_DIR / "pending_baseline.json"
LOCK_FILE = EXP_DIR / ".lock"
# Which bot config / improver settings to use: the trend bot by default, or set
# BOT_CONFIG=config.ml.json IMPROVER_SETTINGS=improver.ml.json for the ML bot.
BASE_CONFIG = USER_DATA / os.environ.get("BOT_CONFIG", "config.json")
BASELINE_FILE = USER_DATA / "config.baseline.json"
PRIVATE_CONFIG = USER_DATA / "config.private.json"
SETTINGS_FILE = USER_DATA / os.environ.get("IMPROVER_SETTINGS", "improver.json")


# --------------------------------------------------------------------------- helpers
def log(msg: str) -> None:
    print(f"{datetime.now(UTC):%Y-%m-%d %H:%M:%S} improver: {msg}", flush=True)


def now_iso() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return copy.deepcopy(default)
    return json.loads(path.read_text())


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=2) + "\n")
    tmp.replace(path)


def deep_merge(base: dict, override: dict) -> dict:
    out = copy.deepcopy(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = copy.deepcopy(value)
    return out


def get_path(data: dict, dotted: str) -> Any:
    for part in dotted.split("."):
        if not isinstance(data, dict) or part not in data:
            return None
        data = data[part]
    return data


def nested(dotted: str, value: Any) -> dict:
    """'a.b.c', 1 -> {'a': {'b': {'c': 1}}}"""
    out: dict = {}
    cur = out
    parts = dotted.split(".")
    for part in parts[:-1]:
        cur = cur.setdefault(part, {})
    cur[parts[-1]] = value
    return out


def flatten(data: dict, prefix: str = "") -> dict[str, Any]:
    out = {}
    for key, value in data.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            out.update(flatten(value, path))
        else:
            out[path] = value
    return out


def fmt(value: Any) -> str:
    return json.dumps(value)


def load_settings() -> dict:
    settings = load_json(SETTINGS_FILE)
    settings["variables"] = {k: v for k, v in settings["variables"].items() if not k.startswith("_")}
    return settings


def uses_freqai(cfg: dict) -> bool:
    return bool(cfg.get("freqai", {}).get("enabled"))


def score(metrics: dict, goal: dict) -> float:
    return round(metrics["profit_pct"] - goal["drawdown_weight"] * metrics["drawdown_pct"], 2)


# --------------------------------------------------------------------------- state
def load_state() -> dict:
    state = load_json(STATE_FILE)
    if state is None:
        start_overlay = load_json(BASELINE_FILE, {}) or {}
        state = {
            "baselines": [
                {"id": "B0", "created": now_iso(), "overlay": start_overlay, "reason": "starting settings"}
            ],
            "baseline_metrics": {},
            "tried": {},
            "next_variable": 0,
            "experiments": 0,
            "data_week": None,
        }
        save_json(STATE_FILE, state)
    return state


def ensure_baseline_file() -> None:
    if not BASELINE_FILE.exists():
        save_json(BASELINE_FILE, {})


@contextmanager
def experiment_lock(wait: bool) -> Iterator[None]:
    EXP_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOCK_FILE, "w") as fh:
        try:
            fcntl.flock(fh, fcntl.LOCK_EX | (0 if wait else fcntl.LOCK_NB))
        except BlockingIOError:
            raise SystemExit("Another experiment is already running; try again in a few minutes.")
        yield


# --------------------------------------------------------------------------- windows & data
def current_windows(settings: dict) -> dict:
    """Windows end on this week's Monday, so they stay fixed for a whole week."""
    today = datetime.now(UTC).date()
    end = today - timedelta(days=today.weekday())
    confirm_start = end - timedelta(days=settings["windows"]["confirm_days"])
    search_start = confirm_start - timedelta(days=settings["windows"]["search_days"])
    d = lambda x: x.strftime("%Y%m%d")  # noqa: E731
    return {
        "week": d(end),
        "search": f"{d(search_start)}-{d(confirm_start)}",
        "confirm": f"{d(confirm_start)}-{d(end)}",
    }


def refresh_data(settings: dict, base_cfg: dict, windows: dict, state: dict) -> None:
    if state.get("data_week") == windows["week"]:
        return
    sys.path.insert(0, str(SCRIPTS))
    from download_history import config_pairs_and_timeframes, download_all

    search_start = datetime.strptime(windows["search"].split("-")[0], "%Y%m%d").date()
    # Extra history before the search window: model training and indicator warm-up.
    days = (date.today() - search_start).days + settings.get("extra_history_days", 150)
    log(f"New week ({windows['week']}): refreshing {days} days of price history...")
    pairs, timeframes = config_pairs_and_timeframes(BASE_CONFIG)
    download_all(pairs, timeframes, days, USER_DATA / "data" / base_cfg["exchange"]["name"])
    state["data_week"] = windows["week"]
    save_json(STATE_FILE, state)


# --------------------------------------------------------------------------- backtests
def run_backtest(overlay: dict, timerange: str, tag: str, fee: float, extra_configs: list[Path]) -> dict:
    run_dir = EXP_DIR / "runs" / tag
    shutil.rmtree(run_dir, ignore_errors=True)
    run_dir.mkdir(parents=True)
    identifier = f"improver-{tag}"
    overlay_path = run_dir / "overlay.json"
    if uses_freqai(load_json(BASE_CONFIG)):
        # Each experiment trains its own models, deleted afterwards.
        overlay = deep_merge(overlay, {"freqai": {"identifier": identifier}})
    save_json(overlay_path, overlay)

    cmd = [sys.executable, "-m", "freqtrade", "backtesting", "--userdir", str(USER_DATA)]
    for cfg in [BASE_CONFIG, *extra_configs, overlay_path]:
        cmd += ["--config", str(cfg)]
    cmd += [
        "--timerange", timerange,
        "--fee", str(fee),
        "--cache", "none",
        "--export", "trades",
        "--backtest-directory", str(run_dir),
    ]
    log_path = run_dir / "backtest.log"
    ok = False
    try:
        with open(log_path, "w") as fh:
            proc = subprocess.run(cmd, stdout=fh, stderr=subprocess.STDOUT, cwd=USER_DATA.parent)
        if proc.returncode != 0:
            tail = log_path.read_text().strip().splitlines()[-3:]
            raise RuntimeError(f"backtest failed (exit {proc.returncode}): {' | '.join(tail)}")
        result = parse_result(run_dir)
        ok = True
        return result
    finally:
        shutil.rmtree(USER_DATA / "models" / identifier, ignore_errors=True)
        if ok:
            shutil.rmtree(run_dir, ignore_errors=True)


def parse_result(run_dir: Path) -> dict:
    zips = sorted(run_dir.glob("backtest-result-*.zip"))
    if not zips:
        raise RuntimeError("backtest wrote no results")
    with zipfile.ZipFile(zips[-1]) as zf:
        name = next(n for n in zf.namelist() if n.endswith(".json") and "_config" not in n)
        data = json.loads(zf.read(name))
    s = next(iter(data["strategy"].values()))  # one strategy per backtest
    return {
        "profit_pct": round(s["profit_total"] * 100, 2),
        "drawdown_pct": round(s["max_drawdown_account"] * 100, 2),
        "trades": s["total_trades"],
        "win_rate_pct": round((s.get("winrate") or 0) * 100, 1),
        "market_pct": round(s["market_change"] * 100, 2),
    }


def baseline_metrics(state, baseline, window, windows, settings, extra) -> dict:
    key = f"{baseline['id']}|{windows[window]}"
    if key not in state["baseline_metrics"]:
        log(f"Measuring baseline {baseline['id']} on the {window} window ({windows[window]})...")
        state["baseline_metrics"][key] = run_backtest(
            baseline["overlay"], windows[window], f"{baseline['id']}-{window}-{windows['week']}",
            settings["fee"], extra,
        )
        save_json(STATE_FILE, state)
    return state["baseline_metrics"][key]


# --------------------------------------------------------------------------- one experiment
def neighbours(current: Any, options: list) -> list:
    if current in options:
        i = options.index(current)
        return [options[j] for j in (i - 1, i + 1) if 0 <= j < len(options)]
    return [o for o in options if o != current]


def pick_candidate(state: dict, settings: dict, baseline_full: dict, tried: set) -> tuple | None:
    names = list(settings["variables"])
    for step in range(len(names)):
        idx = (state["next_variable"] + step) % len(names)
        name = names[idx]
        current = get_path(baseline_full, name)
        for value in neighbours(current, settings["variables"][name]):
            key = f"{name}={fmt(value)}"
            if key not in tried:
                state["next_variable"] = (idx + 1) % len(names)
                return name, current, value, key
    return None


def judge(cand: dict, base: dict, goal: dict, window: str) -> tuple[str | None, str]:
    c, b = score(cand, goal), score(base, goal)
    min_trades = goal[f"min_trades_{window}"]
    if cand["trades"] < min_trades:
        return "discarded", f"only {cand['trades']} trades on the {window} window (need {min_trades})"
    if window == "search" and c < b + goal["min_improvement"]:
        return "discarded", f"not better enough: score {b} -> {c} (needs +{goal['min_improvement']})"
    if window == "confirm" and c <= b + goal.get("min_improvement_confirm", 0.0):
        return "discarded", f"won on older data but not on the newest months: score {b} -> {c}"
    return None, f"{window} score {b} -> {c}"


def run_experiment(extra: list[Path]) -> str:
    settings = load_settings()
    goal = settings["goal"]
    base_cfg = load_json(BASE_CONFIG)
    state = load_state()
    baseline = state["baselines"][-1]
    windows = current_windows(settings)
    refresh_data(settings, base_cfg, windows, state)

    tried_key = f"{baseline['id']}|{windows['week']}"
    tried = set(state["tried"].get(tried_key, []))
    pick = pick_candidate(state, settings, deep_merge(base_cfg, baseline["overlay"]), tried)
    if pick is None:
        log(f"Every one-step change to baseline {baseline['id']} has been tried this week. "
            "Waiting for new market data.")
        return "nothing_left"

    name, current, value, key = pick
    state["experiments"] += 1
    exp_id = f"E{state['experiments']}"
    save_json(STATE_FILE, state)
    log(f"{exp_id}: baseline {baseline['id']}, changing ONE variable: {name} {fmt(current)} -> {fmt(value)}")

    candidate_overlay = deep_merge(baseline["overlay"], nested(name, value))
    entry: dict[str, Any] = {
        "id": exp_id, "time": now_iso(), "baseline": baseline["id"],
        "variable": name, "from": current, "to": value,
        "windows": {"search": windows["search"], "confirm": windows["confirm"]},
    }
    started = time.time()
    try:
        base_s = baseline_metrics(state, baseline, "search", windows, settings, extra)
        cand_s = run_backtest(candidate_overlay, windows["search"], f"{exp_id}-search", settings["fee"], extra)
        entry["search"] = {"baseline": base_s | {"score": score(base_s, goal)},
                           "candidate": cand_s | {"score": score(cand_s, goal)}}
        decision, reason = judge(cand_s, base_s, goal, "search")
        if decision is None:
            log(f"{exp_id}: passed the search window ({reason}); re-checking on newer data...")
            base_c = baseline_metrics(state, baseline, "confirm", windows, settings, extra)
            cand_c = run_backtest(candidate_overlay, windows["confirm"], f"{exp_id}-confirm", settings["fee"], extra)
            entry["confirm"] = {"baseline": base_c | {"score": score(base_c, goal)},
                                "candidate": cand_c | {"score": score(cand_c, goal)}}
            decision, confirm_reason = judge(cand_c, base_c, goal, "confirm")
            if decision is None:
                decision, reason = "kept", f"better on both: {reason}; {confirm_reason}"
            else:
                reason = confirm_reason
    except Exception as exc:  # a broken setting must not stop the loop
        decision, reason = "error", str(exc)[:500]

    entry.update(decision=decision, reason=reason, minutes=round((time.time() - started) / 60, 1))
    state = load_state()  # baseline metrics may have been added meanwhile
    state["tried"].setdefault(tried_key, []).append(key)
    if decision == "kept":
        new_id = f"B{len(state['baselines'])}"
        state["baselines"].append({
            "id": new_id, "created": now_iso(), "overlay": candidate_overlay,
            "reason": f"{exp_id}: {name} {fmt(current)} -> {fmt(value)}",
        })
        state["baseline_metrics"][f"{new_id}|{windows['search']}"] = cand_s
        state["baseline_metrics"][f"{new_id}|{windows['confirm']}"] = cand_c
        entry["new_baseline"] = new_id
    state["next_variable"] = (list(settings["variables"]).index(name) + 1) % len(settings["variables"])
    state["experiments"] = max(state["experiments"], int(exp_id[1:]))
    save_json(STATE_FILE, state)
    with open(JOURNAL_FILE, "a") as fh:
        fh.write(json.dumps(entry) + "\n")

    log(f"{exp_id}: {decision.upper()} ({reason}) [{entry['minutes']} min]")
    if decision == "kept":
        apply_baseline(candidate_overlay, entry["new_baseline"])
    return "done"


# --------------------------------------------------------------------------- going live
def live_is_dry_run() -> bool:
    live = deep_merge(load_json(BASE_CONFIG), load_json(PRIVATE_CONFIG, {}) or {})
    return bool(live.get("dry_run", True))


def live_overlay(overlay: dict, baseline_id: str) -> dict:
    # A fresh model folder per baseline, so the live bot never loads a model
    # that was trained with different settings or inputs.
    if not uses_freqai(load_json(BASE_CONFIG)):
        return overlay
    return deep_merge(overlay, {"freqai": {"identifier": f"self-learning-{baseline_id}"}})


def apply_baseline(overlay: dict, baseline_id: str) -> None:
    if live_is_dry_run():
        save_json(BASELINE_FILE, live_overlay(overlay, baseline_id))
        log(f"New baseline {baseline_id} saved to {BASELINE_FILE.name} (paper trading: applied automatically).")
        reload_bot()
    else:
        save_json(PENDING_FILE, {"id": baseline_id, "overlay": overlay, "created": now_iso()})
        log(f"REAL-MONEY MODE: new baseline {baseline_id} is waiting for approval (./bot.sh approve).")


def reload_bot() -> None:
    api = (load_json(PRIVATE_CONFIG, {}) or {}).get("api_server", {})
    if not api.get("enabled"):
        log("Dashboard API is off; the bot will use the new baseline next time it starts.")
        return
    url = os.environ.get("BOT_API_URL", f"http://127.0.0.1:{api.get('listen_port', 8080)}")
    try:
        import requests

        resp = requests.post(f"{url}/api/v1/reload_config", auth=(api["username"], api["password"]), timeout=15)
        resp.raise_for_status()
        log("Live bot reloaded its settings with the new baseline.")
    except Exception as exc:
        log(f"Could not reach the live bot ({exc}); it will use the new baseline next time it starts.")


def approve() -> None:
    pending = load_json(PENDING_FILE)
    if not pending:
        print("Nothing is waiting for approval.")
        return
    save_json(BASELINE_FILE, live_overlay(pending["overlay"], pending["id"]))
    PENDING_FILE.unlink()
    print(f"Approved baseline {pending['id']}.")
    reload_bot()


# --------------------------------------------------------------------------- report
def report(limit: int) -> None:
    state = load_state()
    base_cfg = load_json(BASE_CONFIG)
    entries = [json.loads(line) for line in JOURNAL_FILE.read_text().splitlines()] if JOURNAL_FILE.exists() else []
    baseline = state["baselines"][-1]

    print(f"\nCurrent baseline: {baseline['id']} (since {baseline['created'][:10]}) - {baseline['reason']}")
    changes = {k: v for k, v in flatten(baseline["overlay"]).items() if k != "freqai.identifier"}
    if not changes:
        print("  Same as config.json: no change has passed the test yet.")
    for path, value in changes.items():
        print(f"  {path}: {fmt(get_path(base_cfg, path))} -> {fmt(value)}")
    kept = sum(e["decision"] == "kept" for e in entries)
    print(f"\nExperiments: {len(entries)} run, {kept} kept, {len(entries) - kept} discarded or failed.")
    if PENDING_FILE.exists():
        print("A new baseline is WAITING FOR APPROVAL (real-money mode): ./bot.sh approve")
    if not entries:
        return

    print(f"\nLast {min(limit, len(entries))} experiments (score = profit % - "
          f"{load_settings()['goal']['drawdown_weight']} x worst drop %):\n")
    header = f"{'ID':<5} {'Date':<10} {'Base':<4} {'Change':<52} {'Search score':<18} {'Confirm score':<18} Result"
    print(header)
    print("-" * len(header))
    for e in entries[-limit:]:
        change = f"{e['variable']} {fmt(e['from'])} -> {fmt(e['to'])}"
        cols = []
        for w in ("search", "confirm"):
            if w in e:
                cols.append(f"{e[w]['baseline']['score']} -> {e[w]['candidate']['score']}")
            else:
                cols.append("-")
        result = e["decision"].upper() + (f" (now {e['new_baseline']})" if e.get("new_baseline") else "")
        print(f"{e['id']:<5} {e['time'][:10]:<10} {e['baseline']:<4} {change[:52]:<52} {cols[0]:<18} {cols[1]:<18} {result}")
    last = entries[-1]
    print(f"\nLatest: {last['id']} {last['decision']} - {last['reason']}")


# --------------------------------------------------------------------------- main
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=["loop", "once", "report", "approve"], nargs="?", default="report")
    parser.add_argument("--extra-config", action="append", default=[], type=Path,
                        help="Extra freqtrade config merged into every backtest (e.g. proxy settings)")
    parser.add_argument("--limit", type=int, default=25, help="report: how many experiments to show")
    args = parser.parse_args()

    ensure_baseline_file()
    if args.command == "report":
        report(args.limit)
    elif args.command == "approve":
        approve()
    elif args.command == "once":
        with experiment_lock(wait=False):
            run_experiment(args.extra_config)
    else:
        log("Self-improvement loop started: one variable at a time, keep only what is better.")
        while True:
            try:
                with experiment_lock(wait=True):
                    result = run_experiment(args.extra_config)
            except Exception as exc:
                log(f"Experiment crashed: {exc}")
                result = "done"
            settings = load_settings()
            if result == "nothing_left":
                time.sleep(settings["pause_hours_when_nothing_left_to_try"] * 3600)
            else:
                time.sleep(settings["pause_minutes_between_experiments"] * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
