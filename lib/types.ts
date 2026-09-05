/** Canonical record shape. Mirrors data/schema.md and scripts/ingest_yc.py. */

export const KINDS = ['startup', 'vc'] as const;
export type Kind = (typeof KINDS)[number];

export const SECTORS = [
  'ai', 'fintech', 'saas', 'consumer', 'd2c', 'healthtech', 'edtech',
  'logistics', 'gaming', 'deeptech', 'climate', 'media', 'realestate', 'other',
] as const;
export type Sector = (typeof SECTORS)[number];

export const STAGES = [
  'bootstrapped', 'pre-seed', 'seed', 'series-a', 'series-b', 'series-c-plus',
  'public', 'acquired', 'inactive', 'unknown',
] as const;
export type Stage = (typeof STAGES)[number];

/**
 * Mumbai sub-regions for the Area facet. `unknown` is load-bearing: YC only
 * reports state-level location for most Maharashtra companies, so pretending
 * to know the neighbourhood would be fabrication.
 */
export const AREAS = [
  'south-mumbai', 'lower-parel-worli', 'bandra-khar-santacruz',
  'andheri-jogeshwari', 'powai-vikhroli', 'goregaon-malad-kandivali',
  'borivali-dahisar', 'central-mumbai', 'navi-mumbai', 'thane', 'unknown',
] as const;
export type Area = (typeof AREAS)[number];

/**
 * How much to trust `lat`/`lng`.
 *  exact         - a street address we resolved
 *  neighbourhood - we know the locality, not the building
 *  city          - we only know "Mumbai"
 *  state         - source said "Maharashtra"; could even be Pune
 */
export type GeoPrecision = 'exact' | 'neighbourhood' | 'city' | 'state';

export interface Geo {
  lat: number;
  lng: number;
  precision: GeoPrecision;
  /** e.g. "yc-oss", "nominatim", "manual". */
  source: string;
  /** ISO-8601 date this coordinate was last confirmed by a human. */
  verifiedAt: string | null;
}

export interface Company {
  id: string;
  name: string;
  kind: Kind;
  tagline: string;
  description?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  /** Link back to the YC profile when the record came from YC. */
  sourceUrl?: string;

  sector: Sector;
  stage: Stage;
  tags: string[];

  /** Free-text locality as curated, e.g. "Lower Parel". Absent until verified. */
  neighbourhood?: string;
  address?: string;
  area: Area;
  geo: Geo;

  foundedYear?: number;
  teamSize?: number;
  /** YC batch, e.g. "W21". Only set for YC companies. */
  batch?: string;
  status?: 'active' | 'inactive' | 'acquired' | 'public';

  /** Provenance -- every record must say where it came from. */
  source: string;
  /** True only once a human has confirmed BOTH the company and its location. */
  verified: boolean;
}

export interface Dataset {
  version: number;
  generatedAt: string | null;
  /** Human-readable notes about known gaps in this dataset. */
  caveats: string[];
  companies: Company[];
}

export interface Filters {
  query: string;
  kinds: Kind[];
  sectors: Sector[];
  stages: Stage[];
  areas: Area[];
  batches: string[];
  hideInactive: boolean;
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  kinds: [],
  sectors: [],
  stages: [],
  areas: [],
  batches: [],
  hideInactive: false,
};
