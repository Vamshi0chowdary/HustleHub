from __future__ import annotations

import argparse
import ast
import json
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent
REPORTS_DIR = BASE_DIR / "reports"
SYNTHETIC_REPORT_PATH = REPORTS_DIR / "synthetic_dataset_report.json"
VALIDATION_REPORT_PATH = REPORTS_DIR / "database_validation_report.json"


class PipelineError(RuntimeError):
    """Raised when a critical pipeline step fails."""


@dataclass
class StepResult:
    name: str
    returncode: int
    stdout: str
    stderr: str
    duration_seconds: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run HustleHub data + ML pipeline in one command.")
    parser.add_argument("--reset-db", action="store_true", help="Clear app collections before generating synthetic data.")
    parser.add_argument("--users", type=int, default=240, help="Number of synthetic users (100-500).")
    parser.add_argument("--videos", type=int, default=1200, help="Number of synthetic videos (500-2000).")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for synthetic data generation.")
    return parser.parse_args()


def _print_banner(title: str) -> None:
    print("\n" + "=" * 72)
    print(f" {title}")
    print("=" * 72)


def _run_step(name: str, command: list[str]) -> StepResult:
    _print_banner(f"STEP: {name}")
    print(f"Command: {' '.join(command)}")
    start = time.perf_counter()

    completed = subprocess.run(
        command,
        cwd=BASE_DIR,
        capture_output=True,
        text=True,
        check=False,
    )
    duration = time.perf_counter() - start

    if completed.stdout.strip():
        print("\n--- stdout ---")
        print(completed.stdout.strip())
    if completed.stderr.strip():
        print("\n--- stderr ---")
        print(completed.stderr.strip())

    print(f"\nStep duration: {duration:.2f}s")
    print(f"Step status: {'OK' if completed.returncode == 0 else 'FAILED'}")

    return StepResult(
        name=name,
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
        duration_seconds=duration,
    )


def _require_success(result: StepResult) -> None:
    if result.returncode == 0:
        return
    details = result.stderr.strip() or result.stdout.strip() or "No error details were emitted."
    raise PipelineError(f"{result.name} failed with exit code {result.returncode}: {details}")


def _load_json_report(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise PipelineError(f"Expected report was not found: {path}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise PipelineError(f"Failed to parse JSON report at {path}: {exc}") from exc


def _extract_train_metadata(train_stdout: str) -> dict[str, Any]:
    candidate: dict[str, Any] | None = None
    for line in train_stdout.splitlines():
        text = line.strip()
        if not text.startswith("{") or "metrics" not in text:
            continue
        try:
            parsed = ast.literal_eval(text)
        except (ValueError, SyntaxError):
            continue
        if isinstance(parsed, dict):
            candidate = parsed
    if candidate is None:
        raise PipelineError("Could not parse training metadata from training output.")
    return candidate


def _safe_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _print_summary(synthetic_report: dict[str, Any], train_metadata: dict[str, Any], success: bool) -> None:
    metrics = train_metadata.get("metrics", {}) if isinstance(train_metadata, dict) else {}
    users = int(synthetic_report.get("users", train_metadata.get("users", 0)))
    videos = int(synthetic_report.get("videos", train_metadata.get("videos", 0)))
    likes = int(synthetic_report.get("likes", train_metadata.get("likes", 0)))
    feedback = int(synthetic_report.get("feedback_events", train_metadata.get("feedback_events", 0)))

    precision = _safe_float(metrics.get("precision_at_10", 0.0))
    recall = _safe_float(metrics.get("recall_at_10", 0.0))
    engagement = _safe_float(metrics.get("engagement_accuracy", 0.0))

    print("\n=== PIPELINE SUMMARY ===")
    print(f"Users: {users}")
    print(f"Videos: {videos}")
    print(f"Likes: {likes}")
    print(f"Feedback: {feedback}")
    print("")
    print(f"Precision@10: {precision:.4f}")
    print(f"Recall@10: {recall:.4f}")
    print(f"Engagement Accuracy: {engagement:.4f}")
    print("")
    print(f"Status: {'SUCCESS' if success else 'FAILED'}")


def main() -> int:
    args = parse_args()
    python_exe = sys.executable

    print("HustleHub Production Pipeline")
    print(f"Python: {python_exe}")
    print(f"Base dir: {BASE_DIR}")
    print(f"Reset DB: {args.reset_db}")
    print("Mode: safe by default (no destructive reset unless --reset-db is passed)")

    synthetic_report: dict[str, Any] = {}
    train_metadata: dict[str, Any] = {}

    try:
        generate_cmd = [
            python_exe,
            "scripts/generate_synthetic_dataset.py",
            "--users",
            str(args.users),
            "--videos",
            str(args.videos),
            "--seed",
            str(args.seed),
        ]
        if args.reset_db:
            generate_cmd.append("--reset")

        step_generate = _run_step("Generate synthetic dataset", generate_cmd)
        _require_success(step_generate)
        synthetic_report = _load_json_report(SYNTHETIC_REPORT_PATH)

        step_validate = _run_step("Validate database integrity", [python_exe, "scripts/validate_database.py"])
        _require_success(step_validate)
        validation_report = _load_json_report(VALIDATION_REPORT_PATH)
        validation_ok = bool(validation_report.get("summary", {}).get("ok", False))
        if not validation_ok:
            raise PipelineError("Database validation report indicates failure.")

        step_train = _run_step("Train + evaluate recommender", [python_exe, "train.py"])
        _require_success(step_train)
        train_metadata = _extract_train_metadata(step_train.stdout)

        _print_summary(synthetic_report, train_metadata, success=True)
        return 0
    except Exception as exc:
        print("\nCRITICAL ERROR:")
        print(str(exc))
        _print_summary(synthetic_report, train_metadata, success=False)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())