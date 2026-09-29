import React from 'react';
import { CloudRain, Sun, CloudLightning, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export function ProbabilitiesCard({ forecastData, forecastDays, selectedLocationName, t }) {
  const probs = forecastData?.probabilities || {
    monsoon_onset: 82,
    break_dry_spell: 21,
    heavy_rainfall: 36
  };

  const onset = probs.monsoon_onset;
  const breakRisk = probs.break_dry_spell;
  const heavy = probs.heavy_rainfall;
  const status = forecastData?.overall_risk_status || "Moderate - Favorable Onset Surge";
  const confidence = forecastData?.confidence_level || 88;
  const explanation = forecastData?.explanation || "";

  // Color coding based on risk and agronomic thresholds
  const getOnsetTheme = (val) => {
    if (val >= 70) return { bg: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-600', border: 'border-emerald-200', tag: 'High Likelihood' };
    if (val >= 45) return { bg: 'bg-blue-50', text: 'text-blue-800', bar: 'bg-blue-600', border: 'border-blue-200', tag: 'Moderate Likelihood' };
    return { bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-600', border: 'border-amber-200', tag: 'Low Likelihood' };
  };

  const getBreakTheme = (val) => {
    if (val >= 40) return { bg: 'bg-red-50', text: 'text-red-800', bar: 'bg-red-600', border: 'border-red-200', tag: 'Elevated Stress' };
    if (val >= 25) return { bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-500', border: 'border-amber-200', tag: 'Moderate Stress' };
    return { bg: 'bg-slate-50', text: 'text-slate-800', bar: 'bg-emerald-600', border: 'border-slate-200', tag: 'Low Risk' };
  };

  const getHeavyTheme = (val) => {
    if (val >= 40) return { bg: 'bg-purple-50', text: 'text-purple-800', bar: 'bg-purple-600', border: 'border-purple-200', tag: 'High Warning' };
    if (val >= 25) return { bg: 'bg-sky-50', text: 'text-sky-800', bar: 'bg-sky-600', border: 'border-sky-200', tag: 'Moderate Alert' };
    return { bg: 'bg-slate-50', text: 'text-slate-800', bar: 'bg-slate-400', border: 'border-slate-200', tag: 'Nominal' };
  };

  const onsetTheme = getOnsetTheme(onset);
  const breakTheme = getBreakTheme(breakRisk);
  const heavyTheme = getHeavyTheme(heavy);

  return (
    <div className="bg-white border border-gov-border rounded-md shadow-xs p-5 mb-5">
      {/* Top Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t.probabilities_title}
          </span>
          <h2 className="text-base font-bold text-slate-800">
            {selectedLocationName} • <span className="text-gov-blue">{forecastDays}-Day Forecast Horizon</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded text-xs">
            <span className="text-slate-500 font-medium">{t.confidence}:</span>
            <span className="font-bold text-slate-800">{confidence}%</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-100/80 border border-emerald-300 px-3 py-1 rounded text-xs font-semibold text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>{status}</span>
          </div>
        </div>
      </div>

      {/* 3 Core Probability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Onset Card */}
        <div className={`p-4 rounded border ${onsetTheme.border} ${onsetTheme.bg}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-emerald-700" />
              <span className="text-xs font-bold text-slate-700 uppercase">
                {t.onset_prob}
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/80 border border-slate-300 text-slate-700">
              {onsetTheme.tag}
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className={`text-3xl font-extrabold ${onsetTheme.text}`}>
              {onset}%
            </span>
            <span className="text-xs text-slate-600 font-medium">probability</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
            <div className={`h-2 rounded-full ${onsetTheme.bar}`} style={{ width: `${onset}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-600 leading-tight">
            Likelihood of sustained convective surge delivering &gt;50mm cumulative wetting rain.
          </p>
        </div>

        {/* Break / Dry Spell Card */}
        <div className={`p-4 rounded border ${breakTheme.border} ${breakTheme.bg}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-bold text-slate-700 uppercase">
                {t.break_prob}
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/80 border border-slate-300 text-slate-700">
              {breakTheme.tag}
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className={`text-3xl font-extrabold ${breakTheme.text}`}>
              {breakRisk}%
            </span>
            <span className="text-xs text-slate-600 font-medium">risk estimate</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
            <div className={`h-2 rounded-full ${breakTheme.bar}`} style={{ width: `${breakRisk}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-600 leading-tight">
            Probability of an extended dry hiatus (&gt;7 consecutive rainless days) during the window.
          </p>
        </div>

        {/* Heavy Rainfall Card */}
        <div className={`p-4 rounded border ${heavyTheme.border} ${heavyTheme.bg}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CloudLightning className="w-5 h-5 text-purple-700" />
              <span className="text-xs font-bold text-slate-700 uppercase">
                {t.heavy_prob}
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/80 border border-slate-300 text-slate-700">
              {heavyTheme.tag}
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className={`text-3xl font-extrabold ${heavyTheme.text}`}>
              {heavy}%
            </span>
            <span className="text-xs text-slate-600 font-medium">episode chance</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
            <div className={`h-2 rounded-full ${heavyTheme.bar}`} style={{ width: `${heavy}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-600 leading-tight">
            Probability of 24-hour localized torrential rainfall exceeding 64.5 mm (IMD Heavy Rain criteria).
          </p>
        </div>
      </div>

      {/* Simple Plain-English Explanation Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-gov-blue shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="font-semibold text-slate-900 mr-1">Forecast Interpretation:</strong>
          {explanation}
        </div>
      </div>
    </div>
  );
}
