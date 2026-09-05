# Data schema

`startups.json` is generated — do not hand-edit it. Corrections go in
`overrides.json`, which the ingest re-applies on every run.

```jsonc
{
  "version": 1,
  "generatedAt": "2026-08-19T00:00:00+00:00",
  "caveats": ["human-readable notes about what this data does NOT know"],
  "companies": [ /* Company[] */ ]
}
```

## Company

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable slug, primary key across ingest runs |
| `name` | string | |
| `kind` | `startup` \| `vc` | |
| `tagline` | string | One line; keep under ~140 chars for the popup |
| `description` | string? | |
| `website` | string? | |
| `linkedin`, `twitter` | string? | |
| `sourceUrl` | string? | Link back to the source profile (e.g. YC) |
| `sector` | enum | See `lib/types.ts` → `SECTORS` |
| `stage` | enum | See `STAGES` |
| `tags` | string[] | Free-form, from the source |
| `neighbourhood` | string? | Only set once verified, e.g. `"Lower Parel"` |
| `address` | string? | Only set once verified |
| `area` | enum | See `AREAS`; `unknown` until verified |
| `geo` | Geo | See below |
| `foundedYear`, `teamSize` | number? | |
| `batch` | string? | YC batch, e.g. `"W21"` |
| `status` | `active` \| `inactive` \| `acquired` \| `public` | |
| `source` | string | Where the record came from, e.g. `"yc-oss"` |
| `verified` | boolean | True only when a human confirmed company **and** location |

## Geo

| Field | Type | Notes |
|---|---|---|
| `lat`, `lng` | number | WGS84 decimal degrees |
| `precision` | `exact` \| `neighbourhood` \| `city` \| `state` | |
| `source` | string | `yc-oss`, `nominatim`, `manual` |
| `verifiedAt` | string \| null | ISO date a human last confirmed it |

### `precision` is the honest bit

The upstream YC data reports location as a single `all_locations` string. For
most Maharashtra companies that string is just `"MH, India"` — the **state**.
We cannot infer a neighbourhood from that, so those records get:

- `geo.precision: "state"`
- the Mumbai centroid as a **placeholder** coordinate
- `area: "unknown"`, `verified: false`

The map draws these as hollow, dashed rings and spreads them on a deterministic
ring around the centroid so they do not stack into one pin. That spread is a
rendering affordance, not data — see `lib/geo.ts`.

Never set `precision: "exact"` without also setting `geo.verifiedAt`;
`scripts/validate_data.py` fails the build if you do.

## overrides.json

Keyed by company `id`. Any field here wins over the ingested value.

```jsonc
{
  "some-company": {
    "address": "Kamala Mills, Lower Parel, Mumbai",
    "neighbourhood": "Lower Parel",
    "area": "lower-parel-worli",
    "verified": true
  }
}
```

Add the `address`, run `python3 scripts/geocode.py` to fill in `geo`, then
re-run `python3 scripts/ingest_yc.py`.
