#!/usr/bin/env python3
"""Resolve street addresses in data/overrides.json to coordinates.

Uses Nominatim, the OpenStreetMap Foundation's free geocoder -- no API key,
no vendor lock-in, same open-data stack as the basemap. Their usage policy
caps automated use at 1 request/second and requires a real User-Agent that
identifies the application, both of which this script honours.
https://operations.osmfoundation.org/policies/nominatim/

Workflow:
  1. Add an entry to data/overrides.json with an `address`:
       { "zepto": { "address": "Kamala Mills, Lower Parel, Mumbai",
                    "neighbourhood": "Lower Parel",
                    "area": "lower-parel-worli" } }
  2. python3 scripts/geocode.py
     -> fills in geo.lat/lng/precision/source/verifiedAt for that entry
  3. python3 scripts/ingest_yc.py   (overrides are re-applied)

Only entries that have an `address` and no coordinates yet are looked up, so
re-running is cheap and idempotent. Stdlib only.
"""

from __future__ import annotations

import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OVERRIDES_PATH = ROOT / "data" / "overrides.json"

NOMINATIM = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "mumbai-startups-map/0.1 (github.com/a-j-i-n-k-y-a/mumbai-startups-map)"

# Nominatim asks for max 1 req/sec for automated clients. Be a good citizen.
RATE_LIMIT_SECONDS = 1.1

# Reject anything Nominatim resolves outside the Mumbai Metropolitan Region --
# a bad address string otherwise silently lands the pin in another state.
MMR_BBOX = (18.85, 72.72, 19.40, 73.20)  # south, west, north, east


def log(msg: str) -> None:
    print(f"[geocode] {msg}", file=sys.stderr)


def lookup(address: str) -> tuple[float, float] | None:
    query = urllib.parse.urlencode(
        {"q": address, "format": "json", "limit": 1, "countrycodes": "in"}
    )
    req = urllib.request.Request(f"{NOMINATIM}?{query}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        results = json.loads(resp.read().decode("utf8"))

    if not results:
        return None
    lat, lng = float(results[0]["lat"]), float(results[0]["lon"])

    south, west, north, east = MMR_BBOX
    if not (south <= lat <= north and west <= lng <= east):
        log(f"  REJECTED {lat:.4f},{lng:.4f} — outside Mumbai region")
        return None
    return lat, lng


def main() -> int:
    if not OVERRIDES_PATH.exists():
        log("data/overrides.json not found — nothing to do")
        return 0

    overrides = json.loads(OVERRIDES_PATH.read_text("utf8"))
    pending = [
        (cid, patch) for cid, patch in overrides.items()
        if patch.get("address") and not (patch.get("geo") or {}).get("lat")
    ]

    if not pending:
        log("every override with an address already has coordinates")
        return 0

    log(f"{len(pending)} address(es) to resolve")
    resolved = 0

    for index, (company_id, patch) in enumerate(pending):
        if index:
            time.sleep(RATE_LIMIT_SECONDS)
        address = patch["address"]
        log(f"{company_id}: {address}")
        try:
            hit = lookup(address)
        except Exception as exc:  # network/parse -- keep going, report at the end
            log(f"  failed: {exc}")
            continue

        if hit is None:
            log("  no usable result")
            continue

        lat, lng = hit
        patch["geo"] = {
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "precision": "exact",
            "source": "nominatim",
            "verifiedAt": date.today().isoformat(),
        }
        resolved += 1
        log(f"  -> {lat:.5f}, {lng:.5f}")

    OVERRIDES_PATH.write_text(json.dumps(overrides, indent=2, ensure_ascii=False) + "\n", "utf8")
    log(f"resolved {resolved}/{len(pending)}; wrote data/overrides.json")
    log("now re-run: python3 scripts/ingest_yc.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
