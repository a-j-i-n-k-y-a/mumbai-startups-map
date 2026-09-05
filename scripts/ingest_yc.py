#!/usr/bin/env python3
"""Build data/startups.json from the open YC dataset, Mumbai companies only.

Source: https://github.com/yc-oss/api -- a daily mirror of YC's public Algolia
index. We use the mirror rather than driving the SPA: it is a plain JSON file,
so there is no scraping, no rate limiting and no ToS grey area.

The hard constraint this script exists to enforce: YC reports location as
`all_locations`, and for most Maharashtra companies that string is just
"MH, India" -- the *state*. We therefore cannot know the neighbourhood, and we
must not invent one. Such records land at Mumbai's centroid with
precision="state" and verified=false, and the UI renders them as low-confidence.

Anything you verify by hand goes in data/overrides.json, which always wins.

Usage:  python3 scripts/ingest_yc.py [--offline path/to/all.json]
Stdlib only -- no dependencies.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

YC_ALL_URL = "https://yc-oss.github.io/api/companies/all.json"

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
OUT_PATH = DATA_DIR / "startups.json"
OVERRIDES_PATH = DATA_DIR / "overrides.json"

# Mumbai city centroid (Fort / CST). Used only as a placeholder for records
# whose real coordinates we do not know.
MUMBAI_CENTROID = (19.0760, 72.8777)

# Matches a Mumbai-area city name, or a bare Maharashtra state code.
MUMBAI_RE = re.compile(r"\b(mumbai|bombay|navi mumbai|thane|powai)\b", re.I)
MH_STATE_RE = re.compile(r"(^|;\s*)MH,\s*India\b")

# Other Maharashtra cities. If one of these appears the company is NOT Mumbai,
# even when a bare "MH, India" segment also appears.
NON_MUMBAI_MH_RE = re.compile(r"\b(pune|nagpur|nashik|aurangabad|kolhapur|solapur)\b", re.I)

# YC `industry` / `subindustry` / tags -> our closed sector set.
SECTOR_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b(fintech|financial|banking|insurance|payments|lending)\b", re.I), "fintech"),
    (re.compile(r"\b(healthcare|health|medical|diagnostics|biotech|therapeutics)\b", re.I), "healthtech"),
    (re.compile(r"\b(education|edtech|learning)\b", re.I), "edtech"),
    (re.compile(r"\b(logistics|supply chain|freight|delivery|shipping)\b", re.I), "logistics"),
    (re.compile(r"\b(gaming|games)\b", re.I), "gaming"),
    (re.compile(r"\b(real estate|proptech|property|construction)\b", re.I), "realestate"),
    (re.compile(r"\b(climate|energy|sustainab|carbon)\b", re.I), "climate"),
    (re.compile(r"\b(media|content|entertainment|creator)\b", re.I), "media"),
    (re.compile(r"\b(artificial intelligence|machine learning|\bai\b|\bml\b)\b", re.I), "ai"),
    (re.compile(r"\b(hardware|robotics|semiconductor|space|deep tech)\b", re.I), "deeptech"),
    (re.compile(r"\b(consumer goods|e-?commerce|marketplace|d2c|retail)\b", re.I), "d2c"),
    (re.compile(r"\b(b2b|saas|engineering|product and design|infrastructure|analytics)\b", re.I), "saas"),
    (re.compile(r"\bconsumer\b", re.I), "consumer"),
]

STATUS_MAP = {"active": "active", "inactive": "inactive", "acquired": "acquired", "public": "public"}


def log(msg: str) -> None:
    print(f"[ingest] {msg}", file=sys.stderr)


def fetch_yc(offline: str | None) -> list[dict]:
    if offline:
        log(f"reading local snapshot {offline}")
        return json.loads(Path(offline).read_text("utf8"))
    log(f"fetching {YC_ALL_URL}")
    req = urllib.request.Request(
        YC_ALL_URL,
        headers={"User-Agent": "mumbai-startups-map (github.com/a-j-i-n-k-y-a/mumbai-startups-map)"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf8"))


def is_mumbai(locations: str) -> bool:
    """True when the company plausibly sits in the Mumbai metropolitan region."""
    if not locations:
        return False
    if MUMBAI_RE.search(locations):
        return True
    # Bare state code counts only when no other Maharashtra city is named.
    return bool(MH_STATE_RE.search(locations)) and not NON_MUMBAI_MH_RE.search(locations)


def geo_precision(locations: str) -> str:
    """We only ever claim what the source actually told us."""
    if MUMBAI_RE.search(locations):
        return "city"
    return "state"


def pick_sector(company: dict) -> str:
    haystack = " ".join(
        filter(
            None,
            [
                company.get("industry") or "",
                company.get("subindustry") or "",
                " ".join(company.get("tags") or []),
                company.get("one_liner") or "",
            ],
        )
    )
    for pattern, sector in SECTOR_RULES:
        if pattern.search(haystack):
            return sector
    return "other"


def pick_stage(company: dict) -> str:
    """YC exposes `stage` loosely; fall back to lifecycle status."""
    stage = (company.get("stage") or "").strip().lower()
    if stage in {"seed", "growth", "early"}:
        return "seed" if stage != "growth" else "series-b"
    status = (company.get("status") or "").strip().lower()
    if status == "acquired":
        return "acquired"
    if status == "inactive":
        return "inactive"
    if status == "public":
        return "public"
    return "unknown"


def short_batch(batch: str) -> str:
    """'Winter 2021' -> 'W21'."""
    m = re.match(r"(Winter|Summer|Spring|Fall)\s+(\d{4})", batch or "")
    if not m:
        return batch or ""
    return f"{m.group(1)[0]}{m.group(2)[2:]}"


def to_company(raw: dict) -> dict:
    locations = raw.get("all_locations") or ""
    precision = geo_precision(locations)
    lat, lng = MUMBAI_CENTROID
    status = STATUS_MAP.get((raw.get("status") or "").lower())

    return {
        "id": raw.get("slug") or re.sub(r"[^a-z0-9]+", "-", (raw.get("name") or "").lower()).strip("-"),
        "name": raw.get("name") or "",
        "kind": "startup",
        "tagline": raw.get("one_liner") or "",
        "description": raw.get("long_description") or None,
        "website": raw.get("website") or None,
        "sourceUrl": raw.get("url") or None,
        "sector": pick_sector(raw),
        "stage": pick_stage(raw),
        "tags": raw.get("tags") or [],
        "area": "unknown",
        "geo": {
            "lat": lat,
            "lng": lng,
            "precision": precision,
            "source": "yc-oss",
            "verifiedAt": None,
        },
        "teamSize": raw.get("team_size") or None,
        "batch": short_batch(raw.get("batch") or ""),
        "status": status,
        "source": "yc-oss",
        "verified": False,
    }


def apply_overrides(companies: list[dict], overrides: dict) -> int:
    """Hand-verified data always beats scraped data."""
    by_id = {c["id"]: c for c in companies}
    applied = 0
    for company_id, patch in overrides.items():
        target = by_id.get(company_id)
        if target is None:
            log(f"override for unknown id '{company_id}' -- skipped")
            continue
        geo_patch = patch.pop("geo", None)
        target.update(patch)
        if geo_patch:
            target["geo"].update(geo_patch)
        applied += 1
    return applied


def prune(value):
    """Drop None/empty so the committed JSON stays readable."""
    if isinstance(value, dict):
        return {k: prune(v) for k, v in value.items() if v is not None and v != []}
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", help="path to a local all.json snapshot")
    args = parser.parse_args()

    raw_all = fetch_yc(args.offline)
    log(f"{len(raw_all)} YC companies in source")

    mumbai_raw = [c for c in raw_all if is_mumbai(c.get("all_locations") or "")]
    log(f"{len(mumbai_raw)} matched the Mumbai region")

    companies = [to_company(c) for c in mumbai_raw]
    companies.sort(key=lambda c: c["name"].lower())

    overrides = {}
    if OVERRIDES_PATH.exists():
        overrides = json.loads(OVERRIDES_PATH.read_text("utf8"))
        applied = apply_overrides(companies, overrides)
        log(f"applied {applied} override(s)")

    state_only = sum(1 for c in companies if c["geo"]["precision"] == "state")
    unverified = sum(1 for c in companies if not c["verified"])

    dataset = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "caveats": [
            "Seeded from the open YC mirror (yc-oss/api); YC is only one slice of "
            "Mumbai's ecosystem, so this is not a census.",
            f"{state_only} of {len(companies)} records only have state-level "
            "location ('MH, India') in the source. They are pinned at the Mumbai "
            "centroid with precision='state' and must not be read as real addresses.",
            f"{unverified} of {len(companies)} records are unverified. Add "
            "confirmed addresses to data/overrides.json.",
        ],
        "companies": [prune(c) for c in companies],
    }

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(dataset, indent=2, ensure_ascii=False) + "\n", "utf8")
    log(f"wrote {OUT_PATH.relative_to(ROOT)} ({len(companies)} companies)")
    log(f"  state-precision: {state_only}   unverified: {unverified}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
