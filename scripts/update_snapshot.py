#!/usr/bin/env python3
"""
Mini-SBOM
- Python standard library only (PSF License)
- argparse, copy, datetime, json, pathlib, typing, zoneinfo
- GPL 계열 외부 라이브러리 사용 없음
"""

from __future__ import annotations

import argparse
import copy
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None  # type: ignore[assignment]


REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = REPO_ROOT / "scripts" / "sample_input.json"
LATEST_JSON = REPO_ROOT / "data" / "latest.json"
LATEST_JS = REPO_ROOT / "data" / "latest.js"
HISTORY_DIR = REPO_ROOT / "data" / "history"


def seoul_now() -> datetime:
    """KST 고정 시각을 반환합니다."""
    if ZoneInfo is not None:
        return datetime.now(ZoneInfo("Asia/Seoul"))
    return datetime.now(timezone(timedelta(hours=9)))


def resolve_repo_path(raw_path: str) -> Path:
    """
    Path Traversal 방지를 위해 저장소 내부 경로만 허용합니다.
    Compliance: canonical path validation
    """
    candidate = Path(raw_path).expanduser().resolve()
    repo_root = REPO_ROOT.resolve()
    if repo_root not in candidate.parents and candidate != repo_root:
        raise ValueError("입력 파일 경로는 저장소 내부만 허용됩니다.")
    return candidate


def load_json_file(path: Path) -> dict[str, Any]:
    """안전하게 JSON 파일을 읽고 기본 타입을 검증합니다."""
    if not path.is_file():
        raise FileNotFoundError(f"입력 파일이 없습니다: {path}")

    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if not isinstance(payload, dict):
        raise ValueError("최상위 JSON 구조는 객체(dict)여야 합니다.")
    return payload


def require_string(data: dict[str, Any], key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"'{key}'는 비어 있지 않은 문자열이어야 합니다.")
    return value.strip()


def require_number(data: dict[str, Any], key: str) -> float:
    value = data.get(key)
    if not isinstance(value, (int, float)):
        raise ValueError(f"'{key}'는 숫자여야 합니다.")
    return float(value)


def require_list(data: dict[str, Any], key: str) -> list[Any]:
    value = data.get(key)
    if not isinstance(value, list):
        raise ValueError(f"'{key}'는 배열이어야 합니다.")
    return value


def validate_string_list(items: list[Any], owner: str) -> None:
    for index, item in enumerate(items):
        if not isinstance(item, str) or not item.strip():
            raise ValueError(f"{owner}[{index}]는 비어 있지 않은 문자열이어야 합니다.")


def validate_sources(items: list[Any], owner: str) -> None:
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(f"{owner}.sources[{index}]는 객체여야 합니다.")
        for key in ("title", "publisher", "publishedOn", "url", "note"):
            require_string(item, key)
        if not item["url"].startswith("https://"):
            raise ValueError(f"{owner}.sources[{index}].url은 https:// 로 시작해야 합니다.")


def validate_probability_objects(items: list[Any], owner: str) -> None:
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise ValueError(f"{owner}[{index}]는 객체여야 합니다.")
        require_string(item, "title")
        require_number(item, "probability")
        require_string(item, "copy")


