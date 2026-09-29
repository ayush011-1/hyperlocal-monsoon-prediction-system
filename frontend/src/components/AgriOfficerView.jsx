import React, { useState } from 'react';
import { UserCheck, PlusCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { GisMap } from './GisMap';
import { FieldValidationModal } from './FieldValidationModal';

export function AgriOfficerView({
  locationsData,
  gisFeatures,
  selectedLocationName,
  observations,
  onRefreshObservations,
  selectedDistrict,
  selectedBlock,
  selectedPanchayat,
  t
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const districtRiskMatrix = [
    { district: "Pune",        taluka: "Haveli / Baramati",   onset: "82%", brk: "21%", heavy: "36%", risk: "Optimal Sowing",       badge: "bg-emerald-100 text-emerald-900 border-emerald-400", advisory: "Proceed with Soybean & Bajra sowing on receiving 50mm wetting rain." },
    { district: "Nashik",      taluka: "Dindori / Niphad",    onset: "78%", brk: "19%", heavy: "42%", risk: "Heavy Rain Alert",      badge: "bg-purple-100 text-purple-900 border-purple-400",   advisory: "Clear onion nursery furrows; delay spraying operations." },
    { district: "Ahilyanagar", taluka: "Sangamner / Rahata",  onset: "56%", brk: "44%", heavy: "16%", risk: "Dry Spell Risk",        badge: "bg-amber-100 text-amber-900 border-amber-400",      advisory: "Rain-shadow zone. Maintain farm-pond reserves as backup." },
    { district: "Satara",      taluka: "Karad / Wai",         onset: "85%", brk: "15%", heavy: "51%", risk: "High Moisture Surge",   badge: "bg-sky-100 text-sky-900 border-sky-400",            advisory: "Ghats orographic surge active. Favorable for paddy nursery." },
    { district: "Kolhapur",    taluka: "Karveer / Shirol",    onset: "89%", brk: "12%", heavy: "62%", risk: "Flood Alert Lowlands",  badge: "bg-red-100 text-red-900 border-red-400",            advisory: "Panchganga basin inundation risk. Protect lower sugarcane." },
    { district: "Solapur",     taluka: "Pandharpur / Barshi", onset: "48%", brk: "52%", heavy: "12%", risk: "Severe Moisture Deficit",badge: "bg-red-100 text-red-900 border-red-400",            advisory: "Delay dry sowing. Wait for second surge before seeding." }
  ];

  return (
    <div className="space-y-4">
      {/* Officer Portal Banner */}
      <div className="bg-agri-secondary text-white px-4 py-3 rounded-md shadow-xs border-b-2 border-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 border border-white/20 rounded">
            <UserCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">{t.officer_portal}</h2>
            <p className="text-xs text-slate-400">
              Circle & Taluka Spatial Surveillance • Ground-Truth Validation • Field Audit
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-3.5 py-2 rounded text-xs transition flex items-center gap-1.5 shadow-sm border border-amber-300"
        >
          <PlusCircle className="w-4 h-4" />
          {t.submit_observation_btn}
        </button>
      </div>

      {/* Embedded GIS Map */}
      <GisMap gisFeatures={gisFeatures} selectedLocationName={selectedLocationName} t={t} />

      {/* Multi-Location Comparative Risk Table */}
      <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
        <div className="bg-agri-secondary text-white px-4 py-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              REGIONAL RISK MATRIX
            </span>
            <h3 className="text-sm font-extrabold">{t.officer_summary_title} — Maharashtra 14-Day Synthesis</h3>
          </div>
          <span className="text-xs font-mono bg-[#081827] text-emerald-300 px-2 py-1 rounded border border-slate-700">
            {new Date().toLocaleDateString('en-IN')}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b-2 border-slate-300">
              <tr>
                <th className="px-3 py-2 border-r border-slate-200">District</th>
                <th className="px-3 py-2 border-r border-slate-200">Block / Taluka</th>
                <th className="px-3 py-2 text-center border-r border-slate-200">Onset</th>
                <th className="px-3 py-2 text-center border-r border-slate-200">Break Risk</th>
                <th className="px-3 py-2 text-center border-r border-slate-200">Heavy Rain</th>
                <th className="px-3 py-2 border-r border-slate-200">Risk Class</th>
                <th className="px-3 py-2">Officer Advisory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {districtRiskMatrix.map((row, idx) => (
                <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition`}>
                  <td className="px-3 py-2 font-extrabold text-agri-secondary border-r border-slate-200">{row.district}</td>
                  <td className="px-3 py-2 text-slate-700 border-r border-slate-200">{row.taluka}</td>
                  <td className="px-3 py-2 text-center font-black text-emerald-700 border-r border-slate-200">{row.onset}</td>
                  <td className="px-3 py-2 text-center font-black text-amber-700 border-r border-slate-200">{row.brk}</td>
                  <td className="px-3 py-2 text-center font-black text-purple-700 border-r border-slate-200">{row.heavy}</td>
                  <td className="px-3 py-2 border-r border-slate-200">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${row.badge}`}>
                      {row.risk}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.advisory}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Field Observations Log */}
      <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
        <div className="bg-agri-secondary text-white px-4 py-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              GROUND TRUTH AUDIT LOG
            </span>
            <h3 className="text-sm font-extrabold">{t.ground_truth_records}</h3>
          </div>
          <span className="text-xs bg-emerald-700 text-white font-bold px-2 py-1 rounded">
            {observations.length} Records
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {observations.map((obs) => (
            <div key={obs.id} className="px-4 py-3 hover:bg-slate-50 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-extrabold text-slate-900">
                      {obs.panchayat}, {obs.block} — {obs.district}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">{obs.date}</span>
                    <span className="bg-agri-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {obs.observed_rainfall_mm} mm
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      obs.status === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {obs.status === 'Verified' ? '✓ Verified' : '⏳ ' + obs.status}
                    </span>
                    {obs.has_photo && (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        📷 Geo-photo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Rain Condition:</strong> {obs.rainfall_condition} | <strong>Crop:</strong> {obs.crop_condition}
                  </div>
                  <div className="text-xs text-slate-500 italic mt-0.5">"{obs.remarks}"</div>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <div className="font-bold text-slate-800">{obs.officer_name}</div>
                  <div className="text-slate-400 text-[10px]">ID: {obs.id}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FieldValidationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locationsData={locationsData}
        currentDistrict={selectedDistrict}
        currentBlock={selectedBlock}
        currentPanchayat={selectedPanchayat}
        onObservationAdded={onRefreshObservations}
        t={t}
      />
    </div>
  );
}
