import React from 'react';
import { MapPin, Calendar, Sprout, Layers, Mountain, CheckCircle2 } from 'lucide-react';

export function CommandSidebar({
  locationsData,
  selectedDistrict,
  setSelectedDistrict,
  selectedBlock,
  setSelectedBlock,
  selectedPanchayat,
  setSelectedPanchayat,
  forecastDays,
  setForecastDays,
  selectedCrop,
  setSelectedCrop,
  selectedCropStage,
  setSelectedCropStage,
  onGenerateIntelligence,
  supportedCrops,
  language,
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
  const currentPanchayatObj = panchayats.find(
    (p) => p.id === selectedPanchayat || p.name.toLowerCase() === selectedPanchayat.toLowerCase()
  ) || panchayats[0];

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

  const cropList = supportedCrops.length > 0 ? supportedCrops : [
    { id: 'soybean', name: 'Soybean', marathi_name: 'सोयाबीन', hindi_name: 'सोयाबीन' },
    { id: 'rice', name: 'Rice', marathi_name: 'भात', hindi_name: 'धान' },
    { id: 'maize', name: 'Maize', marathi_name: 'मका', hindi_name: 'मक्का' },
    { id: 'cotton', name: 'Cotton', marathi_name: 'कापूस', hindi_name: 'कपास' },
    { id: 'bajra', name: 'Bajra', marathi_name: 'बाजरी', hindi_name: 'बाजरा' },
  ];

  const periods = [7, 14, 21, 30];

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs p-4 space-y-4">
      {/* Sidebar Header */}
      <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-agri-secondary flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-agri-primary" />
          <span>{t.select_location}</span>
        </h3>
        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
          LIVE AGROMET
        </span>
      </div>

      {/* 1. Location Hierarchy Cascading Selectors */}
      <div className="space-y-2.5 text-xs">
        {/* State */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {t.state}
          </label>
          <div className="w-full bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-800 flex items-center justify-between">
            <span>Maharashtra (महाराष्ट्र)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
        </div>

        {/* District */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {t.district}
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-medium text-slate-900 focus:ring-1 focus:ring-agri-primary focus:border-agri-primary"
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Block / Taluka */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {t.block}
          </label>
          <select
            value={selectedBlock}
            onChange={(e) => handleBlockChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-medium text-slate-900 focus:ring-1 focus:ring-agri-primary focus:border-agri-primary"
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} Taluka
              </option>
            ))}
          </select>
        </div>

        {/* Panchayat / Village */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {t.panchayat}
          </label>
          <select
            value={selectedPanchayat}
            onChange={(e) => setSelectedPanchayat(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-medium text-slate-900 focus:ring-1 focus:ring-agri-primary focus:border-agri-primary"
          >
            {panchayats.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.elevation_m}m AMSL)
              </option>
            ))}
          </select>
        </div>

        {/* Micro-Catchment Physical Meta */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] space-y-1 text-slate-600">
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Mountain className="w-3 h-3 text-slate-500" />
              Elevation:
            </span>
            <strong className="text-slate-800 font-mono">{currentPanchayatObj?.elevation_m || 570} m</strong>
          </div>
          <div className="flex justify-between">
            <span>Terrain Lift:</span>
            <span className="text-emerald-700 font-medium">Deccan Plateau Slope</span>
          </div>
        </div>
      </div>

      {/* 2. Forecast Window Selector */}
      <div className="border-t border-slate-200 pt-3">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-agri-secondary" />
          <span>{t.forecast_window}</span>
        </label>
        <div className="grid grid-cols-4 gap-1">
          {periods.map((d) => {
            const active = forecastDays === d;
            return (
              <button
                key={d}
                onClick={() => setForecastDays(d)}
                className={`py-1.5 text-xs font-bold rounded border transition text-center ${
                  active
                    ? 'bg-agri-secondary text-white border-agri-secondary shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {d}D
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Probabilistic ensemble horizon
        </p>
      </div>

      {/* 3. Target Kharif Crop Selection */}
      <div className="border-t border-slate-200 pt-3">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
          <Sprout className="w-3.5 h-3.5 text-agri-primary" />
          <span>{t.select_crop}</span>
        </label>
        <div className="space-y-1">
          {cropList.map((c) => {
            const active = selectedCrop === c.id;
            let displayName = c.name;
            if (language === 'mr' && c.marathi_name) displayName = c.marathi_name;
            if (language === 'hi' && c.hindi_name) displayName = c.hindi_name;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCrop(c.id)}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded border transition flex items-center justify-between ${
                  active
                    ? 'bg-agri-primary text-white border-agri-primary font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
                }`}
              >
                <span>{displayName}</span>
                {active && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Crop Growth Stage */}
      <div className="border-t border-slate-200 pt-3">
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Crop Stage (पिकाची अवस्था)
        </label>
        <select
          value={selectedCropStage || 'sowing'}
          onChange={(e) => setSelectedCropStage && setSelectedCropStage(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-medium text-slate-900 text-xs focus:ring-1 focus:ring-agri-primary"
        >
          <option value="sowing">Pre-sowing / Sowing (पेरणी)</option>
          <option value="germination">Germination / Emergence (अंकुरण)</option>
          <option value="vegetative">Vegetative Growth (वाढ अवस्था)</option>
          <option value="flowering">Flowering / Pod Formation (फुलधारणा)</option>
          <option value="maturity">Maturity / Harvesting (पक्वता / काढणी)</option>
        </select>
      </div>

      {/* Generate Intelligence Action Button */}
      <div className="border-t border-slate-200 pt-3">
        <button
          onClick={() => onGenerateIntelligence && onGenerateIntelligence()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2 px-3 rounded shadow transition flex items-center justify-center gap-1.5 border border-amber-300"
        >
          <span>⚡ Generate Intelligence</span>
        </button>
      </div>
    </div>
  );
}
