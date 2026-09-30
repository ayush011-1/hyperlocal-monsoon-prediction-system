import React from 'react';
import { MapPin, Calendar, Check } from 'lucide-react';

export function LocationSelector({
  locationsData,
  selectedState,
  setSelectedState,
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
  const states = locationsData?.states || [
    { id: 'maharashtra', name: locationsData?.state || 'Maharashtra', districts: locationsData?.districts || [] }
  ];

  const currentStateObj = states.find(
    (s) => s.id.toLowerCase() === (selectedState || 'maharashtra').toLowerCase()
  ) || states[0];

  const districts = currentStateObj?.districts || [];
  const currentDistrictObj = districts.find(
    (d) => d.id === selectedDistrict || d.name.toLowerCase() === selectedDistrict.toLowerCase()
  ) || districts[0];

  const blocks = currentDistrictObj?.blocks || [];
  const currentBlockObj = blocks.find(
    (b) => b.id === selectedBlock || b.name.toLowerCase() === selectedBlock.toLowerCase()
  ) || blocks[0];

  const panchayats = currentBlockObj?.panchayats || [];

  const handleStateChange = (stId) => {
    if (setSelectedState) setSelectedState(stId);
    const sObj = states.find((s) => s.id === stId);
    if (sObj && sObj.districts && sObj.districts.length > 0) {
      const newDistId = sObj.districts[0].id;
      setSelectedDistrict(newDistId);
      if (sObj.districts[0].blocks && sObj.districts[0].blocks.length > 0) {
        const newBlockId = sObj.districts[0].blocks[0].id;
        setSelectedBlock(newBlockId);
        if (sObj.districts[0].blocks[0].panchayats && sObj.districts[0].blocks[0].panchayats.length > 0) {
          setSelectedPanchayat(sObj.districts[0].blocks[0].panchayats[0].id);
        }
      }
    }
  };

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
        {/* State Select */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t.state}
          </label>
          <select
            value={currentStateObj?.id || selectedState || 'maharashtra'}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full bg-emerald-50 border border-emerald-300 rounded px-2.5 py-1.5 text-sm font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
