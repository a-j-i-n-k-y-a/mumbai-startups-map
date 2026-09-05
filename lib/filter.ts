import type { Company, Filters } from './types';

/** Empty facet arrays mean "no constraint", which is what makes the initial
 *  unfiltered view show everything. */
export function applyFilters(companies: Company[], f: Filters): Company[] {
  const q = f.query.trim().toLowerCase();

  return companies.filter((c) => {
    if (f.hideInactive && (c.status === 'inactive' || c.stage === 'inactive')) return false;
    if (f.kinds.length && !f.kinds.includes(c.kind)) return false;
    if (f.sectors.length && !f.sectors.includes(c.sector)) return false;
    if (f.stages.length && !f.stages.includes(c.stage)) return false;
    if (f.areas.length && !f.areas.includes(c.area)) return false;
    if (f.batches.length && (!c.batch || !f.batches.includes(c.batch))) return false;

    if (q) {
      const hay = [c.name, c.tagline, c.description, c.neighbourhood, ...(c.tags ?? [])]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Facet counts keyed as plain strings. Returning Map<Company[K], number> would
 * be more precise but Map is invariant in TS, so it could not be passed to a
 * component that accepts a generic Map<string, number>.
 */
export function countBy(companies: Company[], key: 'kind' | 'sector' | 'stage' | 'area'): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of companies) {
    const value = c[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/** Batches present in the data, newest first (W22 > S22 > W21 ...). */
export function batchesIn(companies: Company[]): string[] {
  const seen = new Set<string>();
  for (const c of companies) if (c.batch) seen.add(c.batch);
  return [...seen].sort((a, b) => {
    const yearDiff = Number(b.slice(1)) - Number(a.slice(1));
    if (yearDiff !== 0) return yearDiff;
    return a.startsWith('W') ? -1 : 1;
  });
}
