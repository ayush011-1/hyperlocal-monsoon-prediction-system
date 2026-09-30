import React from 'react';
import { CloudRain, Sun, CloudLightning, ShieldCheck, AlertCircle, Info, TrendingUp, AlertTriangle } from 'lucide-react';

function RiskCard({ title, value, sublabel, statusTag, tagStyle, strokeColor, icon: Icon, trend }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between shadow-xs hover:border-slate-400 transition">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Icon className="w-4 h-4 text-agri-secondary shrink-0" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              {title}
            </h3>
          </div>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${tagStyle}`}>
            {statusTag}
          </span>
        </div>

        <div className="flex items-center justify-between my-2">
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {value}<span className="text-xl font-extrabold text-slate-600">%</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              PROBABILITY
            </div>
          </div>

          {/* SVG Radial Gauge */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-100"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="gauge-circle"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke={strokeColor}
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold font-mono text-slate-800">{value}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-100">
        <p className="text-xs text-slate-600 leading-snug">
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
  const onsetStyle = onset >= 70 ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-amber-100 text-amber-900 border-amber-400';
  const onsetStroke = onset >= 70 ? '#15803d' : '#d97706';

  // Break styling
  const breakTag = breakRisk >= 40 ? 'High Moisture Stress' : breakRisk >= 25 ? 'Moderate Risk' : 'Low Break Risk';
  const breakStyle = breakRisk >= 40 ? 'bg-red-100 text-red-900 border-red-400' : breakRisk >= 25 ? 'bg-amber-100 text-amber-900 border-amber-400' : 'bg-emerald-100 text-emerald-900 border-emerald-400';
  const breakStroke = breakRisk >= 40 ? '#dc2626' : breakRisk >= 25 ? '#d97706' : '#16a34a';

  // Heavy rain styling
  const heavyTag = heavy >= 40 ? 'Heavy Rain Alert' : heavy >= 25 ? 'Moderate Alert' : 'Normal Range';
  const heavyStyle = heavy >= 40 ? 'bg-purple-100 text-purple-900 border-purple-400' : heavy >= 25 ? 'bg-sky-100 text-sky-900 border-sky-400' : 'bg-slate-100 text-slate-800 border-slate-300';
  const heavyStroke = heavy >= 40 ? '#7e22ce' : heavy >= 25 ? '#0284c7' : '#64748b';

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs p-4 space-y-4">
      {/* Top Banner with Official Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-agri-secondary">
              {t.probabilities_title}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-800 font-mono px-2 py-0.5 rounded border border-slate-300 font-semibold">
              IMD 5KM HYPERLOCAL ENSEMBLE
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
            {selectedLocationName} • <span className="text-agri-primary">{forecastDays}-Day Operational Window</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="bg-slate-100 border border-slate-300 px-2.5 py-1 rounded text-xs font-medium text-slate-700">
            {t.confidence}: <strong className="text-slate-900 font-mono">{confidence}%</strong>
          </div>
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>{status}</span>
          </div>
        </div>
      </div>

      {/* 3 Key Prediction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <RiskCard
          title={t.onset_prob}
          value={onset}
          sublabel="Likelihood of seasonal monsoon onset & wetting rain >50mm"
          statusTag={onsetTag}
          tagStyle={onsetStyle}
          strokeColor={onsetStroke}
          icon={CloudRain}
        />

        <RiskCard
          title={t.break_prob}
          value={breakRisk}
          sublabel="Risk of rain hiatus >7 days during seedling emergence"
          statusTag={breakTag}
          tagStyle={breakStyle}
          strokeColor={breakStroke}
          icon={Sun}
        />

        <RiskCard
          title={t.heavy_prob}
          value={heavy}
          sublabel="Risk of intense episodic downpour (>64.5mm in 24h)"
          statusTag={heavyTag}
          tagStyle={heavyStyle}
          strokeColor={heavyStroke}
          icon={CloudLightning}
        />
      </div>

      {/* Precipitation Anomaly & Active/Break Duration Outlook Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Localized Precipitation Anomaly</span>
            <span className="font-extrabold text-slate-800 text-sm">
              {forecastData?.climatology_anomaly?.anomaly_status || "Above Normal (+17.6%)"}
            </span>
          </div>
          <div className="text-right font-mono text-xs text-slate-600">
            <div>Pred: <strong className="text-agri-secondary">{forecastData?.climatology_anomaly?.predicted_rainfall_mm || "123.5"} mm</strong></div>
            <div>Norm: <span>{forecastData?.climatology_anomaly?.normal_rainfall_mm || "105.0"} mm</span></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active / Break Spell Duration</span>
            <span className="font-extrabold text-slate-800 text-sm">
              Active: {forecastData?.duration_outlook?.active_monsoon_duration || "6–9 Days"}
            </span>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Break: <strong className="text-amber-800">{forecastData?.duration_outlook?.break_dry_spell_duration || "1–3 Days"}</strong></div>
            <div className="text-[10px] text-slate-500 font-medium">Onset Window: {forecastData?.duration_outlook?.expected_onset_window || "12–16 June"}</div>
          </div>
        </div>
      </div>

      {/* Official Agromet Synthesis Briefing */}
      <div className="bg-slate-50 border-l-4 border-agri-secondary p-3.5 text-xs text-slate-800 rounded-r">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-agri-secondary shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 font-extrabold block mb-0.5">
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