def validate_snapshot(payload: dict[str, Any]) -> dict[str, Any]:
    """브라우저 렌더링 전에 필요한 필드를 모두 검증합니다."""
    normalized = copy.deepcopy(payload)

    require_string(normalized, "projectTitle")
    require_string(normalized, "dataMode")
    require_string(normalized, "marketSummary")
    require_string(normalized, "methodologyNote")
    require_string(normalized, "disclaimer")

    analysis_framework = require_list(normalized, "analysisFramework")
    for index, item in enumerate(analysis_framework):
        if not isinstance(item, dict):
            raise ValueError(f"analysisFramework[{index}]는 객체여야 합니다.")
        require_string(item, "title")
        require_number(item, "weightPercent")
        require_string(item, "summary")

    global_synthesis = normalized.get("globalSynthesis")
    if not isinstance(global_synthesis, dict):
        raise ValueError("'globalSynthesis'는 객체여야 합니다.")
    require_string(global_synthesis, "headline")
    require_string(global_synthesis, "summary")
    synthesis_action = global_synthesis.get("action")
    synthesis_direction = global_synthesis.get("direction")
    if not isinstance(synthesis_action, dict) or not isinstance(synthesis_direction, dict):
        raise ValueError("'globalSynthesis.action'과 'globalSynthesis.direction'은 객체여야 합니다.")
    for key in ("accumulate", "hold", "trim"):
        require_number(synthesis_action, key)
    for key in ("rise", "fall", "mixed"):
        require_number(synthesis_direction, key)
    validate_probability_objects(require_list(global_synthesis, "scenarios"), "globalSynthesis.scenarios")
    validate_string_list(require_list(global_synthesis, "notes"), "globalSynthesis.notes")

    portfolio = normalized.get("portfolio")
    if portfolio is not None:
        if not isinstance(portfolio, dict):
            raise ValueError("'portfolio'는 객체여야 합니다.")
        require_number(portfolio, "totalInvestedKrw")
        require_number(portfolio, "totalMarketValueKrw")
        require_number(portfolio, "totalProfitLossPercent")
        require_number(portfolio, "totalProfitLossKrw")
        require_string(portfolio, "summaryNote")

        validate_string_list(require_list(portfolio, "warnings"), "portfolio.warnings")

        positions = require_list(portfolio, "positions")
        for index, item in enumerate(positions):
            if not isinstance(item, dict):
                raise ValueError(f"portfolio.positions[{index}]는 객체여야 합니다.")
            for key in ("ticker", "company"):
                require_string(item, key)
            for key in ("marketValueKrw", "profitLossPercent", "weightPercent"):
                require_number(item, key)

    metrics = require_list(normalized, "marketMetrics")
    for index, item in enumerate(metrics):
        if not isinstance(item, dict):
            raise ValueError(f"marketMetrics[{index}]는 객체여야 합니다.")
        for key in ("label", "value", "move", "note"):
            require_string(item, key)

    recommendations = require_list(normalized, "recommendations")
    for index, item in enumerate(recommendations):
        if not isinstance(item, dict):
            raise ValueError(f"recommendations[{index}]는 객체여야 합니다.")
        for key in ("ticker", "group", "company", "focusLabel", "dominant", "headline"):
            require_string(item, key)

        action = item.get("action")
        direction = item.get("direction")
        if not isinstance(action, dict) or not isinstance(direction, dict):
            raise ValueError(f"recommendations[{index}]의 action/direction은 객체여야 합니다.")
        for key in ("accumulate", "hold", "trim"):
            require_number(action, key)
        for key in ("rise", "fall", "mixed"):
            require_number(direction, key)

        validate_string_list(require_list(item, "reasons"), f"recommendations[{index}].reasons")

        analyst_consensus = item.get("analystConsensus")
        if not isinstance(analyst_consensus, dict):
            raise ValueError(f"recommendations[{index}].analystConsensus는 객체여야 합니다.")
        require_string(analyst_consensus, "signal")
        require_string(analyst_consensus, "summary")
        validate_string_list(
            require_list(analyst_consensus, "highlights"),
            f"recommendations[{index}].analystConsensus.highlights",
        )

        key_points = require_list(item, "keyPoints")
        for point_index, point in enumerate(key_points):
            if not isinstance(point, dict):
                raise ValueError(f"recommendations[{index}].keyPoints[{point_index}]는 객체여야 합니다.")
            require_string(point, "category")
            require_string(point, "importance")
            require_string(point, "signal")
            require_string(point, "summary")

        expert_views = require_list(item, "expertViews")
        for expert_index, expert in enumerate(expert_views):
            if not isinstance(expert, dict):
                raise ValueError(f"recommendations[{index}].expertViews[{expert_index}]는 객체여야 합니다.")
            require_string(expert, "source")
            require_string(expert, "stance")
            require_string(expert, "importance")
            require_string(expert, "summary")

        validate_sources(require_list(item, "researchNotes"), f"recommendations[{index}].researchNotes")
        validate_probability_objects(require_list(item, "scenarios"), f"recommendations[{index}].scenarios")

        sources = require_list(item, "sources")
        validate_sources(sources, f"recommendations[{index}]")

    evidence_buckets = require_list(normalized, "evidenceBuckets")
    for index, bucket in enumerate(evidence_buckets):
        if not isinstance(bucket, dict):
            raise ValueError(f"evidenceBuckets[{index}]는 객체여야 합니다.")
        require_string(bucket, "title")
        require_string(bucket, "summary")
        validate_sources(require_list(bucket, "sources"), f"evidenceBuckets[{index}]")

    review_checklist = require_list(normalized, "reviewChecklist")
    for index, item in enumerate(review_checklist):
        if not isinstance(item, dict):
            raise ValueError(f"reviewChecklist[{index}]는 객체여야 합니다.")
        require_string(item, "title")
        require_string(item, "copy")

    validate_string_list(require_list(normalized, "roadmap"), "roadmap")

    return normalized


