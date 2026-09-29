import React from 'react';
import { AlertTriangle, CheckCircle2, PhoneCall } from 'lucide-react';

export function FarmerView({
  forecastData,
  advisoryData,
  selectedCrop,
  setSelectedCrop,
  supportedCrops,
  language,
  t
}) {
  const probs = forecastData?.probabilities || { monsoon_onset: 82, break_dry_spell: 21, heavy_rainfall: 36 };
  const cropList = supportedCrops.length > 0 ? supportedCrops : [
    { id: 'soybean', name: 'Soybean', marathi_name: 'सोयाबीन', hindi_name: 'सोयाबीन' },
    { id: 'rice', name: 'Rice', marathi_name: 'भात', hindi_name: 'धान' },
    { id: 'maize', name: 'Maize', marathi_name: 'मका', hindi_name: 'मक्का' },
    { id: 'cotton', name: 'Cotton', marathi_name: 'कापूस', hindi_name: 'कपास' },
    { id: 'bajra', name: 'Bajra', marathi_name: 'बाजरी', hindi_name: 'बाजरा' },
  ];

  let localizedRecommendation = advisoryData?.recommendation || '';
  if (language === 'mr' && advisoryData?.recommendation_marathi) localizedRecommendation = advisoryData.recommendation_marathi;
  if (language === 'hi' && advisoryData?.recommendation_hindi) localizedRecommendation = advisoryData.recommendation_hindi;

  let localizedReasons = advisoryData?.reasons || [];
  if (language === 'mr' && advisoryData?.reasons_marathi?.length) localizedReasons = advisoryData.reasons_marathi;
  if (language === 'hi' && advisoryData?.reasons_hindi?.length) localizedReasons = advisoryData.reasons_hindi;

  const onsetLabel = language === 'mr' ? 'पाऊस आगमनाची शक्यता' : language === 'hi' ? 'मानसून आगमन की संभावना' : 'Monsoon Onset Chance';
  const breakLabel = language === 'mr' ? 'पावसात खंड पडण्याचा धोका' : language === 'hi' ? 'ब्रेक / सूखा जोखिम' : 'Dry Spell Break Risk';

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Kisan Portal Title */}
      <div className="bg-agri-primary text-white p-4 rounded-md shadow-xs border-b-4 border-amber-500">
        <h2 className="text-xl font-extrabold tracking-tight">
          {language === 'mr' ? '🌾 किसान थेट सेवा केंद्र' : language === 'hi' ? '🌾 किसान डायरेक्ट सेवा' : '🌾 Kisan Sahayak Direct Portal'}
        </h2>
        <p className="text-xs text-emerald-200 mt-0.5">
          {language === 'mr' ? 'महाराष्ट्र कृषी हवामान सल्ला — थेट शेतकरी सेवा' : language === 'hi' ? 'महाराष्ट्र कृषि मौसम सलाह — सरल किसान सेवा' : 'Maharashtra Agromet Advisory — Direct Farmer Advisory Service'}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-100">
          <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
          {language === 'mr' ? 'किसान हेल्पलाइन:' : 'Kisan Helpline:'}
          <strong className="font-mono text-white text-sm">1800-180-1551</strong>
        </div>
      </div>

      {/* Step 1: Location Display */}
      <div className="bg-white border-2 border-slate-300 rounded-md overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-agri-secondary text-white text-xs font-black flex items-center justify-center shrink-0">1</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {language === 'mr' ? 'तुमचे ठिकाण' : language === 'hi' ? 'आपका स्थान' : 'Your Location'}
          </span>
        </div>
        <div className="p-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-slate-500 block font-semibold">{t.district}</span>
            <strong className="text-slate-900 text-sm">{forecastData?.district || 'Pune'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">{t.block}</span>
            <strong className="text-slate-900 text-sm">{forecastData?.block || 'Haveli'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">{t.panchayat}</span>
            <strong className="text-slate-900 text-sm">{forecastData?.panchayat || 'Wagholi'}</strong>
          </div>
        </div>
      </div>

      {/* Step 2: Forecast Summary */}
      <div className="bg-white border-2 border-slate-300 rounded-md overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-agri-secondary text-white text-xs font-black flex items-center justify-center shrink-0">2</span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {language === 'mr' ? `पुढील ${forecastData?.forecast_period_days || 14} दिवसांचा अंदाज` : `${forecastData?.forecast_period_days || 14}-Day Rain Forecast`}
            </span>
          </div>
          <span className="text-[10px] font-mono bg-agri-secondary text-white px-2 py-0.5 rounded">
            {forecastData?.forecast_period_days || 14}D ENSEMBLE
          </span>
        </div>

        <div className="p-3 grid grid-cols-2 gap-3">
          {/* Onset Big Number */}
          <div className="bg-emerald-50 border border-emerald-300 rounded p-3 text-center">
            <span className="text-[11px] text-emerald-800 font-black block uppercase">{onsetLabel}</span>
            <div className="text-4xl font-black text-emerald-900 my-1 font-mono">{probs.monsoon_onset}%</div>
            <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-700 h-2 rounded-full" style={{ width: `${probs.monsoon_onset}%` }}></div>
            </div>
            <p className="text-[10px] text-emerald-700 mt-1 font-semibold">
              {probs.monsoon_onset >= 70
                ? (language === 'mr' ? '✓ पेरणीस अनुकूल पाऊस' : '✓ Favorable for sowing')
                : (language === 'mr' ? '⚠ अंदाज कमी — वाट पहा' : '⚠ Low — wait for rain')}
            </p>
          </div>

          {/* Break Risk Big Number */}
          <div className="bg-amber-50 border border-amber-300 rounded p-3 text-center">
            <span className="text-[11px] text-amber-800 font-black block uppercase">{breakLabel}</span>
            <div className="text-4xl font-black text-amber-900 my-1 font-mono">{probs.break_dry_spell}%</div>
            <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
              <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${probs.break_dry_spell}%` }}></div>
            </div>
            <p className="text-[10px] text-amber-700 mt-1 font-semibold">
              {probs.break_dry_spell > 35
                ? (language === 'mr' ? '⚠ पाण्याचा ताण शक्य' : '⚠ Moisture stress risk')
                : (language === 'mr' ? '✓ खंडाचा धोका कमी' : '✓ Low dry-spell risk')}
            </p>
          </div>
        </div>

        {/* Heavy Rain Alert if elevated */}
        {probs.heavy_rainfall > 35 && (
          <div className="mx-3 mb-3 p-2.5 bg-red-50 border border-red-300 rounded text-xs text-red-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>
              {language === 'mr'
                ? `⚠ सावधान: अतिवृष्टीची शक्यता ${probs.heavy_rainfall}% — शेतात पाण्याचा निचरा तपासा.`
                : `⚠ Flood/waterlogging alert: ${probs.heavy_rainfall}% chance of heavy rain. Clear drainage channels.`}
            </span>
          </div>
        )}
      </div>

      {/* Step 3: Crop Selector */}
      <div className="bg-white border-2 border-slate-300 rounded-md overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-agri-secondary text-white text-xs font-black flex items-center justify-center shrink-0">3</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {language === 'mr' ? 'तुमचे पीक निवडा' : language === 'hi' ? 'अपनी फसल चुनें' : 'Select Your Crop'}
          </span>
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          {cropList.map((c) => {
            const active = selectedCrop === c.id;
            let name = c.name;
            if (language === 'mr') name = c.marathi_name;
            if (language === 'hi') name = c.hindi_name;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCrop(c.id)}
                className={`px-3 py-2 text-sm font-bold rounded border transition ${
                  active ? 'bg-agri-primary text-white border-agri-primary' : 'bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Advisory */}
      <div className="bg-white border-2 border-agri-primary rounded-md overflow-hidden">
        <div className="bg-agri-primary text-white px-3 py-2 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-400 text-agri-primaryDark text-xs font-black flex items-center justify-center shrink-0">4</span>
          <span className="text-xs font-black uppercase tracking-wider">
            {language === 'mr' ? 'पेरणी सल्ला' : language === 'hi' ? 'बुवाई परामर्श' : 'Crop Sowing Advisory'}
          </span>
        </div>
        <div className="p-3.5 space-y-3">
          <p className="text-base font-extrabold text-slate-900 leading-snug">
            {localizedRecommendation}
          </p>
          <div className="space-y-1.5">
            {localizedReasons.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-agri-primary mt-0.5 shrink-0" />
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
