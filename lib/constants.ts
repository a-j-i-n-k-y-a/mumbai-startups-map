import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';

/** Fort / CST. Also the placeholder pin for unknown-location records. */
export const MUMBAI_CENTER: LatLngTuple = [19.076, 72.8777];
export const DEFAULT_ZOOM = 11;

/** Mumbai Metropolitan Region, loose enough to include Navi Mumbai + Thane. */
export const MMR_BOUNDS: LatLngBoundsExpression = [
  [18.85, 72.72],
  [19.4, 73.2],
];

/**
 * Free, no-API-key raster tiles from the OpenStreetMap Foundation. Their tile
 * usage policy forbids heavy commercial traffic -- if this map gets popular,
 * move to a self-hosted or paid provider via NEXT_PUBLIC_TILE_URL.
 * https://operations.osmfoundation.org/policies/tiles/
 */
export const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ||
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const SECTOR_LABELS: Record<string, string> = {
  ai: 'AI', fintech: 'Fintech', saas: 'SaaS', consumer: 'Consumer', d2c: 'D2C',
  healthtech: 'Healthtech', edtech: 'Edtech', logistics: 'Logistics',
  gaming: 'Gaming', deeptech: 'Deeptech', climate: 'Climate', media: 'Media',
  realestate: 'Real estate', other: 'Other',
};

export const STAGE_LABELS: Record<string, string> = {
  bootstrapped: 'Bootstrapped', 'pre-seed': 'Pre-seed', seed: 'Seed',
  'series-a': 'Series A', 'series-b': 'Series B', 'series-c-plus': 'Series C+',
  public: 'Public', acquired: 'Acquired', inactive: 'Inactive', unknown: 'Unknown',
};

export const AREA_LABELS: Record<string, string> = {
  'south-mumbai': 'South Mumbai',
  'lower-parel-worli': 'Lower Parel / Worli',
  'bandra-khar-santacruz': 'Bandra / Khar / Santacruz',
  'andheri-jogeshwari': 'Andheri / Jogeshwari',
  'powai-vikhroli': 'Powai / Vikhroli',
  'goregaon-malad-kandivali': 'Goregaon / Malad / Kandivali',
  'borivali-dahisar': 'Borivali / Dahisar',
  'central-mumbai': 'Central Mumbai',
  'navi-mumbai': 'Navi Mumbai',
  thane: 'Thane',
  unknown: 'Location unknown',
};

export const KIND_LABELS: Record<string, string> = {
  startup: 'Startups',
  vc: 'VCs',
};

/** Distinct hues, legible on the OSM basemap in both themes. */
export const SECTOR_COLORS: Record<string, string> = {
  ai: '#4f46e5', fintech: '#2563eb', saas: '#7c3aed', consumer: '#db2777',
  d2c: '#e11d48', healthtech: '#059669', edtech: '#d97706', logistics: '#0891b2',
  gaming: '#c026d3', deeptech: '#4338ca', climate: '#16a34a', media: '#9333ea',
  realestate: '#b45309', other: '#64748b',
};

export const PRECISION_NOTE: Record<string, string> = {
  exact: 'Exact address',
  neighbourhood: 'Neighbourhood-level',
  city: 'City-level only',
  state: 'State-level only — position is a placeholder',
};
