import React from 'react';
import { MapPin, Calendar, Check } from 'lucide-react';

export function LocationSelector({
  locationsData,
  selectedDistrict,
  setSelectedDistrict,
  selectedBlock,
  setSelectedBlock,
  selectedPanchayat,
  setSelectedPanchayat,
  forecastDays,
  setForecastDays,
  t
}) {
  const districts = locationsData?.districts || [];
  const currentDistrictObj = districts.find(
    (d) => d.id === selectedDistrict || d.name.toLowerCase() === selectedDistrict.toLowerCase()
  ) || districts[0];

  const blocks = currentDistrictObj?.blocks || [];
  const currentBlockObj = blocks.find(
    (b) => b.id === selectedBlock || b.name.toLowerCase() === selectedBlock.toLowerCase()
  ) || blocks[0];

  const panchayats = currentBlockObj?.panchayats || [];

  const handleDistrictChange = (distId) => {
    setSelectedDistrict(distId);
    const dObj = districts.find((d) => d.id === distId);
    if (dObj && dObj.blocks && dObj.blocks.length > 0) {
      setSelectedBlock(dObj.blocks[0].id);
      if (dObj.blocks[0].panchayats && dObj.blocks[0].panchayats.length > 0) {
        setSelectedPanchayat(dObj.blocks[0].panchayats[0].id);
      }
    }
  };

  const handleBlockChange = (blkId) => {
    setSelectedBlock(blkId);
    const bObj = blocks.find((b) => b.id === blkId);
    if (bObj && bObj.panchayats && bObj.panchayats.length > 0) {
      setSelectedPanchayat(bObj.panchayats[0].id);
    }
  };

  const periods = [7, 14, 21, 30];

  return (
    <div className="bg-white border border-gov-border rounded-md shadow-xs p-4 mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* State Badge */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t.state}
          </label>
          <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Maharashtra
          </div>
        </div>

        {/* District Select */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            {t.district}
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-gov-blue focus:border-gov-blue"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Block Select */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            {t.block}
          </label>
          <select
            value={selectedBlock}
            onChange={(e) => handleBlockChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-gov-blue focus:border-gov-blue"
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Panchayat / Village Select */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
            {t.panchayat}
          </label>
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-emerald-600 absolute left-2 pointer-events-none" />
            <select
              value={selectedPanchayat}
              onChange={(e) => setSelectedPanchayat(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded pl-7 pr-2.5 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-gov-blue focus:border-gov-blue"
            >
              {panchayats.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Elev: {p.elevation_m}m)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Forecast Period Window Buttons */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {t.forecast_window}
          </label>
          <div className="grid grid-cols-4 gap-1">
            {periods.map((d) => {
              const active = forecastDays === d;
              return (
                <button
                  key={d}
                  onClick={() => setForecastDays(d)}
                  className={`py-1.5 text-xs font-semibold rounded border transition text-center ${
                    active
                      ? 'bg-gov-blue text-white border-gov-blue shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {d}D
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
