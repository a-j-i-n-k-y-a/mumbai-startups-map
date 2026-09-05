'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

import CompanyCard from './CompanyCard';
import FilterBar from './FilterBar';
import Legend from './Legend';
import { applyFilters } from '@/lib/filter';
import { EMPTY_FILTERS, type Company, type Filters } from '@/lib/types';

/**
 * Leaflet touches `window` at module scope, so the canvas is browser-only.
 * `ssr: false` is legal here because this file is a Client Component --
 * moving this import into a Server Component would break the build.
 */
const MapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => <div className="map__placeholder">Loading map…</div>,
});

export default function Explorer({ companies }: { companies: Company[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'grid'>('map');

  const visible = useMemo(() => applyFilters(companies, filters), [companies, filters]);

  return (
    <div className="explorer">
      <aside className="explorer__sidebar">
        <FilterBar
          companies={companies}
          filters={filters}
          onChange={setFilters}
          resultCount={visible.length}
        />
        <div className="explorer__results">
          {visible.length === 0 ? (
            <p className="explorer__empty">
              {companies.length === 0
                ? 'Dataset is empty — run scripts/ingest_yc.py to populate it.'
                : 'No companies match these filters.'}
            </p>
          ) : (
            visible.map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                active={c.id === selectedId}
                onSelect={() => setSelectedId(c.id === selectedId ? null : c.id)}
              />
            ))
          )}
        </div>
      </aside>

      <section className="explorer__main">
        <div className="viewswitch" role="tablist" aria-label="View">
          {(['map', 'grid'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={`viewswitch__btn${view === v ? ' viewswitch__btn--on' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'map' ? 'Map' : 'Grid'}
            </button>
          ))}
        </div>

        {view === 'map' ? (
          <>
            <MapCanvas companies={visible} selectedId={selectedId} onSelect={setSelectedId} />
            <Legend companies={visible} />
          </>
        ) : (
          <div className="grid">
            {visible.map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                active={c.id === selectedId}
                onSelect={() => setSelectedId(c.id === selectedId ? null : c.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
