import React, { useState, useMemo } from 'react';
import { MapPin, Calendar, Sprout, Layers, Mountain, CheckCircle2, Sliders, Search, Compass, Loader2 } from 'lucide-react';

export function CommandSidebar({
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
  selectedCrop,
  setSelectedCrop,
  selectedCropStage,
  setSelectedCropStage,
  onGenerateIntelligence,
  supportedCrops,
  language,
  t
}) {
  // Search query states for filtering location options
  const [districtSearch, setDistrictSearch] = useState('');
  const [blockSearch, setBlockSearch] = useState('');
  const [panchayatSearch, setPanchayatSearch] = useState('');

  // 1. Dynamic States List
  const states = useMemo(() => {
    if (locationsData?.states) return locationsData.states;
    if (locationsData?.districts) {
      return [{
        id: 'maharashtra',
        name: locationsData.state || 'Maharashtra',
        state_code: locationsData.state_code || 'MH',
        districts: locationsData.districts
      }];
    }
    return [];
  }, [locationsData]);

  // Current selected State object
  const currentStateObj = useMemo(() => {
    return states.find(
      (s) => s.id.toLowerCase() === (selectedState || 'maharashtra').toLowerCase()
    ) || states[0];
  }, [states, selectedState]);

  // 2. Dynamic District List & Filtering for selected state
  const districts = useMemo(() => currentStateObj?.districts || [], [currentStateObj]);

  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return districts;
    const query = districtSearch.toLowerCase();
    return districts.filter(d => d.name.toLowerCase().includes(query) || d.id.toLowerCase().includes(query));
  }, [districts, districtSearch]);

  // Current selected District object
  const currentDistrictObj = useMemo(() => {
    return districts.find(
      (d) => d.id.toLowerCase() === selectedDistrict.toLowerCase() || d.name.toLowerCase() === selectedDistrict.toLowerCase()
    ) || districts[0];
  }, [districts, selectedDistrict]);

  // 3. Dynamic Block/Taluka List & Filtering (Strictly for selected District/City)
  const blocks = useMemo(() => currentDistrictObj?.blocks || [], [currentDistrictObj]);

  const filteredBlocks = useMemo(() => {
    if (!blockSearch.trim()) return blocks;
    const query = blockSearch.toLowerCase();
    return blocks.filter(b => b.name.toLowerCase().includes(query) || b.id.toLowerCase().includes(query));
  }, [blocks, blockSearch]);

  // Current selected Block object
  const currentBlockObj = useMemo(() => {
    return blocks.find(
      (b) => b.id.toLowerCase() === selectedBlock.toLowerCase() || b.name.toLowerCase() === selectedBlock.toLowerCase()
    ) || blocks[0];
  }, [blocks, selectedBlock]);

  // 4. Dynamic Panchayat/Area/Village List & Filtering (Strictly for selected Taluka/Block)
  const panchayats = useMemo(() => currentBlockObj?.panchayats || [], [currentBlockObj]);

  const filteredPanchayats = useMemo(() => {
    if (!panchayatSearch.trim()) return panchayats;
    const query = panchayatSearch.toLowerCase();
    return panchayats.filter(p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query));
  }, [panchayats, panchayatSearch]);

  // Current selected Panchayat/Area object
  const currentPanchayatObj = useMemo(() => {
    return panchayats.find(
      (p) => p.id.toLowerCase() === selectedPanchayat.toLowerCase() || p.name.toLowerCase() === selectedPanchayat.toLowerCase()
    ) || panchayats[0];
  }, [panchayats, selectedPanchayat]);

  // Handle State Change -> reset district, block, and panchayat to 1st available options
  const handleStateChange = (stId) => {
    if (setSelectedState) setSelectedState(stId);
    setDistrictSearch('');
    setBlockSearch('');
    setPanchayatSearch('');

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

  // Handle District Change -> reset block to 1st block of new district, and panchayat to 1st panchayat of new block
  const handleDistrictChange = (distId) => {
    setSelectedDistrict(distId);
    setDistrictSearch('');
    setBlockSearch('');
    setPanchayatSearch('');

    const dObj = districts.find((d) => d.id === distId);
    if (dObj && dObj.blocks && dObj.blocks.length > 0) {
      const newBlockId = dObj.blocks[0].id;
      setSelectedBlock(newBlockId);
      if (dObj.blocks[0].panchayats && dObj.blocks[0].panchayats.length > 0) {
        setSelectedPanchayat(dObj.blocks[0].panchayats[0].id);
      }
    }
  };

  // Handle Block Change -> reset panchayat to 1st panchayat of new block
  const handleBlockChange = (blkId) => {
    setSelectedBlock(blkId);
    setBlockSearch('');
    setPanchayatSearch('');

    const bObj = blocks.find((b) => b.id === blkId);
    if (bObj && bObj.panchayats && bObj.panchayats.length > 0) {
      setSelectedPanchayat(bObj.panchayats[0].id);
    }
  };

  const handlePanchayatChange = (panchId) => {
    setSelectedPanchayat(panchId);
    setPanchayatSearch('');
  };

  const cropList = supportedCrops.length > 0 ? supportedCrops : [
    { id: 'soybean', name: 'Soybean', marathi_name: 'सोयाबीन', hindi_name: 'सोयाबीन' },
    { id: 'rice', name: 'Rice (Paddy)', marathi_name: 'भात', hindi_name: 'धान' },
    { id: 'maize', name: 'Maize (Corn)', marathi_name: 'मका', hindi_name: 'मक्का' },
    { id: 'cotton', name: 'Cotton', marathi_name: 'कापूस', hindi_name: 'कपास' },
    { id: 'bajra', name: 'Bajra (Millet)', marathi_name: 'बाजरी', hindi_name: 'बाजरा' },
  ];

  const periods = [7, 14, 21, 30];

  const currentElevation = currentPanchayatObj?.elevation_m ?? 570;
  const currentTerrain = currentPanchayatObj?.terrain_type || "Deccan Plateau Slope";

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs p-4 space-y-4 font-sans">
      {/* Sidebar Header */}
      <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-agri-secondary flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-agri-primary shrink-0" />
          <span>{t.select_location}</span>
        </h3>
        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold border border-emerald-300">
          DYNAMIC CASCADING
        </span>
      </div>

      {/* Loading state indicator if location data fetching */}
      {!locationsData && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-agri-primary" />
          <span>Loading location dataset...</span>
        </div>
      )}

      {/* 1. Fully Dynamic Cascading Location Selector Hierarchy */}
      <div className="space-y-3 text-xs">

        {/* Level 1: State */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="state-select" className="font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-agri-primary shrink-0" />
              <span>1. State (राज्य)</span>
            </label>
            <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
              {states.length} States
            </span>
          </div>

          <select
            id="state-select"
            value={currentStateObj?.id || selectedState || 'maharashtra'}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full bg-emerald-50/70 border-2 border-agri-primary rounded px-2.5 py-1.5 font-extrabold text-agri-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
          >
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.state_code || 'IN'})
              </option>
            ))}
          </select>
        </div>

        {/* Level 2: District / City */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="district-select" className="font-bold text-slate-800">
              2. District / City (जिल्हा / शहर)
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {districts.length} Locations
            </span>
          </div>

          {/* Optional Search Filter Input */}
          <div className="relative mb-1">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2.5" />
            <input
              type="text"
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              placeholder="Search district or city..."
              className="w-full bg-slate-50 border border-slate-300 rounded pl-7 pr-2 py-1 text-[11px] text-slate-800 focus:bg-white focus:ring-1 focus:ring-agri-primary"
            />
          </div>

          <select
            id="district-select"
            value={currentDistrictObj?.id || selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full bg-white border-2 border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900 focus:border-agri-primary focus:ring-1 focus:ring-agri-primary cursor-pointer"
          >
            {filteredDistricts.length === 0 ? (
              <option value="" disabled>No districts match search</option>
            ) : (
              filteredDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Level 3: Taluka / Block (Filtered strictly by selected District) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="block-select" className="font-bold text-slate-800">
              3. Taluka / Block (तालुका / ब्लॉक)
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {blocks.length} Talukas
            </span>
          </div>

          {/* Optional Search Filter Input */}
          <div className="relative mb-1">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2.5" />
            <input
              type="text"
              value={blockSearch}
              onChange={(e) => setBlockSearch(e.target.value)}
              placeholder={`Search in ${currentDistrictObj?.name || 'District'}...`}
              className="w-full bg-slate-50 border border-slate-300 rounded pl-7 pr-2 py-1 text-[11px] text-slate-800 focus:bg-white focus:ring-1 focus:ring-agri-primary"
            />
          </div>

          <select
            id="block-select"
            value={currentBlockObj?.id || selectedBlock}
            onChange={(e) => handleBlockChange(e.target.value)}
            className="w-full bg-white border-2 border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900 focus:border-agri-primary focus:ring-1 focus:ring-agri-primary cursor-pointer"
          >
            {filteredBlocks.length === 0 ? (
              <option value="" disabled>No talukas match search</option>
            ) : (
              filteredBlocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.name.toLowerCase().includes('urban') || b.name.toLowerCase().includes('core') ? '' : 'Taluka'}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Level 4: Area / Village / Gram Panchayat (Filtered strictly by selected Taluka) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="panchayat-select" className="font-bold text-slate-800">
              4. Area / Village / Panchayat (गाव / भाग)
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {panchayats.length} Local Areas
            </span>
          </div>

          {/* Search Filter Input */}
          <div className="relative mb-1">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2.5" />
            <input
              type="text"
              value={panchayatSearch}
              onChange={(e) => setPanchayatSearch(e.target.value)}
              placeholder={`Search village/area in ${currentBlockObj?.name || 'Taluka'}...`}
              className="w-full bg-slate-50 border border-slate-300 rounded pl-7 pr-2 py-1 text-[11px] text-slate-800 focus:bg-white focus:ring-1 focus:ring-agri-primary"
            />
          </div>

          <select
            id="panchayat-select"
            value={currentPanchayatObj?.id || selectedPanchayat}
            onChange={(e) => handlePanchayatChange(e.target.value)}
            className="w-full bg-white border-2 border-slate-300 rounded px-2.5 py-1.5 font-extrabold text-slate-900 focus:border-agri-primary focus:ring-1 focus:ring-agri-primary cursor-pointer"
          >
            {filteredPanchayats.length === 0 ? (
              <option value="" disabled>No villages/areas match search</option>
            ) : (
              filteredPanchayats.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.elevation_m}m AMSL)
                </option>
              ))
            )}
          </select>
        </div>

        {/* 🏔️ Dynamic Micro-Catchment Metadata Card (Auto Updates with Selection) */}
        <div className="bg-slate-50 border border-slate-300 rounded-md p-2.5 text-[11px] space-y-1.5 text-slate-700">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold text-slate-600">
              <Mountain className="w-3.5 h-3.5 text-agri-primary shrink-0" />
              Elevation (उंची):
            </span>
            <strong className="text-slate-900 font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {currentElevation} m AMSL
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold text-slate-600">
              <Compass className="w-3.5 h-3.5 text-agri-secondary shrink-0" />
              Terrain Type (भूभाग):
            </span>
            <span className="text-emerald-900 font-extrabold bg-emerald-100/80 px-2 py-0.5 rounded text-[10px] border border-emerald-300 truncate max-w-[140px]">
              {currentTerrain}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Forecast Window Selector */}
      <div className="border-t border-slate-200 pt-3">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-agri-secondary shrink-0" />
          <span>{t.forecast_window}</span>
        </label>
        <div className="grid grid-cols-4 gap-1">
          {periods.map((d) => {
            const active = forecastDays === d;
            return (
              <button
                key={d}
                onClick={() => setForecastDays(d)}
                className={`py-1.5 text-xs font-extrabold rounded border transition text-center cursor-pointer ${
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
          <Sprout className="w-3.5 h-3.5 text-agri-primary shrink-0" />
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
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded border transition flex items-center justify-between cursor-pointer ${
                  active
                    ? 'bg-agri-primary text-white border-agri-primary font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
                }`}
              >
                <span>{displayName}</span>
                {active && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Crop Growth Stage */}
      <div className="border-t border-slate-200 pt-3">
        <label htmlFor="stage-select" className="block text-xs font-bold text-slate-700 mb-1">
          Crop Stage (पिकाची अवस्था)
        </label>
        <select
          id="stage-select"
          value={selectedCropStage || 'sowing'}
          onChange={(e) => setSelectedCropStage && setSelectedCropStage(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 text-xs focus:ring-1 focus:ring-agri-primary cursor-pointer"
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
          className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-extrabold text-xs py-2.5 px-3 rounded shadow-xs transition flex items-center justify-center gap-1.5 border border-amber-400 cursor-pointer"
        >
          <span>⚡ Generate Intelligence</span>
        </button>
      </div>
    </div>
  );
}
