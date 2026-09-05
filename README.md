# Mumbai Startup Map

An interactive map of the Mumbai startup ecosystem, built on an entirely
free and open-source mapping stack — no API keys, no vendor lock-in.

Inspired by [bangalorestartupmap.com](https://www.bangalorestartupmap.com/).

---

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 | Server-rendered shell, client-side map |
| Map rendering | [Leaflet](https://leafletjs.com/) (BSD-2) via `react-leaflet` | Fully open source, no key, ~40 kB |
| Basemap tiles | [OpenStreetMap](https://www.openstreetmap.org/) raster | Free, open data, no signup |
| Geocoding | [Nominatim](https://nominatim.org/) | OSM's own geocoder, free, no key |
| Data pipeline | Python 3 (stdlib only) | No dependencies to install |

Swap the basemap by setting `NEXT_PUBLIC_TILE_URL` — see `.env.example`.

> **Tile usage:** the default OSM tile servers are a donated community
> resource with a [usage policy](https://operations.osmfoundation.org/policies/tiles/)
> that forbids heavy traffic. Move to a self-hosted or paid provider before
> this gets any real audience.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Regenerate the dataset:

```bash
npm run data:ingest    # pull Mumbai companies from the open YC mirror
npm run data:validate  # schema + bounding-box checks
```

The Python scripts use only the standard library, so there is nothing to
install for the data pipeline.

## Where the data comes from

Seeded from [`yc-oss/api`](https://github.com/yc-oss/api), a daily open mirror
of Y Combinator's public company index. We read that JSON mirror rather than
driving YC's search UI — no scraping, no rate limiting, no ToS grey area.

### The honest caveat

**This is a seed, not a census.** Two things to understand before trusting a pin:

1. **YC is one narrow slice** of Mumbai's ecosystem. 26 companies, not 2,600.
2. **YC does not publish neighbourhoods.** Its location field is a single
   string, and for 21 of those 26 companies it reads exactly `"MH, India"` —
   the *state*, not the city. Those records cannot be placed on a street.

Rather than invent coordinates, the pipeline records what it actually knows in
`geo.precision`:

| `precision` | Meaning | How the map draws it |
|---|---|---|
| `exact` | Resolved street address | Solid pin |
| `neighbourhood` | Locality known, building not | Solid pin |
| `city` | Only "Mumbai" is known | Hollow dashed ring |
| `state` | Source said "Maharashtra" — could even be Pune | Hollow dashed ring |

Unplaceable records sit at the Mumbai centroid. To stop 21 markers stacking
into one unclickable dot, `lib/geo.ts` fans them onto a deterministic ring
around the centre. **That spread is a rendering affordance, not geography** —
the stored coordinate stays the honest centroid, the ring is drawn hollow, and
the popup says "position approximate".

The in-app banner surfaces these caveats to visitors too. The point is that a
confident-looking pin should mean something.

### Improving the data

Corrections live in `data/overrides.json`, which always beats ingested values:

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

Then:

```bash
npm run data:geocode   # Nominatim fills in lat/lng + verifiedAt
npm run data:ingest    # re-apply overrides
```

`scripts/geocode.py` rate-limits itself to 1 req/sec per Nominatim's policy and
rejects any result outside the Mumbai Metropolitan Region bounding box, so a
bad address string fails loudly instead of dropping a pin in another state.

`validate_data.py` rejects `precision: "exact"` without a `verifiedAt` date —
you cannot claim an exact location nobody signed off on.

See [`data/schema.md`](data/schema.md) for the full field reference.

## Layout

```
app/
  layout.tsx  page.tsx  globals.css
  api/companies/route.ts     # read-only JSON feed
components/
  Explorer.tsx               # filter state, map/grid toggle
  MapCanvas.tsx              # Leaflet, client-only
  FilterBar.tsx  CompanyCard.tsx  Legend.tsx
lib/
  types.ts                   # the schema, in one place
  data.ts  filter.ts  geo.ts  constants.ts
scripts/
  ingest_yc.py  geocode.py  validate_data.py
data/
  startups.json              # generated — do not hand-edit
  overrides.json             # hand-verified corrections
  schema.md
```

## Roadmap

- [ ] Verify locations for the 21 state-precision records
- [ ] Add non-YC Mumbai startups (the large majority of the ecosystem)
- [ ] Add VCs and accelerators (`kind: "vc"` is already in the schema)
- [ ] Marker clustering once the dataset outgrows ~200 pins
- [ ] Shareable filter state in the URL

## Licence

MIT for the code. The company data originates from Y Combinator's public
directory via `yc-oss/api`; map tiles and geocoding are © OpenStreetMap
contributors under the [ODbL](https://www.openstreetmap.org/copyright).
