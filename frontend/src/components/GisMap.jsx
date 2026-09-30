import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icon path issue in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const awsIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#0f2942;color:white;border:2px solid #eab308;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-size:11px;font-weight:900;">⚑</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.flyTo(center, zoom || 12, { duration: 1.2 });
    }
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
}

export function GisMap({ gisFeatures, selectedLocationName, t }) {
  const center = gisFeatures?.center || [18.5204, 73.8567];
  const zoom = gisFeatures?.zoom || 12;
  const zones = gisFeatures?.zones || [];
  const stations = gisFeatures?.stations || [];

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
      {/* Map Section Header — Bulletin-style */}
      <div className="bg-agri-secondary text-white px-4 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            GIS AGROMET ZONING MAP
          </span>
          <h3 className="text-sm font-extrabold text-white">
            {selectedLocationName} — Micro-Catchment Risk Atlas
          </h3>
        </div>
        <div className="text-xs font-mono bg-[#081827] text-emerald-300 px-2 py-1 rounded border border-slate-700">
          OSM / IMD 5km Grid
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="h-80 sm:h-96 w-full relative">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <RecenterMap center={center} zoom={zoom} />

          {/* OpenStreetMap tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Selected village primary pin */}
          <Marker position={center}>
            <Popup>
              <div className="text-xs p-1">
                <strong className="text-agri-secondary text-sm block mb-1">{selectedLocationName}</strong>
                <p className="text-slate-600 mb-1">Block HQ / Panchayat Node</p>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                  Target Location
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Risk zones */}
          {zones.map((zone) => {
            const rad = zone.radius_meters || zone.radius_m || 5000;
            return (
              <Circle
                key={zone.id}
                center={zone.center || center}
                radius={rad}
                pathOptions={{
                  color: zone.color || '#16a34a',
                  fillColor: zone.fillColor || zone.color || '#22c55e',
                  fillOpacity: zone.fillOpacity || 0.18,
                  weight: 2.5,
                  dashArray: zone.type === 'heavy_rain_risk' || zone.type === 'water_deficit_risk' ? '6 4' : null
                }}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-slate-900 block mb-1">{zone.name}</strong>
                    <p className="text-slate-600 mb-1">{zone.description}</p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Radius: {(rad / 1000).toFixed(1)} km
                    </span>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* AWS/Rain-gauge stations */}
          {stations.map((stn) => (
            <Marker key={stn.id} position={[stn.lat, stn.lng]} icon={awsIcon}>
              <Popup>
                <div className="text-xs p-1 space-y-1">
                  <strong className="text-agri-secondary block border-b pb-1">{stn.name}</strong>
                  <div className="flex justify-between gap-3 text-slate-700">
                    <span>24h Rainfall:</span>
                    <strong>{stn.last_24h_rainfall_mm ?? stn.rainfall_24h_mm ?? 0} mm</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-700">
                    <span>Temp / RH:</span>
                    <span>{stn.temp_c}°C / {stn.rh_pct ?? stn.humidity_pct ?? 70}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono pt-1">IMD AWS Network</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Symbology Legend */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex flex-wrap items-center gap-4 text-xs text-slate-700">
        <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">MAP LEGEND:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full border-2 border-emerald-600 bg-emerald-100 block"></span>
          <span>{t.layer_optimal}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full border-2 border-dashed border-red-600 bg-red-100 block"></span>
          <span>{t.layer_risk}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-agri-secondary border-2 border-amber-400 flex items-center justify-center text-white text-[9px] font-black">⚑</span>
          <span>{t.layer_station}</span>
        </div>
        <div className="ml-auto text-[10px] font-mono text-slate-400">
          Lat: {(center && typeof center[0] === 'number' ? center[0] : 18.5204).toFixed(4)}°N | Lng: {(center && typeof center[1] === 'number' ? center[1] : 73.8567).toFixed(4)}°E
        </div>
      </div>
    </div>
  );
}
