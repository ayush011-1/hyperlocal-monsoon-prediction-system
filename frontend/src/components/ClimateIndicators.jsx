import React from 'react';
import { Waves, Globe2, Wind, AlertCircle } from 'lucide-react';

const ICONS = { enso: Waves, iod: Globe2, mjo: Wind };
const COLORS = {
  enso: { bar: 'bg-sky-700', text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-300' },
  iod:  { bar: 'bg-agri-primary', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  mjo:  { bar: 'bg-indigo-700', text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-300' },
};

export function ClimateIndicators({ climateData, t }) {
  const indicators = climateData?.indicators || [];

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
      {/* Bulletin Header */}
      <div className="bg-agri-secondary text-white px-4 py-2.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              SYNOPTIC TELECONNECTION INDICES
            </span>
            <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded">
              OPERATIONAL FEED
            </span>
          </div>
          <h3 className="text-sm font-extrabold">{t.climate_title}</h3>
        </div>
        <div className="text-xs font-mono bg-[#081827] text-emerald-300 px-2 py-1 rounded border border-slate-700">
          NOAA / BOM / IMD
        </div>
      </div>

      <div className="p-4">
        {/* Helper note */}
        <div className="bg-blue-50 border-l-4 border-agri-secondary p-2.5 mb-3 text-xs text-slate-700 rounded-r">
          <strong>Conceptual Integration:</strong> {t.climate_note}
        </div>

        {/* 3-Column Indicator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {indicators.map((ind) => {
            const Icon = ICONS[ind.id] || Globe2;
            const clr = COLORS[ind.id] || COLORS.iod;

            return (
              <div key={ind.id} className={`border ${clr.border} rounded overflow-hidden`}>
                {/* Card Header Row */}
                <div className={`${clr.bg} px-3 py-2 border-b ${clr.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${clr.text}`} />
                    <span className={`text-xs font-black uppercase tracking-wider ${clr.text}`}>
                      {ind.id.toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${clr.text} bg-white border ${clr.border} px-2 py-0.5 rounded`}>
                    {ind.current_value}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-3 bg-white space-y-2">
                  <div className="text-xs font-bold text-slate-900">
                    {ind.status}
                  </div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    {ind.description}
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 text-[11px]">
                    <span className="font-semibold text-slate-700">Monsoon Impact: </span>
                    <span className="text-slate-600">{ind.impact_on_monsoon}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 italic leading-relaxed">
                    <strong>Model Input:</strong> {ind.input_to_model}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
