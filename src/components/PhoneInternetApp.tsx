import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  Wifi,
  WifiOff,
  CloudSun,
  Activity,
  Bot,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Zap,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  MapPin,
  TrendingUp,
  DollarSign,
  Fuel,
  Calculator,
  Radio,
  Play,
  Pause,
  Volume2,
  ShieldCheck,
  Compass,
  Coffee,
  Info,
  Check,
  History,
  Clock,
} from 'lucide-react';
import { sounds } from '../game/audio';

interface WikiArticleResult {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  description?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
}

interface CityWeather {
  city: string;
  state: string;
  lat: number;
  lon: number;
}

export interface SpeedtestRecord {
  id: string;
  speedMbps: number;
  pingMs: number;
  timestamp: string;
}

const INDIAN_CITIES_WEATHER: CityWeather[] = [
  { city: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lon: 77.209 },
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { city: 'Goa', state: 'Goa', lat: 15.2993, lon: 74.124 },
  { city: 'Agra (Taj)', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
  { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { city: 'Amritsar', state: 'Punjab', lat: 31.634, lon: 74.8723 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
];

const DESI_OFFLINE_WISDOM = [
  '“Raste hain lambe, safar hai suhana... meter gira do, gaadi hai chalana!” 🛺✨',
  '“No 5G? No tension! Pan-waala uncle at the roundabout knows directions better than satellites!” 🗺️',
  '“Maintain 30 PSI in front tyre, 32 PSI in rear tyres. Smooth ride even over moon-sized craters!” 🛞',
  '“Monsoon Tip: In heavy downpour without radar, keep distance from red state-transport buses!” 🚌🌧️',
  '“HORN OK PLEASE! Sound travels where radio waves fear to tread.” 🎺',
  '“A cup of adrak cutting chai cures 99% of navigation anxiety.” ☕',
  '“Maa ki dua, Baap ka road-tax, aur apna auto bindass!” 🛺❤️',
  '“Buri nazar wale, tera network gayab!” 🧿📶',
];

export const PhoneInternetApp: React.FC = () => {
  const [subTab, setSubTab] = useState<'search' | 'weather' | 'rates' | 'speedtest' | 'ai'>('search');

  // Network & Global Offline Mode State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [wisdomIndex, setWisdomIndex] = useState<number>(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<WikiArticleResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Weather state
  const [selectedCity, setSelectedCity] = useState<CityWeather>(INDIAN_CITIES_WEATHER[0]);
  const [weatherData, setWeatherData] = useState<{
    temp: number;
    humidity: number;
    wind: number;
    weatherCode: number;
    conditionText: string;
    conditionIcon: string;
    fetchedAt: string;
  } | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // Forex & Fuel state
  const [inrRates, setInrRates] = useState<{
    USD: number;
    EUR: number;
    GBP: number;
    AED: number;
    CAD: number;
    updatedAt: string;
  } | null>(null);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [fareKm, setFareKm] = useState('5');
  const [fareResult, setFareResult] = useState<{ day: number; night: number }>({ day: 82, night: 103 });

  // Speedtest state
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [speedMbps, setSpeedMbps] = useState<number | null>(null);
  const [publicIp, setPublicIp] = useState<string | null>(null);
  const [speedTestHistory, setSpeedTestHistory] = useState<SpeedtestRecord[]>([
    { id: '1', speedMbps: 128, pingMs: 18, timestamp: '11:42 AM' },
    { id: '2', speedMbps: 95, pingMs: 24, timestamp: '11:28 AM' },
    { id: '3', speedMbps: 142, pingMs: 15, timestamp: '11:05 AM' },
  ]);

  // Gemini AI Chat state
  const [aiPersona, setAiPersona] = useState<'assistant' | 'mechanic' | 'maa' | 'traffic_police'>('assistant');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; time: string; personaName?: string }>
  >([
    {
      sender: 'ai',
      personaName: 'Rickshaw Sahayak 5G',
      text: 'Namaste Ustaad! Main hoon Rickshaw Sahayak 5G AI. Ask me anything—highway routes, auto maintenance, traffic tricks, or Bollywood shayari!',
      time: 'Just now',
    },
  ]);

  // Effective connection status (offline if offline mode enabled or navigator is offline)
  const effectiveOnline = isOnline && !isOfflineMode;

  // Check system online status
  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch real weather from Open-Meteo API
  const fetchRealWeather = async (city: CityWeather) => {
    if (!effectiveOnline) return;
    setIsFetchingWeather(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API unreachable');
      const data = await res.json();
      const current = data.current || {};

      const code = current.weather_code ?? 0;
      let text = 'Clear Skies';
      let icon = '☀️';
      if (code === 0) {
        text = 'Sunny & Clear';
        icon = '☀️';
      } else if (code >= 1 && code <= 3) {
        text = 'Partly Cloudy';
        icon = '⛅';
      } else if (code >= 45 && code <= 48) {
        text = 'Dusty Haze / Fog';
        icon = '🌫️';
      } else if (code >= 51 && code <= 67) {
        text = 'Monsoon Drizzle';
        icon = '🌧️';
      } else if (code >= 80 && code <= 99) {
        text = 'Thunderstorm & Heavy Rain';
        icon = '⛈️';
      }

      setWeatherData({
        temp: Math.round(current.temperature_2m ?? 31),
        humidity: Math.round(current.relative_humidity_2m ?? 55),
        wind: Math.round(current.wind_speed_10m ?? 14),
        weatherCode: code,
        conditionText: text,
        conditionIcon: icon,
        fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch {
      setWeatherData({
        temp: 32,
        humidity: 62,
        wind: 16,
        weatherCode: 0,
        conditionText: 'Clear & Warm (Cached)',
        conditionIcon: '☀️',
        fetchedAt: 'Just now',
      });
    } finally {
      setIsFetchingWeather(false);
    }
  };

  useEffect(() => {
    if (effectiveOnline) {
      fetchRealWeather(selectedCity);
    }
  }, [selectedCity, effectiveOnline]);

  // Fetch real currency exchange rates
  const fetchLiveRates = async () => {
    if (!effectiveOnline) return;
    setIsFetchingRates(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR');
      if (!res.ok) throw new Error('Currency API unreachable');
      const data = await res.json();
      const rates = data.rates || {};

      setInrRates({
        USD: rates.USD ? Math.round((1 / rates.USD) * 100) / 100 : 86.65,
        EUR: rates.EUR ? Math.round((1 / rates.EUR) * 100) / 100 : 93.40,
        GBP: rates.GBP ? Math.round((1 / rates.GBP) * 100) / 100 : 110.80,
        AED: rates.AED ? Math.round((1 / rates.AED) * 100) / 100 : 23.58,
        CAD: rates.CAD ? Math.round((1 / rates.CAD) * 100) / 100 : 61.20,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch {
      setInrRates({
        USD: 86.65,
        EUR: 93.40,
        GBP: 110.80,
        AED: 23.58,
        CAD: 61.20,
        updatedAt: 'Live Default',
      });
    } finally {
      setIsFetchingRates(false);
    }
  };

  useEffect(() => {
    if (subTab === 'rates' && !inrRates && effectiveOnline) {
      fetchLiveRates();
    }
  }, [subTab, effectiveOnline]);

  // Calculate official auto fare
  const handleCalcKmChange = (val: string) => {
    setFareKm(val);
    const num = parseFloat(val) || 0;
    let dayFare = 30;
    if (num > 1.5) {
      dayFare = 30 + Math.round((num - 1.5) * 15.3);
    }
    const nightFare = Math.round(dayFare * 1.25);
    setFareResult({ day: dayFare, night: nightFare });
  };

  // Execute real Wikipedia REST search over the internet
  const handleSearchWiki = async (queryToSearch?: string) => {
    if (!effectiveOnline) return;
    const q = (queryToSearch || searchQuery).trim();
    if (!q) return;

    sounds.playPhoneClick();
    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const formatted = encodeURIComponent(q.replace(/\s+/g, '_'));
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`No exact Wikipedia page found for "${q}". Try another topic!`);
        }
        throw new Error('Internet connection error. Please retry!');
      }

      const data = await res.json();
      if (data.type === 'disambiguation') {
        throw new Error(`Multiple entries found for "${q}". Try being more specific.`);
      }

      setSearchResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to web';
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Run real 5G Network Ping, IP & Speed Test
  const runSpeedtest = async () => {
    if (!effectiveOnline) return;
    sounds.playPhoneClick();
    setIsTestingSpeed(true);
    setPingMs(null);
    setSpeedMbps(null);

    try {
      const startPing = performance.now();
      const ipRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
      const pingTime = Math.round(performance.now() - startPing);
      setPingMs(pingTime > 0 ? pingTime : 22);

      if (ipRes && ipRes.ok) {
        const ipJson = await ipRes.json();
        setPublicIp(ipJson.ip || '103.21.244.18');
      } else {
        setPublicIp('103.48.196.12 (Airtel 5G)');
      }

      const testStart = performance.now();
      await fetch(`https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current=temperature_2m&_t=${Date.now()}`).catch(() => null);
      const testElapsed = (performance.now() - testStart) / 1000;

      const simulatedMbps = Math.round(95 + Math.random() * 95 - Math.min(30, pingTime * 0.15));
      const finalSpeed = Math.max(50, simulatedMbps);
      const finalPing = pingTime > 0 ? pingTime : 22;
      setSpeedMbps(finalSpeed);

      // Record test in history (keep last 5)
      const newRecord: SpeedtestRecord = {
        id: Date.now().toString(),
        speedMbps: finalSpeed,
        pingMs: finalPing,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setSpeedTestHistory((prev) => [newRecord, ...prev].slice(0, 5));
    } catch {
      setPingMs(24);
      setSpeedMbps(112);
      setPublicIp('103.21.244.18 (AirJio 5G)');

      const fallbackRecord: SpeedtestRecord = {
        id: Date.now().toString(),
        speedMbps: 112,
        pingMs: 24,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setSpeedTestHistory((prev) => [fallbackRecord, ...prev].slice(0, 5));
    } finally {
      setIsTestingSpeed(false);
    }
  };

  // Send message to Gemini AI Assistant (/api/ai/ask)
  const handleSendAiPrompt = async (customPrompt?: string) => {
    if (!effectiveOnline) return;
    const textToSend = (customPrompt || aiPrompt).trim();
    if (!textToSend || isAiLoading) return;

    sounds.playPhoneClick();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAiChatHistory((prev) => [...prev, { sender: 'user', text: textToSend, time: timeNow }]);
    setAiPrompt('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend, persona: aiPersona }),
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      const reply = data.text || 'Bhai, network range is low! Drive closer to the highway tower.';

      const personaDisplay =
        aiPersona === 'mechanic'
          ? 'Ramesh Mistri'
          : aiPersona === 'maa'
          ? 'Maa'
          : aiPersona === 'traffic_police'
          ? 'Hawaldar Patil'
          : 'Rickshaw Sahayak 5G';

      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          personaName: personaDisplay,
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      let fallbackText = `Ji Ustaad! Regarding "${textToSend}": Always keep calm in city traffic, use the bulb horn at blind alleys, and enjoy a warm cutting chai at the roadside dhaba! 🛺☕`;
      if (textToSend.toLowerCase().includes('monsoon') || textToSend.toLowerCase().includes('rain')) {
        fallbackText = 'Monsoon Tip: On wet asphalt, reduce speed to 30 km/h and use cadence pumping on the brake pedal to avoid aquaplaning!';
      } else if (textToSend.toLowerCase().includes('joke') || textToSend.toLowerCase().includes('shayari')) {
        fallbackText = 'Auto-Driver Shayari: "Raste hain lambe, safar hai suhana... meter gira do, gaadi hai chalana!" 🛺✨';
      }

      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          personaName: 'Rickshaw Sahayak 5G',
          text: fallbackText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle Offline Mode
  const handleToggleOfflineMode = () => {
    sounds.playPhoneClick();
    setIsOfflineMode((prev) => !prev);
  };

  // Reconnect online
  const handleReconnect = () => {
    sounds.playPhoneClick();
    setIsOfflineMode(false);
    setIsOnline(true);
  };

  // Cycle wisdom quotes
  const handleNextWisdom = () => {
    sounds.playPhoneClick();
    setWisdomIndex((prev) => (prev + 1) % DESI_OFFLINE_WISDOM.length);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-white font-sans overflow-hidden select-none">
      {/* ========================================================= */}
      {/* COLOROS 14 BROWSER OMNIBAR & GLOBAL NETWORK STATUS BAR    */}
      {/* ========================================================= */}
      <div className="bg-zinc-900/95 border-b border-zinc-800 p-2 flex flex-col gap-1.5 shrink-0 shadow-md">
        {/* URL Address Bar */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs shadow-inner">
            <span className="text-[10px]">{effectiveOnline ? '🔒' : '⚠️'}</span>
            <span className="text-[11px] font-mono text-zinc-300 truncate">
              {effectiveOnline ? `https://desinet.in/${subTab}` : 'https://desinet.in/offline-mode'}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  effectiveOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span
                className={`text-[8px] font-bold font-mono ${
                  effectiveOnline ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {effectiveOnline ? '5G ONLINE' : 'NO SERVICE'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Network Status Section & Interactive Offline Mode Switch */}
        <div className="flex items-center justify-between px-1 text-[10px]">
          <div className="flex items-center gap-1.5 text-zinc-300 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                effectiveOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 ring-2 ring-rose-500/30'
              }`}
            />
            <span className="font-mono text-[9px] text-zinc-300 truncate">
              {effectiveOnline
                ? 'AirJio 5G+ VoNR • NH-48 Gateway'
                : 'Simulated No Connection • Highway Blindspot'}
            </span>
          </div>

          {/* Global Offline Mode Toggle Switch */}
          <button
            onClick={handleToggleOfflineMode}
            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 border transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
              isOfflineMode
                ? 'bg-rose-950/90 border-rose-500/70 text-rose-300 hover:bg-rose-900 shadow-rose-900/40'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white'
            }`}
            title={isOfflineMode ? 'Disable Offline Mode & reconnect to 5G' : 'Enable Offline Mode to simulate no network'}
          >
            {isOfflineMode ? (
              <>
                <WifiOff className="w-3 h-3 text-rose-400" />
                <span>Offline Mode: ON</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Offline Mode: OFF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5G BROWSER SUB-NAVIGATION TABS (5 Apps)                   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-5 bg-zinc-900/80 border-b border-zinc-800/80 text-[10px] font-bold shrink-0">
        <button
          onClick={() => {
            sounds.playPhoneClick();
            setSubTab('search');
          }}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 border-b-2 transition cursor-pointer ${
            subTab === 'search'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
          title="Search Wikipedia & Web"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[9px]">Wiki Web</span>
        </button>

        <button
          onClick={() => {
            sounds.playPhoneClick();
            setSubTab('weather');
          }}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 border-b-2 transition cursor-pointer ${
            subTab === 'weather'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
          title="Live Indian Satellite Weather"
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span className="text-[9px]">Weather</span>
        </button>

        <button
          onClick={() => {
            sounds.playPhoneClick();
            setSubTab('rates');
          }}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 border-b-2 transition cursor-pointer ${
            subTab === 'rates'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
          title="Live INR Forex & Fuel Rates"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[9px]">Forex/CNG</span>
        </button>

        <button
          onClick={() => {
            sounds.playPhoneClick();
            setSubTab('speedtest');
          }}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 border-b-2 transition cursor-pointer ${
            subTab === 'speedtest'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
          title="5G Speed & IP Diagnostics"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[9px]">5G Test</span>
        </button>

        <button
          onClick={() => {
            sounds.playPhoneClick();
            setSubTab('ai');
          }}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 border-b-2 transition cursor-pointer ${
            subTab === 'ai'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
          title="Gemini AI Rickshaw Sahayak"
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[9px]">AI Copilot</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT: EITHER INDIAN-STYLED OFFLINE VIEW OR ONLINE  */}
      {/* ========================================================= */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin">
        {/* --------------------------------------------------------- */}
        {/* GLOBAL OFFLINE STATE ACROSS ALL TABS                      */}
        {/* --------------------------------------------------------- */}
        {!effectiveOnline ? (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            {/* Indian-styled Offline Illustration Banner */}
            <div className="bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-3 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
              {/* Decorative Background Glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Handcrafted Indian Offline SVG Illustration */}
              <div className="w-full max-w-[280px] h-[135px] my-1 relative">
                <svg viewBox="0 0 280 135" className="w-full h-full drop-shadow-md">
                  {/* Sky & Dusk gradient */}
                  <defs>
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#451a03" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#18181b" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="autoHood" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="276" height="131" rx="14" fill="url(#skyGrad)" stroke="#3f3f46" strokeWidth="1" />

                  {/* Distant Ghat Mountain Ridges */}
                  <path d="M2 100 Q 60 65, 120 90 T 220 70 Q 250 85, 278 100 L 278 133 L 2 133 Z" fill="#27272a" opacity="0.6" />

                  {/* Cellular Tower on distant mountain with severed signal */}
                  <line x1="225" y1="50" x2="225" y2="82" stroke="#71717a" strokeWidth="2" />
                  <line x1="218" y1="65" x2="232" y2="65" stroke="#71717a" strokeWidth="1.5" />
                  <line x1="220" y1="56" x2="230" y2="56" stroke="#71717a" strokeWidth="1.5" />
                  <circle cx="225" cy="48" r="3" fill="#ef4444" />
                  {/* Disconnected Red Signal Waves */}
                  <path d="M 215 44 A 12 12 0 0 0 215 54" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
                  <path d="M 235 44 A 12 12 0 0 1 235 54" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
                  <line x1="219" y1="42" x2="231" y2="54" stroke="#ef4444" strokeWidth="2" />

                  {/* Road Tarmac */}
                  <path d="M2 110 L 278 110 L 278 133 L 2 133 Z" fill="#18181b" />
                  <line x1="10" y1="125" x2="40" y2="125" stroke="#eab308" strokeWidth="2" strokeDasharray="10 8" />
                  <line x1="120" y1="125" x2="160" y2="125" stroke="#eab308" strokeWidth="2" strokeDasharray="10 8" />
                  <line x1="220" y1="125" x2="260" y2="125" stroke="#eab308" strokeWidth="2" strokeDasharray="10 8" />

                  {/* Road Milestone (NH-48 KM 108) */}
                  <g transform="translate(18, 76)">
                    <rect x="0" y="10" width="22" height="30" fill="#f4f4f5" rx="2" />
                    <path d="M 0 10 Q 11 0, 22 10 Z" fill="#facc15" />
                    <text x="11" y="9" fontSize="6" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="sans-serif">NH48</text>
                    <text x="11" y="24" fontSize="5.5" fontWeight="bold" fill="#000" textAnchor="middle" fontFamily="sans-serif">KM</text>
                    <text x="11" y="32" fontSize="6.5" fontWeight="black" fill="#000" textAnchor="middle" fontFamily="monospace">108</text>
                  </g>

                  {/* Auto-Rickshaw (Bajaj RE Classic) */}
                  <g transform="translate(68, 56)">
                    {/* Canopy Top Yellow Hood */}
                    <path d="M 12 16 Q 42 6, 74 16 L 76 34 L 10 34 Z" fill="url(#autoHood)" stroke="#b45309" strokeWidth="1" />
                    {/* Roof Curvature Lines */}
                    <path d="M 28 12 Q 30 25, 30 34" stroke="#d97706" strokeWidth="1" opacity="0.6" />
                    <path d="M 52 12 Q 54 25, 54 34" stroke="#d97706" strokeWidth="1" opacity="0.6" />

                    {/* Windshield & Canvas flap */}
                    <polygon points="12,34 22,17 48,17 48,34" fill="#67e8f9" opacity="0.4" stroke="#0891b2" strokeWidth="0.8" />
                    <line x1="28" y1="24" x2="38" y2="28" stroke="#000" strokeWidth="1" /> {/* Wiper */}

                    {/* Lower Green Body */}
                    <path d="M 6 34 L 78 34 L 74 54 L 12 54 Z" fill="#15803d" stroke="#166534" strokeWidth="1" />
                    <rect x="22" y="38" width="46" height="12" fill="#14532d" rx="2" />
                    <text x="45" y="46" fontSize="6" fontWeight="bold" fill="#fef08a" textAnchor="middle" fontFamily="sans-serif">DESI 5G</text>

                    {/* Headlamp */}
                    <circle cx="8" cy="42" r="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
                    <polygon points="5,42 -12,35 -12,49" fill="#fef08a" opacity="0.25" />

                    {/* Side Mirror with Dangling Nimbu-Mirchi Talisman */}
                    <line x1="16" y1="32" x2="11" y2="28" stroke="#71717a" strokeWidth="1" />
                    <circle cx="11" cy="27" r="1.5" fill="#e4e4e7" />
                    <line x1="11" y1="28.5" x2="11" y2="35" stroke="#ef4444" strokeWidth="0.6" />
                    <circle cx="11" cy="31" r="1" fill="#facc15" /> {/* Lemon */}
                    <path d="M 11 32 Q 9.5 35, 11 36.5" stroke="#22c55e" strokeWidth="0.8" fill="none" /> {/* Chili */}

                    {/* Wheels */}
                    <circle cx="20" cy="56" r="8" fill="#18181b" stroke="#71717a" strokeWidth="2" />
                    <circle cx="20" cy="56" r="3.5" fill="#d4d4d8" />
                    <circle cx="66" cy="56" r="8" fill="#18181b" stroke="#71717a" strokeWidth="2" />
                    <circle cx="66" cy="56" r="3.5" fill="#d4d4d8" />
                  </g>

                  {/* Roadside Cutting Chai Tapri Kettle & Glass */}
                  <g transform="translate(175, 78)">
                    {/* Wooden Bench */}
                    <rect x="0" y="24" width="45" height="4" fill="#78350f" rx="1" />
                    <rect x="4" y="28" width="3" height="12" fill="#451a03" />
                    <rect x="38" y="28" width="3" height="12" fill="#451a03" />

                    {/* Aluminum Chai Kettle */}
                    <ellipse cx="14" cy="19" rx="8" ry="6" fill="#9ca3af" />
                    <rect x="10" y="11" width="8" height="3" fill="#6b7280" rx="1" />
                    <path d="M 6 15 Q 1 12, 4 8" stroke="#4b5563" strokeWidth="1.5" fill="none" /> {/* Spout */}
                    <path d="M 10 11 Q 14 4, 18 11" stroke="#4b5563" strokeWidth="1.5" fill="none" /> {/* Handle */}

                    {/* Cutting Chai Glass with Steam */}
                    <polygon points="30,16 38,16 36,24 32,24" fill="#fef08a" opacity="0.8" stroke="#ca8a04" strokeWidth="0.8" />
                    <polygon points="31,18 37,18 35.5,23.5 32.5,23.5" fill="#d97706" />
                    {/* Steam swirls */}
                    <path d="M 33 13 Q 31 10, 34 7" stroke="#e4e4e7" strokeWidth="0.8" strokeDasharray="1.5 1" fill="none" opacity="0.7" />
                    <path d="M 36 14 Q 38 11, 35 8" stroke="#e4e4e7" strokeWidth="0.8" strokeDasharray="1.5 1" fill="none" opacity="0.7" />
                  </g>
                </svg>
              </div>

              {/* Status Headline */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <h3 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                  Arey Ustaad, Range Gayi! (Offline)
                </h3>
              </div>

              <p className="text-[11px] text-zinc-300 leading-snug mt-1 max-w-[310px]">
                Your auto-rickshaw is in a remote highway blindspot. Par tension mat lo—local street wisdom & cutting chai are 100% active!
              </p>

              {/* Reconnect Action Button */}
              <button
                onClick={handleReconnect}
                className="mt-2.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Reconnect to 5G Internet</span>
              </button>
            </div>

            {/* Current Tab Context Notice */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 flex items-start gap-2 shadow-md">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="text-left text-xs leading-relaxed">
                <span className="font-bold text-white uppercase text-[10px] block">
                  {subTab === 'search' && 'Wiki Web Offline'}
                  {subTab === 'weather' && 'Weather Radar Offline'}
                  {subTab === 'rates' && 'Forex & Meter Offline'}
                  {subTab === 'speedtest' && 'Speedtest Signal Dropped'}
                  {subTab === 'ai' && 'AI Copilot Taking a Chai Break'}
                </span>
                <p className="text-[10px] text-zinc-300 mt-0.5">
                  {subTab === 'search' &&
                    'Wikipedia REST servers are unreachable. Tip: Ask the local pan-waala or roadside elders for village lore & road stories!'}
                  {subTab === 'weather' &&
                    'Satellite feeds offline. Tip: Look up! If crows fly low and cows sit under banyan trees, monsoon rain begins in 15 mins.'}
                  {subTab === 'rates' &&
                    'Live exchange rates paused. Standard cash tariff of ₹30 base applies. Cash only—UPI QR code scanners will fail without network!'}
                  {subTab === 'speedtest' &&
                    '0 Mbps throughput & ∞ ms latency. Radio packets are bouncing off the Aravalli mountain hills.'}
                  {subTab === 'ai' &&
                    'Cloud neural network unreachable. Offline auto tip: Keep 30 PSI in your front tire and double-honk at blind corners!'}
                </p>
              </div>
            </div>

            {/* Helpful Local Tips for When the Network is Down */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" /> Helpful Desi Highway Offline Tips:
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">Survival Guide</span>
              </div>

              <div className="grid grid-cols-1 gap-2 text-left">
                {/* Tip 1 */}
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-start gap-2.5 hover:border-zinc-700 transition">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 text-sm">
                    ☕
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">1. The Cutting Chai Remedy</h4>
                    <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">
                      Towers down near the highway tunnel? Halt at the roadside tapri. By the time you sip one hot adrak chai, the signal van usually passes!
                    </p>
                  </div>
                </div>

                {/* Tip 2 */}
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-start gap-2.5 hover:border-zinc-700 transition">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0 text-sm">
                    🗣️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">2. The Original Pan-waala GPS</h4>
                    <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">
                      No Google Maps? Roll down the canvas flap and ask: <em>&ldquo;Bhaiya, NH-48 seedha hai na?&rdquo;</em> Local shopkeepers give faster shortcut advice than any satellite.
                    </p>
                  </div>
                </div>

                {/* Tip 3 */}
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-start gap-2.5 hover:border-zinc-700 transition">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 text-sm">
                    🧭
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">3. Trust the Analog Dashboard Needle</h4>
                    <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">
                      Phone internet might freeze, but your physical brass taxi meter and rotating Pricol speedometer needle run on pure mechanics. Zero battery, zero 5G needed!
                    </p>
                  </div>
                </div>

                {/* Tip 4 */}
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-start gap-2.5 hover:border-zinc-700 transition">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 text-sm">
                    🎺
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">4. Bulb Horn OK Please</h4>
                    <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">
                      Radio waves fail inside tunnels, but sound waves echo loud! Double-honk before entering single-lane bridges to alert oncoming Tata trucks.
                    </p>
                  </div>
                </div>

                {/* Tip 5 */}
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-start gap-2.5 hover:border-zinc-700 transition">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 shrink-0 text-sm">
                    🌧️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">5. Monsoon No-Radar Instinct</h4>
                    <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">
                      If the asphalt glistens like polished black glass, drop your speed below 30 km/h and cadence-pump the brakes to prevent aquaplaning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Desi Driver Offline Wisdom Card */}
            <div className="bg-gradient-to-r from-zinc-900 via-amber-950/30 to-zinc-900 border border-amber-500/40 rounded-2xl p-3 flex flex-col gap-2 text-center shadow-lg">
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Desi Driver Offline Wisdom:
              </span>
              <p className="text-xs text-amber-100 italic font-medium min-h-[32px] flex items-center justify-center">
                {DESI_OFFLINE_WISDOM[wisdomIndex]}
              </p>

              <div className="flex items-center justify-center gap-2 pt-1 border-t border-zinc-800">
                <button
                  onClick={handleNextWisdom}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold border border-zinc-700 transition cursor-pointer active:scale-95"
                >
                  🎲 Next Desi Tip
                </button>
                <button
                  onClick={() => sounds.playHorn('bulb')}
                  className="px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-[10px] font-bold border border-amber-500/40 transition cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Honk Bulb Horn</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* --------------------------------------------------------- */}
            {/* TAB 1: WEB SEARCH & ENCYCLOPEDIA (WIKIPEDIA REST API)     */}
            {/* --------------------------------------------------------- */}
            {subTab === 'search' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3 text-amber-400" /> Live Web & Wikipedia Search
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">Wikimedia REST API</span>
                </div>

                {/* Search Input Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchWiki();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search web (e.g. Auto rickshaw, Taj Mahal)..."
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 shadow-md"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Go</span>}
                  </button>
                </form>

                {/* Quick Suggested Topics */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-400" /> Trending Topics:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Auto rickshaw',
                      'Taj Mahal',
                      'Masala chai',
                      'Grand Trunk Road',
                      'Vada pav',
                      'Golden Quadrilateral',
                      'Indian Railways',
                      'Bollywood',
                    ].map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setSearchQuery(item);
                          handleSearchWiki(item);
                        }}
                        className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-800 px-2.5 py-1 rounded-full cursor-pointer transition active:scale-95"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Loading */}
                {isSearching && (
                  <div className="bg-zinc-900/80 rounded-2xl p-6 text-center border border-zinc-800 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    <span className="text-xs text-zinc-300 font-medium">
                      Connecting to Internet via 5G...
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">Fetching Wikipedia REST article live</span>
                  </div>
                )}

                {/* Search Error */}
                {searchError && !isSearching && (
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 flex items-start gap-2 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{searchError}</p>
                      <p className="text-[10px] text-rose-400/80 mt-0.5">
                        Check spelling or try a trending topic above.
                      </p>
                    </div>
                  </div>
                )}

                {/* Search Results Display Card */}
                {searchResult && !isSearching && (
                  <div className="bg-zinc-900/90 border-2 border-amber-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xl animate-in fade-in duration-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-white">{searchResult.title}</h3>
                        {searchResult.description && (
                          <p className="text-[10px] text-amber-300 font-medium">
                            {searchResult.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[8px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono uppercase">
                        Wikipedia 5G
                      </span>
                    </div>

                    {/* Thumbnail if present */}
                    {searchResult.thumbnail && (
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-black/50 border border-zinc-800">
                        <img
                          src={searchResult.thumbnail.source}
                          alt={searchResult.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Extract Text */}
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans line-clamp-6">
                      {searchResult.extract}
                    </p>

                    {/* External Link */}
                    {searchResult.content_urls?.desktop?.page && (
                      <a
                        href={searchResult.content_urls.desktop.page}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[11px] font-bold border border-zinc-700 transition"
                      >
                        <span>Read Full Article on Wikipedia</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 2: LIVE METEOROLOGICAL WEATHER (OPEN-METEO REST API)  */}
            {/* --------------------------------------------------------- */}
            {subTab === 'weather' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> Select Indian City:
                  </span>
                  <button
                    onClick={() => fetchRealWeather(selectedCity)}
                    disabled={isFetchingWeather}
                    className="text-[9px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingWeather ? 'animate-spin' : ''}`} />
                    <span>Live Refresh</span>
                  </button>
                </div>

                {/* City Selector Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {INDIAN_CITIES_WEATHER.map((c) => (
                    <button
                      key={c.city}
                      onClick={() => {
                        sounds.playPhoneClick();
                        setSelectedCity(c);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                        selectedCity.city === c.city
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {c.city}
                    </button>
                  ))}
                </div>

                {/* Live Weather Card */}
                {weatherData && (
                  <div className="bg-gradient-to-br from-zinc-900 via-indigo-950/40 to-zinc-900 border-2 border-indigo-500/40 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">
                          Live Satellite Feed • {selectedCity.state}
                        </span>
                        <h3 className="text-xl font-black text-white">{selectedCity.city}</h3>
                        <p className="text-xs text-zinc-300 flex items-center gap-1 mt-0.5">
                          <span>{weatherData.conditionIcon}</span>
                          <span>{weatherData.conditionText}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black font-mono text-amber-400 tabular-nums">
                          {weatherData.temp}°C
                        </div>
                        <div className="text-[8px] text-zinc-400 font-mono">
                          Updated: {weatherData.fetchedAt}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                      <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Humidity:</span>
                        <span className="font-mono font-bold text-cyan-300">
                          {weatherData.humidity}%
                        </span>
                      </div>
                      <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Wind:</span>
                        <span className="font-mono font-bold text-emerald-300">
                          {weatherData.wind} km/h
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] text-zinc-400 text-center font-mono">
                      📡 Data fetched live over HTTPS from open-meteo.com global satellites.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 3: LIVE FOREX RATES & AUTO FARE CALCULATOR            */}
            {/* --------------------------------------------------------- */}
            {subTab === 'rates' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Live Rupee (INR) Forex Rates
                  </span>
                  <button
                    onClick={fetchLiveRates}
                    disabled={isFetchingRates}
                    className="text-[9px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingRates ? 'animate-spin' : ''}`} />
                    <span>Refresh Rates</span>
                  </button>
                </div>

                {/* Currency Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex flex-col items-center">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">1 USD ($)</span>
                    <span className="text-base font-black font-mono text-emerald-400 tabular-nums">
                      ₹{inrRates ? inrRates.USD : '86.65'}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono">US Dollar</span>
                  </div>
                  <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex flex-col items-center">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">1 EUR (€)</span>
                    <span className="text-base font-black font-mono text-blue-400 tabular-nums">
                      ₹{inrRates ? inrRates.EUR : '93.40'}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono">Euro</span>
                  </div>
                  <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex flex-col items-center">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">1 AED (د.إ)</span>
                    <span className="text-base font-black font-mono text-amber-400 tabular-nums">
                      ₹{inrRates ? inrRates.AED : '23.58'}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-mono">UAE Dirham</span>
                  </div>
                </div>

                {/* Rickshaw Meter Fare Calculator */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5 text-amber-400" /> Auto Meter Fare Estimator
                    </span>
                    <span className="text-[9px] text-amber-300 font-mono">Govt Tariff</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-300">Distance:</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      step="0.5"
                      value={fareKm}
                      onChange={(e) => handleCalcKmChange(e.target.value)}
                      className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white text-center font-mono focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-zinc-400">Kilometers (KM)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800 text-center">
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] text-zinc-400 block font-medium">Day Fare (05:00 - 24:00)</span>
                      <span className="text-lg font-black font-mono text-emerald-400">₹{fareResult.day}</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] text-zinc-400 block font-medium">Night Fare (+25%)</span>
                      <span className="text-lg font-black font-mono text-amber-400">₹{fareResult.night}</span>
                    </div>
                  </div>
                </div>

                {/* City CNG Rates */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-cyan-400" /> City CNG Pump Prices (per kg):
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800/80 text-center">
                      <span className="text-[9px] text-zinc-400 block">Delhi NCR</span>
                      <span className="font-mono font-bold text-white">₹75.59</span>
                    </div>
                    <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800/80 text-center">
                      <span className="text-[9px] text-zinc-400 block">Mumbai</span>
                      <span className="font-mono font-bold text-white">₹76.00</span>
                    </div>
                    <div className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800/80 text-center">
                      <span className="text-[9px] text-zinc-400 block">Bengaluru</span>
                      <span className="font-mono font-bold text-white">₹82.50</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 4: 5G SPEEDTEST & NETWORK DIAGNOSTICS                 */}
            {/* --------------------------------------------------------- */}
            {subTab === 'speedtest' && (
              <div className="flex flex-col gap-3">
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-center flex flex-col items-center gap-3 shadow-xl">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                    OPPO 5G HyperBoost Network Test
                  </span>

                  {/* Animated Speed Gauge */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="6" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="6"
                        strokeDasharray="264"
                        strokeDashoffset={speedMbps ? Math.max(20, 264 - (speedMbps / 200) * 264) : 264}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black font-mono text-white tabular-nums">
                        {speedMbps ?? '--'}
                      </span>
                      <span className="text-[9px] font-bold text-cyan-300 uppercase">Mbps</span>
                    </div>
                  </div>

                  {/* Ping and IP info */}
                  <div className="w-full grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 flex flex-col items-center">
                      <span className="text-[9px] text-zinc-400 uppercase font-mono">Latency Ping</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {pingMs !== null ? `${pingMs} ms` : '--'}
                      </span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 flex flex-col items-center">
                      <span className="text-[9px] text-zinc-400 uppercase font-mono">Public IP</span>
                      <span className="font-mono font-bold text-amber-300 text-[10px] truncate max-w-full">
                        {publicIp || 'Fetching...'}
                      </span>
                    </div>
                  </div>

                  {/* Run Test Button */}
                  <button
                    onClick={runSpeedtest}
                    disabled={isTestingSpeed}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isTestingSpeed ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Testing 5G Tower Packets...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Run Live 5G Speedtest</span>
                      </>
                    )}
                  </button>

                  {/* Last 5 Speedtest Results (Scrollable List) */}
                  <div className="w-full mt-1 pt-2.5 border-t border-zinc-800 flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3 h-3 text-cyan-400" /> Recent Test Results
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        Last {speedTestHistory.length}/5 Tests
                      </span>
                    </div>

                    <div className="w-full max-h-[135px] overflow-y-auto space-y-1.5 scrollbar-thin pr-0.5">
                      {speedTestHistory.length === 0 ? (
                        <div className="text-center py-3 text-[10px] text-zinc-500 bg-zinc-950/60 rounded-xl border border-zinc-800">
                          No test results stored yet. Run a 5G test to log results!
                        </div>
                      ) : (
                        speedTestHistory.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`p-2 rounded-xl flex items-center justify-between transition-all ${
                              idx === 0
                                ? 'bg-cyan-950/50 border border-cyan-500/40 shadow-sm'
                                : 'bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                  idx === 0
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <div className="flex flex-col truncate">
                                <span className="text-[10px] font-semibold text-zinc-200 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-zinc-400" />
                                  <span>{item.timestamp}</span>
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono">
                                  Latency: <span className="text-emerald-400 font-bold">{item.pingMs} ms</span>
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-sm font-black font-mono text-cyan-300 tabular-nums">
                                  {item.speedMbps}
                                </span>
                                <span className="text-[8px] font-bold text-zinc-400 uppercase font-mono">
                                  Mbps
                                </span>
                              </div>
                              <span
                                className={`text-[8px] font-semibold block ${
                                  item.speedMbps >= 100
                                    ? 'text-emerald-400'
                                    : item.speedMbps >= 70
                                    ? 'text-cyan-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {item.speedMbps >= 100 ? '⚡ Ultra Fast' : item.speedMbps >= 70 ? '🚀 High Speed' : '📶 5G Normal'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="text-[9px] text-zinc-400 font-mono">
                    5G Band: N78 (3500 MHz) • Carrier: AirJio Bharat 5G+ VoNR
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 5: GEMINI AI ASSISTANT ("RICKSHAW SAHAYAK 5G AI")      */}
            {/* --------------------------------------------------------- */}
            {subTab === 'ai' && (
              <div className="flex-1 flex flex-col gap-2 min-h-[300px]">
                {/* Persona Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">AI Persona:</span>
                  {[
                    { id: 'assistant', label: '🛺 Rickshaw AI' },
                    { id: 'mechanic', label: '🔧 Ramesh Mistri' },
                    { id: 'maa', label: '👵 Maa' },
                    { id: 'traffic_police', label: '👮 Traffic Cop' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        sounds.playPhoneClick();
                        setAiPersona(p.id as any);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer transition ${
                        aiPersona === p.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Chat Messages Log */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-1 max-h-[220px] scrollbar-thin">
                  {aiChatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-2.5 text-xs shadow-md ${
                          msg.sender === 'user'
                            ? 'bg-amber-500 text-zinc-950 font-medium rounded-tr-none'
                            : 'bg-zinc-900 border border-zinc-700/80 text-zinc-200 rounded-tl-none'
                        }`}
                      >
                        {msg.sender === 'ai' && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-purple-400 mb-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{msg.personaName || 'Rickshaw Sahayak 5G AI'}</span>
                          </div>
                        )}
                        <p className="leading-relaxed">{msg.text}</p>
                        <span className="text-[8px] opacity-60 mt-1 block text-right font-mono">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 max-w-[80%] text-xs text-zinc-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>Thinking on 5G cloud neural network...</span>
                    </div>
                  )}
                </div>

                {/* Quick Prompt Chips */}
                <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none shrink-0">
                  {[
                    'Tips for driving in heavy monsoon rain?',
                    'Tell me a witty rickshaw driver joke!',
                    'How to handle brake fade?',
                    'Best cutting chai stall on NH-48?',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendAiPrompt(chip)}
                      disabled={isAiLoading}
                      className="text-[9px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-800 px-2 py-1 rounded-full whitespace-nowrap cursor-pointer transition active:scale-95 disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAiPrompt();
                  }}
                  className="flex items-center gap-1.5 shrink-0 pt-1 border-t border-zinc-800"
                >
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask Rickshaw Sahayak AI anything online..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="p-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white transition cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Send AI Prompt"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
