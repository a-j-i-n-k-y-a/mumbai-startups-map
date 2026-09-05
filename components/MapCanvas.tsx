'use client';

import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import {
  DEFAULT_ZOOM, MMR_BOUNDS, MUMBAI_CENTER, PRECISION_NOTE,
  SECTOR_COLORS, SECTOR_LABELS, STAGE_LABELS, TILE_ATTRIBUTION, TILE_URL,
} from '@/lib/constants';
import { displayPosition, isApproximate } from '@/lib/geo';
import type { Company } from '@/lib/types';

/** Pans to the selected company without changing zoom, so context is kept. */
function PanToSelection({ companies, selectedId }: {
  companies: Company[]; selectedId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const target = companies.find((c) => c.id === selectedId);
    if (target) map.panTo(displayPosition(target), { animate: true });
  }, [map, companies, selectedId]);
  return null;
}

export default function MapCanvas({ companies, selectedId, onSelect }: {
  companies: Company[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer
      center={MUMBAI_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={9}
      maxZoom={18}
      maxBounds={MMR_BOUNDS}
      maxBoundsViscosity={0.5}
      scrollWheelZoom
      className="map"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <PanToSelection companies={companies} selectedId={selectedId} />

      {companies.map((c) => {
        const color = SECTOR_COLORS[c.sector] ?? SECTOR_COLORS.other;
        const active = c.id === selectedId;
        const approx = isApproximate(c);

        return (
          <CircleMarker
            key={c.id}
            center={displayPosition(c)}
            radius={active ? 11 : 8}
            pathOptions={{
              color: active ? '#0f172a' : color,
              weight: active ? 3 : 2,
              // Hollow ring = we do not actually know where this company sits.
              fillColor: color,
              fillOpacity: approx ? 0.12 : 0.85,
              dashArray: approx ? '3 3' : undefined,
            }}
            eventHandlers={{ click: () => onSelect(c.id) }}
          >
            <Popup>
              <div className="popup">
                <strong className="popup__name">{c.name}</strong>
                {c.batch ? <span className="popup__batch">{c.batch}</span> : null}
                {c.tagline ? <p className="popup__tagline">{c.tagline}</p> : null}
                <p className="popup__meta">
                  {SECTOR_LABELS[c.sector] ?? c.sector} · {STAGE_LABELS[c.stage] ?? c.stage}
                  {c.neighbourhood ? ` · ${c.neighbourhood}` : ''}
                </p>
                {approx ? (
                  <p className="popup__warning">
                    Position approximate — {PRECISION_NOTE[c.geo.precision]}
                  </p>
                ) : null}
                <p className="popup__links">
                  {c.website ? (
                    <a href={c.website} target="_blank" rel="noopener noreferrer">Website</a>
                  ) : null}
                  {c.sourceUrl ? (
                    <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">YC profile</a>
                  ) : null}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
