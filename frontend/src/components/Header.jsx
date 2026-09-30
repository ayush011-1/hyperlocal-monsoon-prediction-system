import React from 'react';
import { CloudRain, Globe, Layers, PhoneCall, Cpu, UserCheck, LayoutDashboard } from 'lucide-react';

export function Header({ currentView, setCurrentView, language, setLanguage, t, onLoadPuneBenchmark, isPuneBenchmark }) {
  return (
    <header className="bg-agri-secondary text-white shadow-md border-b-2 border-agri-accent">
      {/* Top Utility Govt Strip */}
      <div className="bg-[#081827] px-3 sm:px-6 py-1.5 text-[10px] sm:text-[11px] text-slate-300 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] sm:text-[11px]">
            भारत सरकार • GOVT OF INDIA | IMD AGROMET ADVISORY SERVICES
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="hidden md:inline text-slate-300 text-[11px]">
            National Agromet Decision Support System (Gram Panchayat & Block Scale)
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <a
            href="tel:18001801551"
            className="flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-medium text-[11px] transition"
            title="Call Kisan Call Centre Toll-Free Helpline"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Kisan Helpline: <strong className="text-white font-mono">1800-180-1551</strong></span>
          </a>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs">
            <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <label htmlFor="language-select" className="sr-only">Select Language</label>
            <select
              id="language-select"
              aria-label="Select Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English (EN)</option>
              <option value="mr" className="bg-slate-900 text-white">मराठी (MR)</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी (HI)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Agro-Met Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Institutional Crest / Emblem badge */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-agri-primary border-2 border-amber-400 rounded flex items-center justify-center text-white shrink-0 shadow-inner">
            <CloudRain className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-amber-400">
              {language === 'mr' ? 'राष्ट्रीय कृषी हवामान मान्सून अंदाज प्रणाली' : language === 'hi' ? 'राष्ट्रीय कृषि मौसम मानसून पूर्वानुमान प्रणाली' : 'National Agromet Monsoon Prediction Network'}
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-tight leading-tight">
              {t.portal_title}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-300">
              {t.portal_subtitle} • <span className="text-amber-300 font-semibold">{t.sih_badge}</span>
            </p>
          </div>
        </div>

        {/* Quick Benchmark Button */}
        <div className="flex items-center gap-2 shrink-0">
          {isPuneBenchmark && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] bg-emerald-800 text-emerald-200 border border-emerald-500 px-2.5 py-1 rounded font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Pune 14-Day Baseline Active
            </span>
          )}
          <button
            onClick={onLoadPuneBenchmark}
            className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white px-3 py-1.5 rounded text-xs font-bold border border-amber-400 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Load the SIH test benchmark (Pune 14-Day, 82% Onset, Soybean Advisory)"
          >
            <Layers className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            <span>{t.switch_to_pune_benchmark}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <nav aria-label="Main Navigation" className="bg-[#0b2034] px-3 sm:px-6 lg:px-8 border-t border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 text-xs md:text-sm font-semibold whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-3.5 py-2 rounded-t flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-agri-primary text-white border-amber-400 shadow-xs'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t.nav_dashboard}</span>
          </button>

          <button
            onClick={() => setCurrentView('farmer')}
            className={`px-3.5 py-2 rounded-t flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              currentView === 'farmer'
                ? 'bg-agri-primary text-white border-amber-400 shadow-xs'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <CloudRain className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t.farmer_view_title}</span>
          </button>

          <button
            onClick={() => setCurrentView('officer')}
            className={`px-3.5 py-2 rounded-t flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              currentView === 'officer'
                ? 'bg-agri-primary text-white border-amber-400 shadow-xs'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{t.nav_officer}</span>
          </button>

          <button
            onClick={() => setCurrentView('pipeline')}
            className={`px-3.5 py-2 rounded-t flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              currentView === 'pipeline'
                ? 'bg-agri-primary text-white border-amber-400 shadow-xs'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{t.nav_pipeline}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

