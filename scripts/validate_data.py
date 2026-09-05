#!/usr/bin/env python3
"""Fail loudly if data/startups.json drifts from the documented schema.

Run before committing regenerated data, and in CI.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "startups.json"

KINDS = {"startup", "vc"}
SECTORS = {
    "ai", "fintech", "saas", "consumer", "d2c", "healthtech", "edtech",
    "logistics", "gaming", "deeptech", "climate", "media", "realestate", "other",
}
STAGES = {
    "bootstrapped", "pre-seed", "seed", "series-a", "series-b", "series-c-plus",
    "public", "acquired", "inactive", "unknown",
}
AREAS = {
    "south-mumbai", "lower-parel-worli", "bandra-khar-santacruz",
    "andheri-jogeshwari", "powai-vikhroli", "goregaon-malad-kandivali",
    "borivali-dahisar", "central-mumbai", "navi-mumbai", "thane", "unknown",
}
PRECISIONS = {"exact", "neighbourhood", "city", "state"}
MMR_BBOX = (18.85, 72.72, 19.40, 73.20)


def main() -> int:
    dataset = json.loads(DATA.read_text("utf8"))
    errors: list[str] = []
    seen_ids: set[str] = set()

    for company in dataset.get("companies", []):
        name = company.get("name", "<unnamed>")

        for field in ("id", "name", "kind", "sector", "stage", "area", "geo", "source"):
            if field not in company:
                errors.append(f"{name}: missing required field '{field}'")

        cid = company.get("id")
        if cid in seen_ids:
            errors.append(f"{name}: duplicate id '{cid}'")
        seen_ids.add(cid)

        for field, allowed in (
            ("kind", KINDS), ("sector", SECTORS), ("stage", STAGES), ("area", AREAS),
        ):
            value = company.get(field)
            if value is not None and value not in allowed:
                errors.append(f"{name}: {field}='{value}' not in the allowed set")

        geo = company.get("geo") or {}
        if geo.get("precision") not in PRECISIONS:
            errors.append(f"{name}: geo.precision='{geo.get('precision')}' invalid")

        lat, lng = geo.get("lat"), geo.get("lng")
        south, west, north, east = MMR_BBOX
        if not isinstance(lat, (int, float)) or not (south <= lat <= north):
            errors.append(f"{name}: lat {lat} outside Mumbai region")
        if not isinstance(lng, (int, float)) or not (west <= lng <= east):
            errors.append(f"{name}: lng {lng} outside Mumbai region")

        # An 'exact' coordinate that nobody signed off on is a contradiction.
        if geo.get("precision") == "exact" and not geo.get("verifiedAt"):
            errors.append(f"{name}: precision='exact' but geo.verifiedAt is empty")

    if errors:
        print(f"{len(errors)} problem(s):", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    total = len(dataset.get("companies", []))
    print(f"OK: {total} companies, schema valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
