'use client';

import { SECTOR_COLORS, SECTOR_LABELS } from '@/lib/constants';
import type { Company } from '@/lib/types';

/** Only shows sectors actually present, so the legend never lists dead keys. */
export default function Legend({ companies }: { companies: Company[] }) {
  const present = [...new Set(companies.map((c) => c.sector))].sort();
  if (present.length === 0) return null;

  return (
    <div className="legend">
      <ul className="legend__list">
        {present.map((sector) => (
          <li key={sector} className="legend__item">
            <span className="legend__dot" style={{ background: SECTOR_COLORS[sector] }} />
            {SECTOR_LABELS[sector] ?? sector}
          </li>
        ))}
      </ul>
      <p className="legend__note">
        <span className="legend__dot legend__dot--hollow" />
        Hollow ring = location unverified, pin is a placeholder
      </p>
    </div>
  );
}
