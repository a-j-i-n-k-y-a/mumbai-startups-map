'use client';

import { SECTOR_COLORS, SECTOR_LABELS, STAGE_LABELS } from '@/lib/constants';
import { isApproximate } from '@/lib/geo';
import type { Company } from '@/lib/types';

export default function CompanyCard({ company, active, onSelect }: {
  company: Company; active: boolean; onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`card${active ? ' card--active' : ''}`}
      aria-pressed={active}
    >
      <span
        className="card__accent"
        style={{ background: SECTOR_COLORS[company.sector] }}
        aria-hidden="true"
      />
      <span className="card__body">
        <span className="card__top">
          <span className="card__name">{company.name}</span>
          {company.batch ? <span className="card__batch">{company.batch}</span> : null}
          {isApproximate(company) ? (
            <span className="card__flag" title="Location not verified">?</span>
          ) : null}
        </span>
        {company.tagline ? <span className="card__tagline">{company.tagline}</span> : null}
        <span className="card__meta">
          {SECTOR_LABELS[company.sector] ?? company.sector}
          {' · '}
          {STAGE_LABELS[company.stage] ?? company.stage}
          {company.neighbourhood ? ` · ${company.neighbourhood}` : ''}
        </span>
      </span>
    </button>
  );
}
