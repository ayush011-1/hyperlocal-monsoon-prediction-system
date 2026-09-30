import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Send,
  Bot,
  RefreshCw,
  User,
  ShieldCheck,
  Trash2,
  MapPin,
  Sprout,
  Clock,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ChevronDown,
  CloudRain,
  Sun,
  CloudLightning,
  ChevronRight,
  ArrowRight,
  Check
} from 'lucide-react';
import { fetchAgentChat } from '../services/api';
import {
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  createSpeechRecognition
} from '../utils/speech';

export function FarmerView({
  forecastData,
  advisoryData,
  selectedCrop,
  setSelectedCrop,
  supportedCrops,
  language,
  t,
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
  selectedCropStage,
  setSelectedCropStage,
  onGenerateIntelligence,
  locationsData
}) {
  const [hasCheckedFarm, setHasCheckedFarm] = useState(true);
  const [isEditingSetup, setIsEditingSetup] = useState(false);

  // Chat & Voice States
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const [activeSpeakingText, setActiveSpeakingText] = useState(null);
  const recognitionControllerRef = useRef(null);

  // Pre-load synthesis voices and cleanup on unmount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      stopSpeaking();
      if (recognitionControllerRef.current) {
        try {
          recognitionControllerRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Conversational history
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      text:
        language === 'mr'
          ? 'नमस्कार शेतकरी बंधूंनो! मी तुमचा कृषी हवामान एआय सहाय्यक आहे. हवामान, पेरणी किंवा पावसाच्या धोक्याबद्दल प्रश्न विचारा किंवा बोलून सांगा!'
          : language === 'hi'
          ? 'नमस्कार किसान भाई! मैं आपका कृषि मौसम एआई सहायक हूँ। मौसम, बुवाई या सूखा जोखिम के बारे में सवाल पूछें या बोलकर बताएं!'
          : 'Namaskar Farmer Friend! I am your Kisan Sahayak AI Agent. Ask me anything about rainfall, crop sowing, or weather risks!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [rawHistory, setRawHistory] = useState([]);
  const chatEndRef = useRef(null);

  const probs = forecastData?.probabilities || { monsoon_onset: 82, break_dry_spell: 21, heavy_rainfall: 36 };

  const cropList = supportedCrops.length > 0 ? supportedCrops : [
    { id: 'soybean', name: 'Soybean', marathi_name: 'सोयाबीन', hindi_name: 'सोयाबीन' },
    { id: 'rice', name: 'Rice (Paddy)', marathi_name: 'भात (तांदूळ)', hindi_name: 'धान (चावल)' },
    { id: 'maize', name: 'Maize (Corn)', marathi_name: 'मका', hindi_name: 'मक्का' },
    { id: 'cotton', name: 'Cotton', marathi_name: 'कापूस', hindi_name: 'कपास' },
    { id: 'bajra', name: 'Bajra', marathi_name: 'बाजरी', hindi_name: 'बाजरा' }
  ];

  const stages = [
    { id: 'sowing', label_en: 'Pre-Sowing / Sowing', label_mr: 'पेरणी पूर्व / पेरणी', label_hi: 'बुवाई पूर्व / बुवाई' },
    { id: 'germination', label_en: 'Germination / Emergence', label_mr: 'अंकुरण अवस्था', label_hi: 'अंकुरण अवस्था' },
    { id: 'vegetative', label_en: 'Vegetative Growth', label_mr: 'शाकीय वाढ', label_hi: 'वानस्पतिक वृद्धि' },
    { id: 'flowering', label_en: 'Flowering / Pod Formation', label_mr: 'फुलधारणा अवस्था', label_hi: 'फूल / फली बनना' },
    { id: 'maturity', label_en: 'Maturity / Harvest', label_mr: 'पक्वता / काढणी', label_hi: 'पकाव / कटाई' }
  ];

  // Dynamic Multi-State & Location Data Parsing
  const statesList = useMemo(() => {
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

  const currentStateObj = statesList.find(
    s => s.id.toLowerCase() === (selectedState || 'maharashtra').toLowerCase()
  ) || statesList[0];

  const districtsList = currentStateObj?.districts || [];

  const currentDistrictObj = districtsList.find(
    d => d.id.toLowerCase() === (selectedDistrict || '').toLowerCase() || d.name.toLowerCase() === (selectedDistrict || '').toLowerCase()
  ) || districtsList[0];

  const blocksList = currentDistrictObj?.blocks || [];

  const currentBlockObj = blocksList.find(
    b => b.id.toLowerCase() === (selectedBlock || '').toLowerCase() || b.name.toLowerCase() === (selectedBlock || '').toLowerCase()
  ) || blocksList[0];

  const panchayatsList = currentBlockObj?.panchayats || [];

  const currentPanchayatObj = panchayatsList.find(
    p => p.id.toLowerCase() === (selectedPanchayat || '').toLowerCase() || p.name.toLowerCase() === (selectedPanchayat || '').toLowerCase()
  ) || panchayatsList[0];

  const getDistrictName = (id) => {
    const d = districtsList.find(opt => opt.id.toLowerCase() === (id || 'pune').toLowerCase() || opt.name.toLowerCase() === (id || 'pune').toLowerCase());
    if (!d) return (id || 'Pune').toUpperCase();
    return d.name;
  };

  const handleFarmerStateChange = (stId) => {
    if (setSelectedState) setSelectedState(stId);
    const sObj = statesList.find(s => s.id === stId);
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

  const handleFarmerDistrictChange = (distId) => {
    setSelectedDistrict(distId);
    const dObj = districtsList.find(d => d.id === distId);
    if (dObj && dObj.blocks && dObj.blocks.length > 0) {
      setSelectedBlock(dObj.blocks[0].id);
      if (dObj.blocks[0].panchayats && dObj.blocks[0].panchayats.length > 0) {
        setSelectedPanchayat(dObj.blocks[0].panchayats[0].id);
      }
    }
  };

  const handleFarmerBlockChange = (blkId) => {
    setSelectedBlock(blkId);
    const bObj = blocksList.find(b => b.id === blkId);
    if (bObj && bObj.panchayats && bObj.panchayats.length > 0) {
      setSelectedPanchayat(bObj.panchayats[0].id);
    }
  };

  let localizedRecommendation = advisoryData?.recommendation || '';
  if (language === 'mr' && advisoryData?.recommendation_marathi) localizedRecommendation = advisoryData.recommendation_marathi;
  if (language === 'hi' && advisoryData?.recommendation_hindi) localizedRecommendation = advisoryData.recommendation_hindi;

  let localizedReasons = advisoryData?.reasons || [];
  if (language === 'mr' && advisoryData?.reasons_marathi?.length) localizedReasons = advisoryData.reasons_marathi;
  if (language === 'hi' && advisoryData?.reasons_hindi?.length) localizedReasons = advisoryData.reasons_hindi;

  const fieldMeasures = advisoryData?.field_measures || [];

  const agentPrompts = language === 'mr' ? [
    "सोयाबीनची पेरणी कधी करावी?",
    "पुढील ७ दिवसांत पाऊस पडेल का?",
    "पावसाचा खंड किती दिवसांचा असेल?",
    "पिकाला पाणी कधी द्यावे?"
  ] : language === 'hi' ? [
    "सोयाबीन की बुवाई कब करें?",
    "क्या अगले 7 दिनों में बारिश होगी?",
    "सूखा जोखिम कितना है?",
    "फसल को पानी कब दें?"
  ] : [
    "When should I sow Soybean?",
    "Will it rain in next 7 days?",
    "What is the dry spell risk?",
    "How to manage heavy rain risk?"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // 🔊 Audio Output (Speech Synthesis) Handler
  const handleToggleSpeak = (text) => {
    if (!text) return;
    if (isSpeaking && activeSpeakingText === text) {
      stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeakingText(null);
      return;
    }

    const ok = speakText(text, {
      language,
      onStart: () => {
        setIsSpeaking(true);
        setActiveSpeakingText(text);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setActiveSpeakingText(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setActiveSpeakingText(null);
      }
    });

    if (!ok) {
      setIsSpeaking(false);
      setActiveSpeakingText(null);
    }
  };

  // 🎙️ Audio Input (Speech Recognition) Handler
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionControllerRef.current) {
        recognitionControllerRef.current.stop();
        recognitionControllerRef.current = null;
      }
      setIsListening(false);
      setVoiceNotice(null);
      return;
    }

    // Stop speaking so mic doesn't capture speaker audio
    stopSpeaking();
    setIsSpeaking(false);
    setActiveSpeakingText(null);

    if (!isSpeechRecognitionSupported()) {
      const msg =
        language === 'mr'
          ? 'तुमच्या ब्राऊझरमध्ये व्हॉइस इनपुट सपोर्ट नाही. कृपया Google Chrome किंवा Edge वापरा.'
          : language === 'hi'
          ? 'आपके ब्राउज़र में वॉइस इनपुट सपोर्ट नहीं है। कृपया Google Chrome या Edge का उपयोग करें।'
          : 'Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
      setVoiceNotice(msg);
      setTimeout(() => setVoiceNotice(null), 6000);
      return;
    }

    const controller = createSpeechRecognition({
      language,
      onStart: () => {
        setIsListening(true);
        setVoiceNotice(
          language === 'mr'
            ? '🎙️ मायक्रोफोन चालू आहे... स्पष्ट आवाजात बोला!'
            : language === 'hi'
            ? '🎙️ माइक्रोफ़ोन चालू है... स्पष्ट बोलें!'
            : '🎙️ Listening... Speak your question now!'
        );
      },
      onInterimResult: (interim) => {
        setChatInput(interim);
      },
      onFinalResult: (final) => {
        setIsListening(false);
        setVoiceNotice(null);
        setChatInput(final);
        recognitionControllerRef.current = null;
        handleSendAgentMessage(final);
      },
      onError: (event) => {
        setIsListening(false);
        recognitionControllerRef.current = null;
        const errType = event.error || event;
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setVoiceNotice(
            language === 'mr'
              ? '⚠️ मायक्रोफोन परवानगी नाकारली गेली. कृपया ब्राऊझर URL बारमधील कुलूप/माईक आयकॉनवर क्लिक करून मायक्रोफोन सुरु करा.'
              : language === 'hi'
              ? '⚠️ माइक्रोफ़ोन अनुमति अस्वीकृत. कृपया ब्राउज़र एड्रेस बार में माइक्रोफ़ोन की अनुमति दें।'
              : '⚠️ Microphone permission denied. Please allow microphone access in your browser settings.'
          );
        } else if (errType === 'no-speech') {
          setVoiceNotice(
            language === 'mr'
              ? 'कोणताही आवाज ऐकू आला नाही. बोलण्यासाठी माईक बटण पुन्हा दाबा.'
              : 'No speech was detected. Tap the mic to try speaking again.'
          );
        } else if (errType === 'network') {
          setVoiceNotice(
            language === 'mr'
              ? 'व्हॉइस सर्व्हर नेटवर्क त्रुटी. इंटरनेट कनेक्शन तपासा.'
              : 'Voice network error. Please check your internet connection.'
          );
        } else {
          setVoiceNotice(
            language === 'mr'
              ? 'व्हॉइस इनपुट त्रुटी. कृपया पुन्हा माईक वर क्लिक करा.'
              : 'Voice recognition issue. Please tap the mic again or type.'
          );
        }
        setTimeout(() => setVoiceNotice(null), 7000);
      },
      onEnd: () => {
        setIsListening(false);
        recognitionControllerRef.current = null;
      }
    });

    if (controller) {
      recognitionControllerRef.current = controller;
      controller.start();
    }
  };

  const handleSendAgentMessage = async (textToSend) => {
    const queryText = textToSend || chatInput;
    if (!queryText || !queryText.trim()) return;

    const userMsgId = Date.now().toString();
    const userMessageObj = {
      id: userMsgId,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessageObj]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await fetchAgentChat(
        queryText,
        rawHistory,
        selectedDistrict || 'Pune',
        selectedBlock || 'Haveli',
        selectedPanchayat || 'Wagholi',
        selectedCrop || 'soybean',
        forecastDays || 14,
        language || 'mr'
      );

      const agentMsgObj = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: res.agent_response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verifiedData: {
          onset: res.ml_verified_data?.monsoon_onset_percent,
          breakRisk: res.ml_verified_data?.break_dry_spell_percent,
          heavyRain: res.ml_verified_data?.heavy_rainfall_percent,
          urgency: res.advisory_verified_data?.urgency_level
        },
        nlpMeta: {
          intent: res.intent,
          lang: res.language_label || res.language,
          crop: res.context?.crop_display,
          location: res.context?.panchayat ? `${res.context.panchayat}, ${res.context.block}` : null
        }
      };

      setMessages((prev) => [...prev, agentMsgObj]);
      if (res.updated_history) {
        setRawHistory(res.updated_history);
      }

      // Auto-read response aloud if query was spoken by voice
      if (textToSend) {
        handleToggleSpeak(res.agent_response);
      }

    } catch (err) {
      console.error("Farmer Agent Error:", err);
      setChatError("Failed to reach Farmer Support Agent. Please check connection.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleCheckMyFarm = () => {
    if (onGenerateIntelligence) onGenerateIntelligence();
    setHasCheckedFarm(true);
    setIsEditingSetup(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 py-2 font-sans">

      {/* 🌟 Top Welcome Banner */}
      <div className="bg-agri-primary text-white rounded-xl p-4 sm:p-5 shadow-xs border-b-4 border-amber-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                SIH PS 26086
              </span>
              <span className="text-emerald-200 text-xs font-semibold">
                {language === 'mr' ? 'ग्राम पंचायत / गट पातळी अंदाज' : language === 'hi' ? 'ग्राम पंचायत स्तर मौसम अंदाज' : 'Village-Cluster Weather Support'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {language === 'mr'
                ? '🌾 शेतकरी हवामान व पीक सल्ला सहाय्यक'
                : language === 'hi'
                ? '🌾 किसान मौसम एवं फसल सलाह सहायक'
                : '🌾 Kisan Agromet Weather & Crop Sahayak'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1">
              {language === 'mr'
                ? 'तुमच्या शेतासाठी अचूक पाऊस, खंडाचा धोका व पेरणीचा सल्ला सहज समजणाऱ्या भाषेत.'
                : language === 'hi'
                ? 'आपके खेत के लिए सटीक बारिश, सूखा जोखिम और बुवाई परामर्श।'
                : 'Simple, reliable monsoon onset, dry-spell risk, and sowing advisories.'}
            </p>
          </div>

          {hasCheckedFarm && !isEditingSetup && (
            <button
              onClick={() => setIsEditingSetup(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-3.5 py-2 rounded text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-xs border border-amber-400 shrink-0 cursor-pointer"
            >
              <span>✏️ {language === 'mr' ? 'शेताची माहिती बदला' : language === 'hi' ? 'खेत की जानकारी बदलें' : 'Change Farm Details'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 📋 WIZARD SETUP FLOW (Shown initially or when user clicks 'Change Farm Details') */}
      {(!hasCheckedFarm || isEditingSetup) && (
        <div className="bg-white border-2 border-emerald-600 rounded-2xl shadow-lg p-4 sm:p-6 space-y-5 animate-fadeIn">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>🌾 {language === 'mr' ? 'शेताची निवड करा (४ सोप्या पायऱ्या)' : language === 'hi' ? 'खेत का चुनाव (4 आसान चरण)' : 'Select Your Farm Details'}</span>
            </h2>
            {hasCheckedFarm && (
              <button
                onClick={() => setIsEditingSetup(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                ✕ {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Step 1: Location */}
            <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs font-black flex items-center justify-center shrink-0">1</span>
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{language === 'mr' ? 'स्थान (राज्य / जिल्हा)' : language === 'hi' ? 'स्थान (राज्य / जिला)' : 'Location'}</span>
              </div>
              <div>
                <label htmlFor="farmer-state" className="text-[11px] font-bold text-slate-600 block mb-1">
                  {language === 'mr' ? 'राज्य:' : language === 'hi' ? 'राज्य:' : 'State:'}
                </label>
                <select
                  id="farmer-state"
                  value={currentStateObj?.id || selectedState || 'maharashtra'}
                  onChange={(e) => handleFarmerStateChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer mb-2"
                >
                  {statesList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.state_code || 'IN'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="farmer-district" className="text-[11px] font-bold text-slate-600 block mb-1">
                  {language === 'mr' ? 'जिल्हा / शहर:' : 'District / City:'}
                </label>
                <select
                  id="farmer-district"
                  value={currentDistrictObj?.id || selectedDistrict}
                  onChange={(e) => handleFarmerDistrictChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {districtsList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="farmer-block" className="text-[11px] font-bold text-slate-600 block mb-1">
                  {language === 'mr' ? 'तालुका / गट:' : 'Block / Taluka:'}
                </label>
                <select
                  id="farmer-block"
                  value={currentBlockObj?.id || selectedBlock}
                  onChange={(e) => handleFarmerBlockChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {blocksList.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="farmer-panchayat" className="text-[11px] font-bold text-slate-600 block mb-1">
                  {language === 'mr' ? 'गाव / परिसर:' : 'Village / Area:'}
                </label>
                <select
                  id="farmer-panchayat"
                  value={currentPanchayatObj?.id || selectedPanchayat}
                  onChange={(e) => setSelectedPanchayat(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {panchayatsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.elevation_m}m AMSL)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Crop */}
            <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs font-black flex items-center justify-center shrink-0">2</span>
                <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{language === 'mr' ? 'तुमचे पीक' : language === 'hi' ? 'आपकी फसल' : 'Select Crop'}</span>
              </div>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                {cropList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({language === 'mr' ? c.marathi_name : language === 'hi' ? c.hindi_name : c.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Crop Stage */}
            <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs font-black flex items-center justify-center shrink-0">3</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{language === 'mr' ? 'पिकाची अवस्था' : language === 'hi' ? 'फसल की स्थिति' : 'Crop Stage'}</span>
              </div>
              <select
                value={selectedCropStage || 'sowing'}
                onChange={(e) => setSelectedCropStage && setSelectedCropStage(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs sm:text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>
                    {language === 'mr' ? s.label_mr : language === 'hi' ? s.label_hi : s.label_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: Forecast Days */}
            <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs font-black flex items-center justify-center shrink-0">4</span>
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{language === 'mr' ? 'अंदाजाचे दिवस' : language === 'hi' ? 'पूर्वानुमान दिन' : 'Forecast Horizon'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[7, 14, 21, 30].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForecastDays(d)}
                    className={`py-1.5 rounded-lg text-center text-xs font-black border transition ${
                      forecastDays === d
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Large Primary Action Button */}
          <button
            onClick={handleCheckMyFarm}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base sm:text-lg py-3.5 px-6 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 border-2 border-amber-500 active:scale-[0.99]"
          >
            <span>🚜 {language === 'mr' ? 'माझ्या शेताचा अंदाज पहा (Check My Farm)' : language === 'hi' ? 'मेरे खेत का मौसम देखें (Check My Farm)' : 'Check My Farm Forecast'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 📊 PERSONALIZED FARMER DASHBOARD (Shown after clicking 'Check My Farm') */}
      {hasCheckedFarm && (
        <div className="space-y-5">

          {/* 📍 Location & Selected Target Badge Strip */}
          <div className="bg-white border border-slate-300 rounded-xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 rounded-lg text-emerald-800 font-bold">📍</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {language === 'mr' ? 'निवडलेले ठिकाण व पीक' : 'Active Location & Crop'}
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900">
                  {selectedPanchayat ? `${selectedPanchayat.toUpperCase()}, ` : ''}{selectedBlock.toUpperCase()}, {getDistrictName(selectedDistrict)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1">
                🌱 {cropList.find(c => c.id === selectedCrop)?.name || selectedCrop}
              </span>
              <span className="bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1">
                ⏱️ {forecastDays} {language === 'mr' ? 'दिवस' : 'Days'}
              </span>
            </div>
          </div>

          {/* 🚨 IMPORTANT WEATHER ALERTS BANNER (If risk identified) */}
          {(probs.break_dry_spell > 35 || probs.heavy_rainfall > 35 || probs.monsoon_onset < 50) && (
            <div className="space-y-2">
              {probs.heavy_rainfall > 35 && (
                <div className="p-4 bg-red-500 text-white rounded-2xl shadow-md border-2 border-red-600 flex items-start gap-3 animate-pulse">
                  <CloudLightning className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sm sm:text-base font-black block">
                      🚨 {language === 'mr' ? 'मुसळधार पावसाचा इशारा!' : language === 'hi' ? 'भारी बारिश की चेतावनी!' : 'Heavy Rainfall Alert!'}
                    </strong>
                    <p className="text-xs sm:text-sm text-red-100 mt-0.5">
                      {language === 'mr'
                        ? `मुसळधार पावसाची शक्यता ${probs.heavy_rainfall}% आहे. शेतातील पाणी निचरा मार्ग तुरंत मोकळे करा.`
                        : `Heavy rainfall risk is ${probs.heavy_rainfall}%. Clear field drainage channels immediately.`}
                    </p>
                  </div>
                </div>
              )}

              {probs.break_dry_spell > 35 && (
                <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl shadow-md border-2 border-amber-600 flex items-start gap-3">
                  <Sun className="w-6 h-6 text-slate-950 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sm sm:text-base font-black block">
                      ⚠️ {language === 'mr' ? 'पावसाच्या खंडाचा धोका (Dry Spell Alert)' : 'Dry Spell Risk Warning'}
                    </strong>
                    <p className="text-xs sm:text-sm text-slate-900 mt-0.5">
                      {language === 'mr'
                        ? `पावसात खंड पडण्याचा धोका ${probs.break_dry_spell}% आहे. सिंचनाची पर्यायी व्यवस्था तयार ठेवा.`
                        : `Risk of rain hiatus is ${probs.break_dry_spell}%. Prepare backup protective irrigation.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 📊 4 KEY CARDS GRID: Onset | Dry Spell | Heavy Rain | Confidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">

            {/* Card 1: Monsoon Onset */}
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                  <CloudRain className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'mr' ? 'पाऊस आगमन' : 'Monsoon Onset'}</span>
                </div>
                <div className="text-4xl font-black text-emerald-900 my-2 font-mono tracking-tight">
                  {probs.monsoon_onset}%
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-1 border border-slate-200">
                <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${probs.monsoon_onset}%` }}></div>
              </div>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                probs.monsoon_onset >= 70 ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
              }`}>
                {probs.monsoon_onset >= 70
                  ? (language === 'mr' ? '✓ उत्तम पाऊस योग' : '✓ High Onset Likelihood')
                  : (language === 'mr' ? '⚠️ मध्यम पाऊस' : '⚠️ Moderate Onset')}
              </span>
            </div>

            {/* Card 2: Dry Spell Risk */}
            <div className="bg-white border-2 border-amber-500 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-amber-800 text-xs font-black uppercase tracking-wider mb-1">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>{language === 'mr' ? 'पावसातील खंड' : 'Dry Spell Risk'}</span>
                </div>
                <div className="text-4xl font-black text-amber-900 my-2 font-mono tracking-tight">
                  {probs.break_dry_spell}%
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-1 border border-slate-200">
                <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${probs.break_dry_spell}%` }}></div>
              </div>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                probs.break_dry_spell > 35 ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {probs.break_dry_spell > 35
                  ? (language === 'mr' ? '⚠️ खंडाचा धोका' : '⚠️ Moisture Stress Risk')
                  : (language === 'mr' ? '✓ धोका कमी' : '✓ Low Risk')}
              </span>
            </div>

            {/* Card 3: Heavy Rain Risk */}
            <div className="bg-white border-2 border-purple-500 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-purple-800 text-xs font-black uppercase tracking-wider mb-1">
                  <CloudLightning className="w-4 h-4 text-purple-600" />
                  <span>{language === 'mr' ? 'अतिवृष्टी धोका' : 'Heavy Rain Risk'}</span>
                </div>
                <div className="text-4xl font-black text-purple-900 my-2 font-mono tracking-tight">
                  {probs.heavy_rainfall}%
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-1 border border-slate-200">
                <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${probs.heavy_rainfall}%` }}></div>
              </div>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                probs.heavy_rainfall > 35 ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-700'
              }`}>
                {probs.heavy_rainfall > 35
                  ? (language === 'mr' ? '⚡ अतिवृष्टी इशारा' : '⚡ Flood Watch Alert')
                  : (language === 'mr' ? '✓ सामान्य स्थिती' : '✓ Normal Range')}
              </span>
            </div>

            {/* Card 4: Forecast Confidence */}
            <div className="bg-white border-2 border-sky-500 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-sky-800 text-xs font-black uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>{language === 'mr' ? 'अंदाज अचूकता' : 'Confidence'}</span>
                </div>
                <div className="text-4xl font-black text-sky-900 my-2 font-mono tracking-tight">
                  {forecastData?.confidence_level || 88}%
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-1 border border-slate-200">
                <div className="bg-sky-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${forecastData?.confidence_level || 88}%` }}></div>
              </div>
              <span className="text-[11px] font-extrabold bg-sky-100 text-sky-900 px-2 py-0.5 rounded-full mt-1">
                🎯 {language === 'mr' ? 'सत्यापित मॉडेल' : 'IMD Verified Grid'}
              </span>
            </div>

          </div>

          {/* 🌱 "WHAT SHOULD I DO?" (CROP ADVISORY ACTION BOX) */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-600 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-lg shadow">
                  🌱
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {language === 'mr'
                      ? 'मी आता काय करावे? (कृषी सल्ला)'
                      : language === 'hi'
                      ? 'मुझे अभी क्या करना चाहिए? (फसल सलाह)'
                      : 'What Should I Do? (Crop Advice)'}
                  </h2>
                  <span className="text-xs text-emerald-800 font-bold">
                    {cropList.find(c => c.id === selectedCrop)?.name || 'Soybean'} • {forecastDays}-{language === 'mr' ? 'दिवसीय मार्गदर्शक' : 'Day Advisory'}
                  </span>
                </div>
              </div>

              {/* 🔊 Listen Audio Button */}
              <button
                onClick={() => handleToggleSpeak(localizedRecommendation)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                  isSpeaking && activeSpeakingText === localizedRecommendation
                    ? 'bg-amber-400 text-slate-950 border-amber-500 animate-pulse'
                    : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                }`}
                title={isSpeaking && activeSpeakingText === localizedRecommendation ? 'Click to stop audio' : 'Listen to advisory'}
              >
                {isSpeaking && activeSpeakingText === localizedRecommendation ? (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-900" />
                    <span>{language === 'mr' ? 'थांबवा' : language === 'hi' ? 'रोकें' : 'Stop'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-800" />
                    <span>{language === 'mr' ? '🔊 ऐका' : language === 'hi' ? '🔊 सुनें' : '🔊 Listen'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Main Primary Action Callout */}
            <div className="bg-white border-l-4 border-emerald-700 p-4 rounded-r-xl shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                ▶ {language === 'mr' ? 'मुख्य कृषी सल्ला:' : 'Primary Farm Action:'}
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {localizedRecommendation || 'Proceed with field preparation and sow upon receiving wetting rain.'}
              </p>
            </div>

            {/* 3-4 Simple Bullet Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {localizedReasons.map((reason, idx) => (
                <div key={idx} className="bg-white/80 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 👨‍🌾 KISAN SAHAYAK AI AGENT (TEXT + VOICE CHAT) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden">

            {/* Agent Header */}
            <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-inner shrink-0 border border-emerald-400">
                  👨‍🌾
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wide text-emerald-300 flex items-center gap-1.5">
                    <span>{language === 'mr' ? 'किसान सहाय्यक एआय (व्हॉइस सहाय्यक)' : language === 'hi' ? 'किसान सहायक एआई (आवाज सहायक)' : 'Kisan Sahayak AI (Voice Agent)'}</span>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'mr' ? 'मराठी, हिंदी व इंग्रजी भाषेत प्रश्न विचारा किंवा बोला' : 'Ask or speak your question in Marathi, Hindi, or English'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMessages([{ id: 'reset', sender: 'agent', text: 'Chat reset. Ask your question!', timestamp: '' }])}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Thread */}
            <div className="p-4 h-[300px] sm:h-[360px] overflow-y-auto space-y-3 bg-slate-950/60 backdrop-blur-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
                    {m.sender === 'user' ? (
                      <span>You</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Kisan Sahayak</span>
                    )}
                  </div>

                  <div className="flex items-end gap-2 max-w-[90%]">
                    <div
                      className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-amber-400 text-slate-950 font-bold rounded-tr-none shadow'
                          : 'bg-slate-900 border border-slate-700 text-slate-100 rounded-tl-none shadow-md'
                      }`}
                    >
                      <div>{m.text}</div>

                      {/* Verified NLP Pipeline & Grounded ML Chips */}
                      {m.sender === 'agent' && (m.verifiedData || m.nlpMeta) && (
                        <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[10px]">
                          {m.nlpMeta?.lang && (
                            <span className="bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded font-bold">
                              🗣️ {m.nlpMeta.lang}
                            </span>
                          )}
                          {m.nlpMeta?.intent && (
                            <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-bold">
                              🎯 {m.nlpMeta.intent.replace(/_/g, ' ')}
                            </span>
                          )}
                          {m.verifiedData?.onset !== undefined && (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                              Onset: {m.verifiedData.onset}%
                            </span>
                          )}
                          {m.verifiedData?.breakRisk !== undefined && (
                            <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                              Break: {m.verifiedData.breakRisk}%
                            </span>
                          )}
                          {m.verifiedData?.heavyRain !== undefined && (
                            <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono font-bold">
                              Heavy: {m.verifiedData.heavyRain}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Speaker Button for Agent Message */}
                    {m.sender === 'agent' && (
                      <button
                        onClick={() => handleToggleSpeak(m.text)}
                        className={`p-2 rounded-full transition shrink-0 cursor-pointer ${
                          isSpeaking && activeSpeakingText === m.text
                            ? 'bg-amber-400 text-slate-950 animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                        }`}
                        title={isSpeaking && activeSpeakingText === m.text ? 'Click to stop' : 'Listen to response'}
                      >
                        {isSpeaking && activeSpeakingText === m.text ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900 p-3 rounded-xl border border-slate-800 w-max animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{language === 'mr' ? 'हवामान माहिती शोधत आहे...' : 'Analyzing predictions & generating response...'}</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Quick Question Chips */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {agentPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendAgentMessage(prompt)}
                    disabled={chatLoading}
                    className="text-xs bg-slate-800 hover:bg-emerald-950 hover:border-emerald-500 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-full transition active:scale-95"
                  >
                    🌱 "{prompt}"
                  </button>
                ))}
              </div>

              {/* Voice Status / Error Banner */}
              {voiceNotice && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition ${
                    isListening
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                      : 'bg-amber-950 border border-amber-500 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isListening ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
                    <span>{voiceNotice}</span>
                  </div>
                  {isListening && (
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[11px] rounded font-bold shrink-0 cursor-pointer"
                    >
                      {language === 'mr' ? 'थांबवा' : 'Stop'}
                    </button>
                  )}
                </div>
              )}

              {/* Chat Input + Voice Mic Button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAgentMessage();
                }}
                className="flex items-center gap-2 pt-1"
              >
                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-xl font-bold transition shrink-0 flex items-center justify-center cursor-pointer ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white active:scale-95'
                  }`}
                  title={isListening ? 'Listening... Click to stop' : 'Click to speak (Voice Query)'}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-white" />
                  )}
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    isListening
                      ? (language === 'mr' ? '🎙️ ऐकत आहे... बोला!' : '🎙️ Listening... Speak now!')
                      : (language === 'mr' ? 'प्रश्न टाईप करा किंवा बोलण्यासाठी माईक वर क्लिक करा...' : 'Type question or tap mic to speak...')
                  }
                  className="flex-1 min-w-0 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                />

                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'mr' ? 'पाठवा' : 'Send'}</span>
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
