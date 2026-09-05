import type { Company } from './types';

/** Cheap deterministic string hash (FNV-1a, 32-bit). */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Records with no real coordinate all carry the Mumbai centroid, so they would
 * stack into a single unclickable pin. We fan them out onto a deterministic
 * ring around the centroid -- same input always yields the same position, so
 * the map does not jitter between renders.
 *
 * This is a DISPLAY affordance only. The underlying data keeps the honest
 * centroid, and these markers are drawn hollow with a "position approximate"
 * note in the popup so nobody mistakes the spread for real geography.
 */
export function displayPosition(company: Company): [number, number] {
  const { lat, lng, precision } = company.geo;
  if (precision === 'exact' || precision === 'neighbourhood') return [lat, lng];

  const h = hash(company.id);
  const angle = (h % 3600) / 3600 * Math.PI * 2;
  // Two rings so ~26 markers stay distinguishable without drifting off-city.
  const ring = ((h >>> 12) % 2) === 0 ? 0.022 : 0.038;

  return [lat + Math.sin(angle) * ring, lng + Math.cos(angle) * ring * 1.05];
}

/** True when the pin position is a placeholder rather than a real location. */
export function isApproximate(company: Company): boolean {
  return company.geo.precision === 'city' || company.geo.precision === 'state';
}
