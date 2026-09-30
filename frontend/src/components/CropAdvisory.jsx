import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, CheckSquare, ShieldCheck } from 'lucide-react';
import { sendNotification } from '../services/api';

const URGENCY_STYLE = {
  'Optimal':       'bg-emerald-700 text-white border-emerald-800',
  'Caution - Delay': 'bg-amber-600 text-white border-amber-700',
  'High Alert':    'bg-red-700 text-white border-red-800',
  'Advisory Alert':'bg-sky-700 text-white border-sky-800',
  'Moderate':      'bg-agri-secondary text-white border-[#0b2034]',
};

export function CropAdvisory({ advisoryData, selectedCrop, setSelectedCrop, supportedCrops, language, t }) {
  const cropList = supportedCrops.length > 0 ? supportedCrops : [
    { id: 'soybean', name: 'Soybean', marathi_name: 'सोयाबीन', hindi_name: 'सोयाबीन' },
    { id: 'rice', name: 'Rice', marathi_name: 'भात', hindi_name: 'धान' },
    { id: 'maize', name: 'Maize', marathi_name: 'मका', hindi_name: 'मक्का' },
    { id: 'cotton', name: 'Cotton', marathi_name: 'कापूस', hindi_name: 'कपास' },
    { id: 'bajra', name: 'Bajra', marathi_name: 'बाजरी', hindi_name: 'बाजरा' },
  ];

  const getLocalizedRecommendation = () => {
    if (!advisoryData) return '';
    if (language === 'mr' && advisoryData.recommendation_marathi) return advisoryData.recommendation_marathi;
    if (language === 'hi' && advisoryData.recommendation_hindi) return advisoryData.recommendation_hindi;
    return advisoryData.recommendation || '';
  };

  const getLocalizedReasons = () => {
    if (!advisoryData) return [];
    if (language === 'mr' && advisoryData.reasons_marathi?.length) return advisoryData.reasons_marathi;
    if (language === 'hi' && advisoryData.reasons_hindi?.length) return advisoryData.reasons_hindi;
    return advisoryData.reasons || [];
  };

  const recommendation = getLocalizedRecommendation();
  const reasons = getLocalizedReasons();
  const fieldMeasures = advisoryData?.field_measures || [];
  const urgency = advisoryData?.urgency_level || 'Moderate';
  const confidence = advisoryData?.confidence_level || '85%';
  const urgencyStyle = URGENCY_STYLE[urgency] || URGENCY_STYLE['Moderate'];

  return (
    <div className="bg-white border border-slate-300 rounded-md shadow-xs overflow-hidden">
      {/* Bulletin Header */}
      <div className="bg-agri-primary text-white px-4 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
            KHARIF CROP ADVISORY
          </span>
          <h3 className="text-sm font-extrabold">{t.crop_advisory_title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Confidence Level */}
          <div className="text-xs bg-agri-primaryDark border border-emerald-800 px-2 py-1 rounded text-emerald-200 font-mono font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {confidence} confidence
          </div>
          {/* Urgency Badge */}
          <span className={`text-xs font-black px-2.5 py-1 rounded border ${urgencyStyle}`}>
            {urgency}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Crop Selector Row */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
            {t.select_crop}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {cropList.map((c) => {
              const active = selectedCrop === c.id;
              let name = c.name;
              if (language === 'mr') name = c.marathi_name;
              if (language === 'hi') name = c.hindi_name;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCrop(c.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded border transition ${
                    active
                      ? 'bg-agri-primary text-white border-agri-primary shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Meta Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded p-2.5 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Crop</span>
            <strong className="text-slate-900">{advisoryData?.crop || 'Soybean'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Location</span>
            <strong className="text-slate-900 truncate block">{advisoryData?.location || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Window</span>
            <strong className="text-slate-900">{advisoryData?.forecast_period || '14 Days'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Onset</span>
            <strong className="text-agri-primary">{advisoryData?.prediction?.onset_probability ?? 82}%</strong>
            <span className="text-slate-500"> / Break </span>
            <strong className="text-amber-700">{advisoryData?.prediction?.break_probability ?? 21}%</strong>
          </div>
        </div>

        {/* Primary Recommendation Block */}
        <div className="border-l-4 border-agri-primary bg-emerald-50 p-3.5 rounded-r">
          <span className="text-[10px] font-black uppercase tracking-widest text-agri-primary block mb-1">
            ▶ {t.recommendation}
          </span>
          <p className="text-base font-extrabold text-slate-900 leading-snug">
            {recommendation}
          </p>
        </div>

        {/* Reasons + Field Measures 2-col grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-slate-200 rounded p-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-agri-secondary" />
              {t.reasons}
            </h4>
            <ul className="space-y-1.5">
              {reasons.map((r, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-agri-primary shrink-0"></span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-slate-200 rounded p-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-agri-primary" />
              {t.field_measures}
            </h4>
            <ul className="space-y-1.5">
              {fieldMeasures.map((m, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer & Notification Dispatch Trigger */}
        <div className="border-t border-slate-200 pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400 italic flex-1">
            {advisoryData?.disclaimer}
          </p>

          <div className="w-full md:w-auto">
            <NotificationDispatchBar
              advisoryText={recommendation}
              crop={advisoryData?.crop || 'Soybean'}
              language={language}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationDispatchBar({ advisoryText, crop, language }) {
  const [channel, setChannel] = React.useState('sms');
  const [recipient, setRecipient] = React.useState('9876543210');
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const handleDispatch = async () => {
    if (!recipient) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendNotification({
        channel,
        recipient,
        crop,
        advisory_text: advisoryText,
        language
      });
      setResult(res);
    } catch (e) {
      setResult({ status: 'error', detail: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs flex flex-col sm:flex-row items-center gap-2">
      <span className="font-bold text-slate-700 whitespace-nowrap">📢 Dispatch Alert:</span>
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-semibold text-slate-800"
      >
        <option value="sms">📱 SMS Alert</option>
        <option value="whatsapp">💬 WhatsApp</option>
        <option value="api_webhook">🌐 Webhook API</option>
      </select>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder={channel === 'api_webhook' ? 'https://api.agri.gov.in' : 'Mobile No (e.g. 9876543210)'}
        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 w-36 sm:w-44"
      />
      <button
        onClick={handleDispatch}
        disabled={sending}
        className="bg-agri-primary hover:bg-emerald-800 text-white font-bold px-3 py-1 rounded text-xs transition shrink-0"
      >
        {sending ? 'Sending...' : 'Send Alert'}
      </button>

      {result && result.status === 'success' && (
        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-300">
          ✓ Dispatched ({result.dispatch_id})
        </span>
      )}
    </div>
  );
}

