'use client';

import {
  AREA_LABELS, KIND_LABELS, SECTOR_COLORS, SECTOR_LABELS, STAGE_LABELS,
} from '@/lib/constants';
import { batchesIn, countBy } from '@/lib/filter';
import {
  AREAS, KINDS, SECTORS, STAGES,
  type Area, type Company, type Filters, type Kind, type Sector, type Stage,
} from '@/lib/types';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Facet rows are hidden when the dataset has zero of that value, so the
 *  sidebar reflects the data rather than the enum. */
function Facet<T extends string>({ values, labels, selected, counts, colors, onToggle }: {
  values: readonly T[];
  labels: Record<string, string>;
  selected: T[];
  counts: Map<string, number>;
  colors?: Record<string, string>;
  onToggle: (v: T) => void;
}) {
  const present = values.filter((v) => (counts.get(v) ?? 0) > 0);
  if (present.length === 0) return null;

  return (
    <>
      {present.map((v) => (
        <label key={v} className="filters__option">
          <input type="checkbox" checked={selected.includes(v)} onChange={() => onToggle(v)} />
          {colors ? (
            <span className="filters__swatch" style={{ background: colors[v] }} aria-hidden="true" />
          ) : null}
          {labels[v] ?? v}
          <span className="filters__count">{counts.get(v) ?? 0}</span>
        </label>
      ))}
    </>
  );
}

export default function FilterBar({ companies, filters, onChange, resultCount }: {
  companies: Company[];
  filters: Filters;
  onChange: (next: Filters) => void;
  resultCount: number;
}) {
  const kindCounts = countBy(companies, 'kind');
  const sectorCounts = countBy(companies, 'sector');
  const stageCounts = countBy(companies, 'stage');
  const areaCounts = countBy(companies, 'area');
  const batches = batchesIn(companies);

  const active =
    filters.query !== '' || filters.kinds.length > 0 || filters.sectors.length > 0 ||
    filters.stages.length > 0 || filters.areas.length > 0 || filters.batches.length > 0 ||
    filters.hideInactive;

  return (
    <div className="filters">
      <input
        type="search"
        className="filters__search"
        placeholder="Search name, tagline, tag…"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
        aria-label="Search companies"
      />

      <div className="filters__summary">
        <span><strong>{resultCount}</strong> results</span>
        {active ? (
          <button
            type="button"
            className="filters__reset"
            onClick={() => onChange({
              query: '', kinds: [], sectors: [], stages: [], areas: [],
              batches: [], hideInactive: false,
            })}
          >
            Reset
          </button>
        ) : null}
      </div>

      {kindCounts.size > 1 ? (
        <fieldset className="filters__group">
          <legend>Type</legend>
          <Facet<Kind>
            values={KINDS} labels={KIND_LABELS} selected={filters.kinds} counts={kindCounts}
            onToggle={(v) => onChange({ ...filters, kinds: toggle(filters.kinds, v) })}
          />
        </fieldset>
      ) : null}

      <fieldset className="filters__group">
        <legend>Sector</legend>
        <Facet<Sector>
          values={SECTORS} labels={SECTOR_LABELS} selected={filters.sectors}
          counts={sectorCounts} colors={SECTOR_COLORS}
          onToggle={(v) => onChange({ ...filters, sectors: toggle(filters.sectors, v) })}
        />
      </fieldset>

      <fieldset className="filters__group">
        <legend>Stage</legend>
        <Facet<Stage>
          values={STAGES} labels={STAGE_LABELS} selected={filters.stages} counts={stageCounts}
          onToggle={(v) => onChange({ ...filters, stages: toggle(filters.stages, v) })}
        />
      </fieldset>

      <fieldset className="filters__group">
        <legend>Area</legend>
        <Facet<Area>
          values={AREAS} labels={AREA_LABELS} selected={filters.areas} counts={areaCounts}
          onToggle={(v) => onChange({ ...filters, areas: toggle(filters.areas, v) })}
        />
      </fieldset>

      {batches.length > 0 ? (
        <fieldset className="filters__group">
          <legend>YC batch</legend>
          <div className="filters__chips">
            {batches.map((b) => (
              <button
                key={b}
                type="button"
                className={`chip${filters.batches.includes(b) ? ' chip--on' : ''}`}
                onClick={() => onChange({ ...filters, batches: toggle(filters.batches, b) })}
                aria-pressed={filters.batches.includes(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="filters__option filters__option--standalone">
        <input
          type="checkbox"
          checked={filters.hideInactive}
          onChange={() => onChange({ ...filters, hideInactive: !filters.hideInactive })}
        />
        Hide inactive companies
      </label>
    </div>
  );
}