def archive_previous_snapshot() -> None:
    """기존 latest.json이 있으면 history 폴더에 보관합니다."""
    if not LATEST_JSON.is_file():
        return

    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = seoul_now().strftime("%Y%m%d-%H%M%S")
    archive_path = HISTORY_DIR / f"snapshot-{timestamp}.json"

    with LATEST_JSON.open("r", encoding="utf-8") as handle:
        previous_payload = json.load(handle)

    with archive_path.open("w", encoding="utf-8") as handle:
        json.dump(previous_payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def write_snapshot_files(snapshot: dict[str, Any]) -> None:
    """정적 페이지가 읽는 JSON/JS 파일을 동시에 생성합니다."""
    LATEST_JSON.parent.mkdir(parents=True, exist_ok=True)

    with LATEST_JSON.open("w", encoding="utf-8") as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    js_payload = "window.STOCK_FLOW_DATA = " + json.dumps(snapshot, ensure_ascii=False, indent=2) + ";\n"
    with LATEST_JS.open("w", encoding="utf-8") as handle:
        handle.write(js_payload)


def build_snapshot(payload: dict[str, Any]) -> dict[str, Any]:
    """입력 JSON을 정적 페이지가 바로 읽을 수 있는 스냅샷 구조로 보강합니다."""
    snapshot = validate_snapshot(payload)
    snapshot["generatedAtKst"] = seoul_now().strftime("%Y-%m-%d %H:%M:%S KST")
    snapshot["generatedBy"] = "scripts/update_snapshot.py"
    return snapshot


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="주식 flow 정적 스냅샷 파일을 생성합니다. 외부 자동수집은 현재 버전에 포함하지 않습니다."
    )
    parser.add_argument(
        "--input",
        default=str(DEFAULT_INPUT),
        help="저장소 내부의 입력 JSON 파일 경로",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        input_path = resolve_repo_path(args.input)
        payload = load_json_file(input_path)
        snapshot = build_snapshot(payload)
        archive_previous_snapshot()
        write_snapshot_files(snapshot)
    except FileNotFoundError as error:
        print(f"[ERROR] 파일을 찾을 수 없습니다: {error}")
        return 1
    except (ValueError, json.JSONDecodeError) as error:
        print(f"[ERROR] 스냅샷 생성에 실패했습니다: {error}")
        return 1
    except OSError as error:
        print(f"[ERROR] 파일 쓰기 중 문제가 발생했습니다: {error}")
        return 1

    print(f"[OK] 스냅샷 갱신 완료: {LATEST_JSON}")
    print(f"[OK] 브라우저 로더 갱신 완료: {LATEST_JS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
