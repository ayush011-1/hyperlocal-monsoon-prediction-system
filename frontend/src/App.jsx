import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CommandSidebar } from './components/CommandSidebar';
import { ProbabilitiesGauges } from './components/ProbabilitiesGauges';
import { GisMap } from './components/GisMap';
import { ForecastChart } from './components/ForecastChart';
import { ClimateIndicators } from './components/ClimateIndicators';
import { CropAdvisory } from './components/CropAdvisory';
import { FarmerView } from './components/FarmerView';
import { AgriOfficerView } from './components/AgriOfficerView';
import { PredictionPipeline } from './components/PredictionPipeline';

import {
  fetchLocations,
  fetchForecast,
  fetchClimateIndicators,
  fetchAdvisory,
  fetchSupportedCrops,
  fetchFieldObservations,
  fetchPipelineInfo
} from './services/api';

import { translations } from './data/translations';
import fallbackLocations from './data/locations.json';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [language, setLanguage] = useState('en');

  const [locationsData, setLocationsData] = useState(fallbackLocations);
  const [selectedState, setSelectedState] = useState('maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState('pune');
  const [selectedBlock, setSelectedBlock] = useState('haveli');
  const [selectedPanchayat, setSelectedPanchayat] = useState('wagholi');
  const [forecastDays, setForecastDays] = useState(14);

  const [forecastData, setForecastData] = useState(null);
  const [climateData, setClimateData] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('soybean');
  const [selectedCropStage, setSelectedCropStage] = useState('sowing');
  const [advisoryData, setAdvisoryData] = useState(null);
  const [supportedCrops, setSupportedCrops] = useState([]);
  const [observations, setObservations] = useState([]);
  const [pipelineInfo, setPipelineInfo] = useState(null);

  const t = translations[language] || translations.en;

  // Initial boot: load static/infrequent data
  useEffect(() => {
    async function initData() {
      try {
        const [locs, clim, crops, obs, pipe] = await Promise.all([
          fetchLocations().catch(() => null),
          fetchClimateIndicators().catch(() => null),
          fetchSupportedCrops().catch(() => []),
          fetchFieldObservations().catch(() => []),
          fetchPipelineInfo().catch(() => null)
        ]);
        if (locs) setLocationsData(locs);
        if (clim) setClimateData(clim);
        if (crops) setSupportedCrops(crops);
        if (obs) setObservations(obs);
        if (pipe) setPipelineInfo(pipe);
      } catch (err) {
        console.error('Init error:', err);
      }
    }
    initData();
  }, []);

  // Reactive update when user changes location, period, crop, or stage
  useEffect(() => {
    async function updatePredictions() {
      try {
        const [fc, adv] = await Promise.all([
          fetchForecast(selectedDistrict, selectedBlock, selectedPanchayat, forecastDays),
          fetchAdvisory(selectedCrop, selectedDistrict, selectedBlock, selectedPanchayat, forecastDays)
        ]);
        if (fc) setForecastData(fc);
        if (adv) setAdvisoryData(adv);
      } catch (err) {
        console.error('Prediction update error:', err);
      }
    }
    updatePredictions();
  }, [selectedDistrict, selectedBlock, selectedPanchayat, forecastDays, selectedCrop, selectedCropStage]);

  const handleGenerateIntelligence = async () => {
    try {
      const [fc, adv] = await Promise.all([
        fetchForecast(selectedDistrict, selectedBlock, selectedPanchayat, forecastDays),
        fetchAdvisory(selectedCrop, selectedDistrict, selectedBlock, selectedPanchayat, forecastDays)
      ]);
      if (fc) setForecastData(fc);
      if (adv) setAdvisoryData(adv);
    } catch (err) {
      console.error('Generate intelligence error:', err);
    }
  };

  const handleRefreshObservations = async () => {
    try {
      const data = await fetchFieldObservations();
      setObservations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadPuneBenchmark = () => {
    setSelectedState('maharashtra');
    setSelectedDistrict('pune');
    setSelectedBlock('haveli');
    setSelectedPanchayat('wagholi');
    setForecastDays(14);
    setSelectedCrop('soybean');
    if (currentView === 'pipeline') setCurrentView('dashboard');
  };

  const isPuneBenchmark =
    selectedDistrict.toLowerCase() === 'pune' &&
    forecastDays === 14 &&
    selectedCrop === 'soybean';

  // Build a readable location string for display
  const statesList = locationsData?.states || [
    { id: 'maharashtra', name: locationsData?.state || 'Maharashtra', districts: locationsData?.districts || [] }
  ];

  const currentStateObj = statesList.find(
    s => s.id.toLowerCase() === (selectedState || 'maharashtra').toLowerCase()
  ) || statesList[0];

  const stateLabel = currentStateObj?.name || 'Maharashtra';

  const currentDistrictObj = currentStateObj?.districts?.find(
    d => d.id.toLowerCase() === (selectedDistrict || '').toLowerCase() || d.name.toLowerCase() === (selectedDistrict || '').toLowerCase()
  ) || currentStateObj?.districts?.[0];

  const districtLabel = currentDistrictObj?.name || selectedDistrict.toUpperCase();

  const currentBlockObj = currentDistrictObj?.blocks?.find(
    b => b.id.toLowerCase() === (selectedBlock || '').toLowerCase() || b.name.toLowerCase() === (selectedBlock || '').toLowerCase()
  ) || currentDistrictObj?.blocks?.[0];

  const blockLabel = currentBlockObj?.name || selectedBlock.toUpperCase();

  const currentPanchayatObj = currentBlockObj?.panchayats?.find(
    p => p.id.toLowerCase() === (selectedPanchayat || '').toLowerCase() || p.name.toLowerCase() === (selectedPanchayat || '').toLowerCase()
  ) || currentBlockObj?.panchayats?.[0];

  const panchayatLabel = currentPanchayatObj?.name || selectedPanchayat.toUpperCase();

  const selectedLocationName = `${panchayatLabel}, ${blockLabel} — ${districtLabel} (${stateLabel})`;

  // Sidebar is only shown on the main dashboard tab
  const showSidebar = currentView === 'dashboard';

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
      {/* ── Official IMD / Agromet Header ── */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        language={language}
        setLanguage={setLanguage}
        t={t}
        onLoadPuneBenchmark={handleLoadPuneBenchmark}
        isPuneBenchmark={isPuneBenchmark}
      />

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Dashboard: 2-column sidebar + content layout */}
        {currentView === 'dashboard' && (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Left Sidebar: Location + Crop + Forecast selectors */}
            <aside className="w-full lg:w-64 xl:w-72 shrink-0">
              <CommandSidebar
                locationsData={locationsData}
                selectedState={selectedState}
                setSelectedState={setSelectedState}
                selectedDistrict={selectedDistrict}
                setSelectedDistrict={setSelectedDistrict}
                selectedBlock={selectedBlock}
                setSelectedBlock={setSelectedBlock}
                selectedPanchayat={selectedPanchayat}
                setSelectedPanchayat={setSelectedPanchayat}
                forecastDays={forecastDays}
                setForecastDays={setForecastDays}
                selectedCrop={selectedCrop}
                setSelectedCrop={setSelectedCrop}
                selectedCropStage={selectedCropStage}
                setSelectedCropStage={setSelectedCropStage}
                onGenerateIntelligence={handleGenerateIntelligence}
                supportedCrops={supportedCrops}
                language={language}
                t={t}
              />
            </aside>

            {/* Right Main Content */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* 1. Probabilistic Gauges Row */}
              <ProbabilitiesGauges
                forecastData={forecastData}
                forecastDays={forecastDays}
                selectedLocationName={selectedLocationName}
                t={t}
              />

              {/* 2. Crop Advisory */}
              <CropAdvisory
                advisoryData={advisoryData}
                selectedCrop={selectedCrop}
                setSelectedCrop={setSelectedCrop}
                supportedCrops={supportedCrops}
                language={language}
                t={t}
              />

              {/* 3. GIS Map */}
              <GisMap
                gisFeatures={forecastData?.gis_features}
                selectedLocationName={selectedLocationName}
                t={t}
              />

              {/* 4. Forecast Chart */}
              <ForecastChart
                dailyForecast={forecastData?.daily_forecast}
                forecastDays={forecastDays}
                t={t}
              />

              {/* 5. Climate Indicators */}
              <ClimateIndicators climateData={climateData} t={t} />
            </div>
          </div>
        )}

        {/* Farmer Direct View */}
        {currentView === 'farmer' && (
          <FarmerView
            forecastData={forecastData}
            advisoryData={advisoryData}
            selectedCrop={selectedCrop}
            setSelectedCrop={setSelectedCrop}
            supportedCrops={supportedCrops}
            language={language}
            t={t}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedDistrict={selectedDistrict}
            setSelectedDistrict={setSelectedDistrict}
            selectedBlock={selectedBlock}
            setSelectedBlock={setSelectedBlock}
            selectedPanchayat={selectedPanchayat}
            setSelectedPanchayat={setSelectedPanchayat}
            forecastDays={forecastDays}
            setForecastDays={setForecastDays}
            selectedCropStage={selectedCropStage}
            setSelectedCropStage={setSelectedCropStage}
            onGenerateIntelligence={handleGenerateIntelligence}
            locationsData={locationsData}
          />
        )}

        {/* Agricultural Officer View */}
        {currentView === 'officer' && (
          <AgriOfficerView
            locationsData={locationsData}
            gisFeatures={forecastData?.gis_features}
            selectedLocationName={selectedLocationName}
            observations={observations}
            onRefreshObservations={handleRefreshObservations}
            selectedDistrict={selectedDistrict}
            selectedBlock={selectedBlock}
            selectedPanchayat={selectedPanchayat}
            t={t}
          />
        )}

        {/* ML & NLP Prediction Pipeline */}
        {currentView === 'pipeline' && (
          <PredictionPipeline
            pipelineInfo={pipelineInfo}
            currentProbabilities={forecastData?.probabilities}
            selectedDistrict={selectedDistrict}
            selectedBlock={selectedBlock}
            selectedPanchayat={selectedPanchayat}
            selectedCrop={selectedCrop}
            forecastDays={forecastDays}
            language={language}
          />
        )}
      </main>

      {/* ── Government Footer ── */}
      <footer className="bg-agri-secondary text-slate-300 text-xs border-t-4 border-agri-primary mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="font-extrabold text-amber-400 text-sm mb-2">
              SIH PS 26086 — National Agromet DSS
            </div>
            <p className="text-slate-400 leading-relaxed">
              Hyperlocal Monsoon Onset & Break Prediction System (Block / Village Scale). Built for agricultural extension officers, district agri departments, and farmer collectives.
            </p>
          </div>
          <div>
            <div className="font-extrabold text-white text-sm mb-2">Institutional Partners</div>
            <ul className="space-y-1 text-slate-400">
              <li>• India Meteorological Department (IMD)</li>
              <li>• Indian Council of Agricultural Research (ICAR)</li>
              <li>• Dept. of Agriculture, Govt. of Maharashtra</li>
              <li>• National Centre for Medium Range WF (NCMRWF)</li>
            </ul>
          </div>
          <div>
            <div className="font-extrabold text-white text-sm mb-2">System Specifications</div>
            <ul className="space-y-1 text-slate-400">
              <li>• Spatial Resolution: Hyperlocal 5km Grid</li>
              <li>• Temporal Horizons: 7 / 14 / 21 / 30 Days</li>
              <li>• Downscaling: Orographic Lift + Soil AWC</li>
              <li>• Coverage: Maharashtra Agromet Grid Network</li>
            </ul>
          </div>
          <div>
            <div className="font-extrabold text-white text-sm mb-2">Agromet Advisory Protocol</div>
            <p className="text-slate-400 leading-relaxed">
              Automated advisory generated in accordance with IMD Gramin Krishi Mausam Sewa (GKMS) guidelines and ICAR agronomic thresholds. Cross-validated with Taluka Agriculture Officer field telemetry.
            </p>
          </div>
        </div>
        <div className="bg-[#081827] py-2.5 text-center text-slate-600 text-[11px] border-t border-slate-800">
          National Agromet Monsoon Decision Support System • Ministry of Agriculture & Farmers Welfare • SIH 2026
        </div>
      </footer>
    </div>
  );
}
