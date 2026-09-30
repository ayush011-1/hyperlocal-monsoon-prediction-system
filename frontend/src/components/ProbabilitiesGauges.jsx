import React from 'react';
import { CloudRain, Sun, CloudLightning, ShieldCheck, AlertCircle, Info } from 'lucide-react';

function CircularGauge({ value, label, sublabel, colorClass, strokeColor, statusTag }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="bg-white border border-slate-300 rounded p-3 text-center flex flex-col items-center justify-between shadow-2xs">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
        {label}
      </div>

      {/* SVG Radial Gauge */}
      <div className="relative w-24 h-24 my-1 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="text-slate-100"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Active Value Arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="gauge-circle"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={strokeColor}
            fill="transparent"
          />
        </svg>

        {/* Center Percentage Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {value}%
          </span>
          <span className="text-[9px] uppercase font-bold text-slate-500">
            PROBABILITY
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-1 w-full">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass} w-full`}>
          {statusTag}
        </span>
        <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">
          {sublabel}
        </p>
      </div>
    </div>
  );
}

export function ProbabilitiesGauges({ forecastData, forecastDays, selectedLocationName, t }) {
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

  // Onset styling
  const onsetTag = onset >= 70 ? 'High Onset Surge' : onset >= 45 ? 'Moderate Onset' : 'Low / Delayed';
  const onsetColor = onset >= 70 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300';
  const onsetStroke = onset >= 70 ? '#15803d' : '#d97706';

  // Break styling
  const breakTag = breakRisk >= 40 ? 'High Moisture Stress' : breakRisk >= 25 ? 'Moderate Risk' : 'Low Break Risk';
  const breakColor = breakRisk >= 40 ? 'bg-red-50 text-red-800 border-red-300' : breakRisk >= 25 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-700 border-slate-300';
  const breakStroke = breakRisk >= 40 ? '#dc2626' : breakRisk >= 25 ? '#d97706' : '#16a34a';

  // Heavy rain styling
  const heavyTag = heavy >= 40 ? 'Excess Flood Alert' : heavy >= 25 ? 'Moderate Alert' : 'Normal Range';
  const heavyColor = heavy >= 40 ? 'bg-purple-50 text-purple-800 border-purple-300' : heavy >= 25 ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-slate-50 text-slate-700 border-slate-300';
  const heavyStroke = heavy >= 40 ? '#7e22ce' : heavy >= 25 ? '#0284c7' : '#64748b';

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs p-4 space-y-4">
      {/* Top Banner with Official Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-agri-secondary">
              {t.probabilities_title}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded border border-slate-300">
              IMD 5KM HYPERLOCAL ENSEMBLE
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
            {selectedLocationName} • <span className="text-agri-primary">{forecastDays}-Day Operational Window</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 border border-slate-300 px-2.5 py-1 rounded text-xs font-medium text-slate-700">
            {t.confidence}: <strong className="text-slate-900">{confidence}%</strong>
          </div>
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{status}</span>
          </div>
        </div>
      </div>

      {/* 3 Circular Radial Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CircularGauge
          value={onset}
          label={t.onset_prob}
          sublabel="Likelihood of seasonal monsoon onset & wetting rain >50mm"
          colorClass={onsetColor}
          strokeColor={onsetStroke}
          statusTag={onsetTag}
        />

        <CircularGauge
          value={breakRisk}
          label={t.break_prob}
          sublabel="Risk of rain hiatus >7 days during seedling emergence"
          colorClass={breakColor}
          strokeColor={breakStroke}
          statusTag={breakTag}
        />

        <CircularGauge
          value={heavy}
          label={t.heavy_prob}
          sublabel="Risk of intense episodic downpour (>64.5mm in 24h)"
          colorClass={heavyColor}
          strokeColor={heavyStroke}
          statusTag={heavyTag}
        />
      </div>

      {/* Precipitation Anomaly & Active/Break Duration Outlook Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Localized Precipitation Anomaly</span>
            <span className="font-extrabold text-slate-800">
              {forecastData?.climatology_anomaly?.anomaly_status || "Above Normal (+17.6%)"}
            </span>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-600">
            <div>Pred: <strong className="text-agri-secondary">{forecastData?.climatology_anomaly?.predicted_rainfall_mm || "123.5"} mm</strong></div>
            <div>Norm: <span>{forecastData?.climatology_anomaly?.normal_rainfall_mm || "105.0"} mm</span></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active / Break Spell Duration</span>
            <span className="font-extrabold text-slate-800">
              Active: {forecastData?.duration_outlook?.active_monsoon_duration || "6–9 Days"}
            </span>
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <div>Break: <strong className="text-amber-700">{forecastData?.duration_outlook?.break_dry_spell_duration || "1–3 Days"}</strong></div>
            <div className="text-[10px] text-slate-500">Onset Window: {forecastData?.duration_outlook?.expected_onset_window || "12–16 June"}</div>
          </div>
        </div>
      </div>

      {/* Official Agromet Synthesis Briefing */}
      <div className="bg-slate-50 border-l-4 border-agri-secondary p-3 text-xs text-slate-800 rounded-r">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-agri-secondary shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 font-bold block mb-0.5">
              Official Agromet Synopsis:
            </strong>
            <p className="text-slate-700 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
