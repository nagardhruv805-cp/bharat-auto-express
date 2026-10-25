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
  Camera,
  Share2,
  Download,
  Copy,
  X,
  QrCode,
  ScanLine,
  Ticket,
  Gift,
  Focus,
  Maximize2,
  CheckCircle2,
  Award,
  Tag,
  HelpCircle,
  VolumeX,
  Disc,
  Music,
  Headphones,
  SkipBack,
  SkipForward,
  Power,
} from 'lucide-react';
import { sounds, RADIO_STATIONS, RadioStationInfo, RadioStationId } from '../game/audio';
import { capturePhoneInternetViewToCanvas } from '../game/capturePhoneView';
import { GameEngine, DhabaQrTarget, DhabaQrReward } from '../game/engine';

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

export interface DhabaCouponItem {
  id: string;
  code: string;
  title: string;
  dhabaName: string;
  category: 'Dhaba' | 'Milestone' | 'Haveli' | 'Highway' | 'DesiNet';
  badge: string;
  discountText: string;
  description: string;
  unlockedAt: string;
  isRedeemed: boolean;
  reward: DhabaQrReward;
}

const DEFAULT_DHABA_COUPONS: DhabaCouponItem[] = [
  {
    id: 'starter_dhaba_chai',
    code: 'SHARMA-CHAI-99',
    title: 'Sharmaji Cutting Chai Overdrive',
    dhabaName: 'Sharmaji Highway Chai & Nashta',
    category: 'Dhaba',
    badge: '☕ OVERDRIVE',
    discountText: '100% BOOST + ₹150',
    description: '100% Instant Chai Stamina Boost + ₹150 Rupee Cash Bounty.',
    unlockedAt: 'Highway Discovered',
    isRedeemed: false,
    reward: {
      type: 'chai',
      title: 'Sharmaji Cutting Chai Overdrive',
      amount: 150,
      description: '100% Instant Chai Stamina Boost + ₹150 Rupee Cash Bounty.',
      discountText: '100% BOOST + ₹150',
      badge: '☕ OVERDRIVE',
    },
  },
];

const KNOWN_SECRET_CODES: Record<
  string,
  {
    type: 'cash' | 'chai' | 'repair' | 'speed' | 'vip';
    title: string;
    dhabaName: string;
    category: DhabaCouponItem['category'];
    amount: number;
    description: string;
    discountText: string;
    badge: string;
  }
> = {
  'SHARMA-CHAI-99': {
    type: 'chai',
    title: 'Sharmaji Cutting Chai Overdrive',
    dhabaName: 'Sharmaji Highway Chai & Nashta',
    category: 'Dhaba',
    amount: 150,
    description: '100% Instant Chai Stamina Boost + ₹150 Rupee Cash Bounty.',
    discountText: '100% BOOST + ₹150',
    badge: '☕ OVERDRIVE',
  },
  'MUNNA-SAMOSA-24': {
    type: 'repair',
    title: 'Munna Tapri Samosa & Full Auto Overhaul',
    dhabaName: 'Munna Chai Tapri Pullover Bay',
    category: 'Dhaba',
    amount: 100,
    description: 'Crispy aloo samosa, adrak tea & complete 100% vehicle repair.',
    discountText: 'FREE SERVICE + ₹100',
    badge: '🛠️ 100% REPAIR',
  },
  'NH48-TOLL-FREE': {
    type: 'vip',
    title: 'NH-48 FASTag Highway VIP Pass',
    dhabaName: 'NH-48 National Highway Toll',
    category: 'Milestone',
    amount: 300,
    description: 'VIP Toll clearance & ₹300 bonus rupees for smooth transit.',
    discountText: '₹300 BONUS + VIP PASS',
    badge: '🛣️ FASTAG VIP',
  },
  'HAVELI-ROYALE-777': {
    type: 'cash',
    title: 'Maharaja Heritage Darbar Bounty',
    dhabaName: 'Grand Rajput Haveli Heritage Palace',
    category: 'Haveli',
    amount: 500,
    description: 'Royal Darbar jackpot: ₹500 golden rupee windfall!',
    discountText: '₹500 MEGA CASH',
    badge: '👑 ROYAL JACKPOT',
  },
  'NITRO-DHABA-TURBO': {
    type: 'speed',
    title: 'Desi Nitro Turbo Tune-up',
    dhabaName: 'Highway Truck Art "Horn OK Please"',
    category: 'Highway',
    amount: 120,
    description: 'Instant Nitro Overclock surge & high-RPM 2-stroke tuning.',
    discountText: 'TURBO KICK + ₹120',
    badge: '⚡ TURBO SURGE',
  },
  'AIRJIO-5G-VIP': {
    type: 'cash',
    title: 'DesiNet 5G High-Speed Highway Pass',
    dhabaName: 'AirJio 5G Monopole Transceiver',
    category: 'DesiNet',
    amount: 250,
    description: 'Unlimited 5G DesiNet data uplink & ₹250 cash reward.',
    discountText: '₹250 REWARD + 5G PASS',
    badge: '📶 5G UNLIMITED',
  },
  'DHABA100': {
    type: 'cash',
    title: 'Secret Highway Dhaba Chai Bounty',
    dhabaName: 'NH-48 Roadside Secret Stash',
    category: 'Dhaba',
    amount: 100,
    description: 'Bonus ₹100 cash voucher for highway foodies!',
    discountText: '₹100 BONUS CASH',
    badge: '💰 BONUS CASH',
  },
  'CHAI50': {
    type: 'chai',
    title: 'Hot Cutting Chai 50% Stamina Refill',
    dhabaName: 'Roadside Kulhad Chai Point',
    category: 'Dhaba',
    amount: 50,
    description: 'Quick stamina booster to navigate tight traffic jams.',
    discountText: '+50% CHAI BOOST',
    badge: '☕ CHAI REFILL',
  },
  'AUTOREPAIR': {
    type: 'repair',
    title: 'Chacha Mechanic Complete Body Overhaul',
    dhabaName: 'Highway Garage & Puncture Shop',
    category: 'Highway',
    amount: 75,
    description: 'Pristine 100% body repair & tune-up for bumpy potholes.',
    discountText: '100% HEALTH + ₹75',
    badge: '🔧 FULL TUNEUP',
  },
  'DESI2026': {
    type: 'cash',
    title: 'Grand Desi Auto 2026 Celebration Kit',
    dhabaName: 'Bharat Yatra Festival Special',
    category: 'DesiNet',
    amount: 250,
    description: 'Festive celebration reward with ₹250 cash prize!',
    discountText: '₹250 FESTIVE BONUS',
    badge: '🎉 FESTIVE REWARD',
  },
};

interface PhoneInternetAppProps {
  engine?: GameEngine | null;
}

export const PhoneInternetApp: React.FC<PhoneInternetAppProps> = ({ engine = null }) => {
  const [subTab, setSubTab] = useState<'search' | 'radio' | 'weather' | 'rates' | 'speedtest' | 'ai' | 'scanner'>('search');

  // Radio Station Selector State
  const [currentStationId, setCurrentStationId] = useState<RadioStationId>(() => {
    return engine?.state.currentStation?.id || sounds.currentStation || 'bollywood';
  });
  const [radioGenreFilter, setRadioGenreFilter] = useState<'all' | 'bollywood' | 'highway' | 'classical' | 'folk' | 'news'>('all');
  const [tuningFreqDisplay, setTuningFreqDisplay] = useState<string>(() => {
    const st = RADIO_STATIONS.find((s) => s.id === (engine?.state.currentStation?.id || sounds.currentStation));
    return st && st.frequency !== '--.- FM' ? st.frequency.replace(' FM', '') : '98.3';
  });

  // Keep radio state synchronized with engine state
  useEffect(() => {
    if (engine?.state.currentStation) {
      setCurrentStationId(engine.state.currentStation.id);
      if (engine.state.currentStation.frequency !== '--.- FM') {
        setTuningFreqDisplay(engine.state.currentStation.frequency.replace(' FM', ''));
      }
    }
  }, [engine?.state.currentStation]);

  const handleTuneRadio = (stationId: RadioStationId) => {
    sounds.playPhoneClick();
    setCurrentStationId(stationId);
    const station = RADIO_STATIONS.find((s) => s.id === stationId);
    if (station && station.frequency !== '--.- FM') {
      setTuningFreqDisplay(station.frequency.replace(' FM', ''));
    }
    if (engine) {
      engine.setRadioStation(stationId);
    } else {
      sounds.setRadioStation(stationId);
    }
  };

  const handleSeekRadio = (direction: 'next' | 'prev') => {
    sounds.playPhoneClick();
    const playable = RADIO_STATIONS.filter((s) => s.id !== 'off');
    const idx = playable.findIndex((s) => s.id === currentStationId);
    let targetIdx = 0;
    if (direction === 'next') {
      targetIdx = (idx + 1) % playable.length;
    } else {
      targetIdx = (idx - 1 + playable.length) % playable.length;
    }
    handleTuneRadio(playable[targetIdx].id);
  };

  const handleToggleRadioPower = () => {
    sounds.playPhoneClick();
    if (currentStationId === 'off') {
      handleTuneRadio('bollywood');
    } else {
      handleTuneRadio('off');
    }
  };

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

  // Phone View Screenshot & Sharing state
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [screenshotToast, setScreenshotToast] = useState<string | null>(null);

  // QR Code Scanner & Digital Dhaba Rewards State
  const [scannerMode, setScannerMode] = useState<'viewfinder' | 'targets' | 'code' | 'wallet'>('viewfinder');
  const [nearbyQrTargets, setNearbyQrTargets] = useState<DhabaQrTarget[]>([]);
  const [activeLockTarget, setActiveLockTarget] = useState<DhabaQrTarget | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [unlockedModalCoupon, setUnlockedModalCoupon] = useState<DhabaCouponItem | null>(null);
  const [isCameraFlashing, setIsCameraFlashing] = useState<boolean>(false);
  const [scannerSuccessToast, setScannerSuccessToast] = useState<string | null>(null);
  const viewfinderCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // One-time Onboarding Overlay / Help Modal for 3D Dhaba Scanner
  const [showQrOnboarding, setShowQrOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bharat_dhaba_qr_onboarding_seen') !== 'true';
    } catch {
      return true;
    }
  });
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  const handleDismissQrOnboarding = () => {
    sounds.playPhoneClick();
    setShowQrOnboarding(false);
    if (dontShowAgain) {
      try {
        localStorage.setItem('bharat_dhaba_qr_onboarding_seen', 'true');
      } catch {
        // Ignore storage errors
      }
    }
  };

  // LocalStorage-backed Coupons Wallet
  const [coupons, setCoupons] = useState<DhabaCouponItem[]>(() => {
    try {
      const saved = localStorage.getItem('desinet_dhaba_coupons_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load coupons from storage', e);
    }
    return DEFAULT_DHABA_COUPONS;
  });

  // Save coupons to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('desinet_dhaba_coupons_v1', JSON.stringify(coupons));
    } catch (e) {
      console.warn('Failed to save coupons to storage', e);
    }
  }, [coupons]);

  // Poll nearby 3D QR targets from GameEngine
  useEffect(() => {
    if (!engine) return;

    const updateTargets = () => {
      const targets = engine.getNearbyQrTargets();
      setNearbyQrTargets(targets);
      // Lock onto in-range target if available, or closest discovered target
      const inRangeTarget = targets.find((t) => t.inScanRange) || (targets.length > 0 ? targets[0] : null);
      setActiveLockTarget(inRangeTarget);
    };

    updateTargets();
    const interval = setInterval(updateTargets, 500);
    return () => clearInterval(interval);
  }, [engine]);

  // Mirror 3D WebGL Canvas inside the Viewfinder
  useEffect(() => {
    if (subTab !== 'scanner' || scannerMode !== 'viewfinder' || !engine) return;

    let animId: number;
    const canvas = viewfinderCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      const srcCanvas = engine.getCanvasElement();
      if (srcCanvas && srcCanvas.width > 0 && srcCanvas.height > 0) {
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
          canvas.width = canvas.clientWidth || 320;
          canvas.height = canvas.clientHeight || 240;
        }
        ctx.drawImage(srcCanvas, 0, 0, canvas.width, canvas.height);
      }
      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animId);
  }, [subTab, scannerMode, engine]);

  const unredeemedCouponsCount = coupons.filter((c) => !c.isRedeemed).length;

  // Scan Target Handler
  const handleScanTarget = (targetToScan: DhabaQrTarget) => {
    sounds.playPhoneClick();
    setIsCameraFlashing(true);
    setTimeout(() => setIsCameraFlashing(false), 300);

    sounds.playQrScanBeep();

    setTimeout(() => {
      const couponId = `coupon_${targetToScan.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const existing = coupons.find((c) => c.code === targetToScan.code);

      if (existing) {
        sounds.playCouponUnlock();
        setUnlockedModalCoupon(existing);
        setScannerSuccessToast(`Already in wallet: ${existing.title}!`);
        setTimeout(() => setScannerSuccessToast(null), 3000);
        return;
      }

      const newCoupon: DhabaCouponItem = {
        id: couponId,
        code: targetToScan.code,
        title: targetToScan.reward.title,
        dhabaName: targetToScan.title,
        category: targetToScan.category,
        badge: targetToScan.reward.badge,
        discountText: targetToScan.reward.discountText,
        description: targetToScan.reward.description,
        unlockedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRedeemed: false,
        reward: targetToScan.reward,
      };

      setCoupons((prev) => [newCoupon, ...prev]);
      sounds.playCouponUnlock();
      setUnlockedModalCoupon(newCoupon);
      setScannerSuccessToast(`🎉 Unlocked: ${newCoupon.title}!`);
      setTimeout(() => setScannerSuccessToast(null), 4000);
    }, 450);
  };

  // Manual Code / Promo Voucher Handler
  const handleClaimManualCode = (codeToClaim?: string) => {
    const raw = (codeToClaim || manualCodeInput).trim().toUpperCase();
    if (!raw) return;
    sounds.playPhoneClick();

    setIsCameraFlashing(true);
    setTimeout(() => setIsCameraFlashing(false), 250);
    sounds.playQrScanBeep();

    setTimeout(() => {
      const match = KNOWN_SECRET_CODES[raw];
      if (!match) {
        setScannerSuccessToast(`❌ Code "${raw}" not recognized. Check 3D roadside dhabas!`);
        setTimeout(() => setScannerSuccessToast(null), 3500);
        return;
      }

      const couponId = `coupon_${raw.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const existing = coupons.find((c) => c.code === raw);
      if (existing) {
        sounds.playCouponUnlock();
        setUnlockedModalCoupon(existing);
        setScannerSuccessToast(`Already in wallet: ${existing.title}!`);
        setTimeout(() => setScannerSuccessToast(null), 3000);
        setManualCodeInput('');
        return;
      }

      const newCoupon: DhabaCouponItem = {
        id: couponId,
        code: raw,
        title: match.title,
        dhabaName: match.dhabaName,
        category: match.category,
        badge: match.badge,
        discountText: match.discountText,
        description: match.description,
        unlockedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRedeemed: false,
        reward: {
          type: match.type,
          title: match.title,
          amount: match.amount,
          description: match.description,
          discountText: match.discountText,
          badge: match.badge,
        },
      };

      setCoupons((prev) => [newCoupon, ...prev]);
      sounds.playCouponUnlock();
      setUnlockedModalCoupon(newCoupon);
      setManualCodeInput('');
      setScannerSuccessToast(`🎉 Unlocked Secret Reward: ${newCoupon.title}!`);
      setTimeout(() => setScannerSuccessToast(null), 4000);
    }, 400);
  };

  // Redeem Coupon into Vehicle Game State
  const handleRedeemCoupon = (coupon: DhabaCouponItem) => {
    if (coupon.isRedeemed) return;
    sounds.playPhoneClick();

    if (engine) {
      engine.redeemDhabaReward(coupon.reward);
    } else {
      sounds.playCouponUnlock();
    }

    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isRedeemed: true } : c))
    );

    setScannerSuccessToast(`✅ Redeemed: ${coupon.reward.title}! Applied to rickshaw!`);
    setTimeout(() => setScannerSuccessToast(null), 3500);
  };

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

  // Share Screenshot Handler: triggers browser canvas capture and opens system share dialog
  const handleShareScreenshot = async () => {
    sounds.playPhoneClick();
    setIsCapturingScreenshot(true);
    setScreenshotToast('Capturing 5G phone view...');

    try {
      const lastAiMsg = aiChatHistory.length > 0 ? aiChatHistory[aiChatHistory.length - 1].text : undefined;
      const personaLabels: Record<string, string> = {
        assistant: 'Rickshaw Sahayak 5G',
        mechanic: 'Chacha Mechanic',
        maa: 'Maa Ki Mamta',
        traffic_police: 'Traffic Havaldar',
      };

      const activeStation = RADIO_STATIONS.find((s) => s.id === currentStationId);

      const result = await capturePhoneInternetViewToCanvas({
        subTab,
        effectiveOnline,
        isOfflineMode,
        radioStation: activeStation
          ? {
              name: activeStation.name,
              frequency: activeStation.frequency,
              genre: activeStation.genre,
              djName: activeStation.djName,
              trackName: activeStation.trackName,
              tagline: activeStation.tagline,
              color: activeStation.color,
            }
          : null,
        searchQuery,
        searchResult: searchResult
          ? {
              title: searchResult.title,
              extract: searchResult.extract,
              description: searchResult.description,
            }
          : null,
        selectedCity: {
          city: selectedCity.city,
          state: selectedCity.state,
        },
        weatherData: weatherData
          ? {
              temp: weatherData.temp,
              humidity: weatherData.humidity,
              wind: weatherData.wind,
              conditionText: weatherData.conditionText,
              conditionIcon: weatherData.conditionIcon,
            }
          : null,
        speedMbps,
        pingMs,
        speedTestHistory,
        inrRates,
        fareKm,
        fareResult,
        aiPersona: personaLabels[aiPersona] || 'Rickshaw Sahayak 5G',
        lastAiMessage: lastAiMsg,
        offlineWisdom: DESI_OFFLINE_WISDOM[wisdomIndex],
        qrScanTargetName: activeLockTarget?.title,
        qrScannedCouponsCount: coupons.length,
      });

      setScreenshotDataUrl(result.dataUrl);
      setScreenshotBlob(result.blob);

      // Trigger browser native system share dialog with image file
      const fileName = `desi-rickshaw-5g-${subTab}-${Date.now()}.png`;
      const file = new File([result.blob], fileName, { type: 'image/png' });

      let sharedViaNative = false;
      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `Desi Rickshaw 5G Smartphone - ${subTab.toUpperCase()}`,
            text: `Check out my live 5G connection & ${subTab} telemetry in Indian Tuk-Tuk Auto Simulator! 🛺📱`,
          });
          sharedViaNative = true;
          setScreenshotToast('Shared successfully!');
          setTimeout(() => setScreenshotToast(null), 3000);
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            setScreenshotToast('Share dismissed. You can download or copy below.');
          } else {
            console.warn('Native share error, fallback to preview modal:', shareErr);
            setScreenshotToast('Screenshot ready! Download or copy below.');
          }
        }
      }

      if (!sharedViaNative) {
        setScreenshotToast('Screenshot ready! Download or copy below.');
      }
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      setScreenshotToast('Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturingScreenshot(false);
      setTimeout(() => setScreenshotToast(null), 4000);
    }
  };

  const handleDownloadScreenshot = () => {
    if (!screenshotDataUrl) return;
    sounds.playPhoneClick();
    const link = document.createElement('a');
    link.download = `desinet-screenshot-${subTab}-${Date.now()}.png`;
    link.href = screenshotDataUrl;
    link.click();
    setScreenshotToast('Downloaded PNG screenshot!');
    setTimeout(() => setScreenshotToast(null), 3000);
  };

  const handleCopyScreenshot = async () => {
    if (!screenshotBlob) return;
    sounds.playPhoneClick();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': screenshotBlob }),
        ]);
        setScreenshotToast('Copied screenshot to clipboard!');
      } else {
        setScreenshotToast('Direct clipboard copy not supported. Please use Download.');
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setScreenshotToast('Could not copy image. Use Download PNG instead.');
    }
    setTimeout(() => setScreenshotToast(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-white font-sans overflow-hidden select-none relative">
      {/* Toast Notification Banner */}
      {screenshotToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border border-cyan-500/80 text-cyan-200 text-xs px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-medium text-[11px] whitespace-nowrap">{screenshotToast}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* COLOROS 14 BROWSER OMNIBAR & GLOBAL NETWORK STATUS BAR    */}
      {/* ========================================================= */}
      <div className="bg-zinc-900/95 border-b border-zinc-800 p-2 flex flex-col gap-1.5 shrink-0 shadow-md">
        {/* URL Address Bar & Share Screenshot Button */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs shadow-inner min-w-0">
            <span className="text-[10px] shrink-0">{effectiveOnline ? '🔒' : '⚠️'}</span>
            <span className="text-[11px] font-mono text-zinc-300 truncate">
              {effectiveOnline ? `https://desinet.in/${subTab}` : 'https://desinet.in/offline-mode'}
            </span>
            <div className="ml-auto flex items-center gap-1 shrink-0">
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

          {/* Share Screenshot Action Button */}
          <button
            onClick={handleShareScreenshot}
            disabled={isCapturingScreenshot}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-cyan-950/40 border border-cyan-400/50 cursor-pointer shrink-0 transition-all disabled:opacity-50"
            title="Capture current phone view canvas & open system share dialog"
          >
            {isCapturingScreenshot ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-200" />
                <span className="text-[10px]">Capturing...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-cyan-200" />
                <span className="text-[10px] hidden xs:inline sm:inline">Share</span>
                <span className="text-[10px]">Screenshot</span>
              </>
            )}
          </button>
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
      {/* ========================================================= */}
      {/* 5G BROWSER SUB-NAVIGATION TABS (7 Apps)                   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-7 bg-zinc-900/80 border-b border-zinc-800/80 text-[10px] font-bold shrink-0">
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
          <span className="text-[8px] sm:text-[9px]">Wiki</span>
        </button>

        <button
          onClick={() => {
            sounds.playPhoneClick();
            setSubTab('radio');
          }}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 border-b-2 transition cursor-pointer relative ${
            subTab === 'radio'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
          title="Desi FM Radio Station Selector (Retro Bollywood, Highway Beats, Classical Sitar)"
        >
          <div className="relative">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            {currentStationId !== 'off' && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[8px] sm:text-[9px]">Radio</span>
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
          <span className="text-[8px] sm:text-[9px]">Weather</span>
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
          <span className="text-[8px] sm:text-[9px]">Forex</span>
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
          <span className="text-[8px] sm:text-[9px]">5G Test</span>
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
          <span className="text-[8px] sm:text-[9px]">Copilot</span>
        </button>

        <button
          onClick={() => {
            sounds.playPhoneClick();
            setSubTab('scanner');
          }}
          className={`py-2 flex flex-col items-center justify-center gap-0.5 border-b-2 transition cursor-pointer relative ${
            subTab === 'scanner'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
          title="Digital Dhaba 5G QR Scanner & Coupons"
        >
          <div className="relative">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            {unredeemedCouponsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-black text-[7px] font-black px-1 rounded-full animate-pulse leading-tight">
                {unredeemedCouponsCount}
              </span>
            )}
          </div>
          <span className="text-[8px] sm:text-[9px]">Dhaba QR</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT: EITHER INDIAN-STYLED OFFLINE VIEW OR ONLINE  */}
      {/* ========================================================= */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin">
        {/* --------------------------------------------------------- */}
        {/* GLOBAL OFFLINE STATE ACROSS ALL TABS                      */}
        {/* --------------------------------------------------------- */}
        {!effectiveOnline && subTab !== 'scanner' && subTab !== 'radio' ? (
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

            {/* --------------------------------------------------------- */}
            {/* TAB 6: DIGITAL DHABA 5G QR SCANNER & SECRET REWARDS       */}
            {/* --------------------------------------------------------- */}
            {subTab === 'scanner' && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-teal-950/80 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <QrCode className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-black text-white tracking-wide">
                          DIGITAL DHABA 5G SCANNER
                        </h3>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-mono px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                          {effectiveOnline ? '5G UPI LINK' : 'OFFLINE OPTICAL'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Scan 3D roadside dhabas, milestones & posters for coupons!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        sounds.playPhoneClick();
                        setShowQrOnboarding(true);
                      }}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                      title="How to scan 3D world elements (Help Guide)"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Guide</span>
                    </button>

                    <button
                      onClick={() => {
                        sounds.playPhoneClick();
                        setScannerMode('wallet');
                      }}
                      className="flex flex-col items-end px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-right cursor-pointer transition active:scale-95 shrink-0"
                      title="Open Coupons Wallet"
                    >
                      <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                        <Ticket className="w-3 h-3 text-amber-400" /> Wallet
                      </span>
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {coupons.length}{' '}
                        {unredeemedCouponsCount > 0 && (
                          <span className="text-[8px] text-emerald-400 font-bold">
                            ({unredeemedCouponsCount} New)
                          </span>
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* One-time Onboarding Overlay / Help Modal */}
                {showQrOnboarding && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-emerald-500/70 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-teal-950/90 border-b border-emerald-500/40 p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xl shadow-md">
                            📸
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-black text-white uppercase tracking-wider font-['Cinzel',sans-serif]">
                                Digital Dhaba QR Guide
                              </h3>
                              <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                                3D OPTICAL
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400">
                              How to scan 3D roadside landmarks along NH-48
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDismissQrOnboarding}
                          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Body with 4 Steps */}
                      <div className="p-4 overflow-y-auto space-y-3 text-left">
                        {/* Step 1 */}
                        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-start gap-3 hover:border-emerald-500/40 transition">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                            🏪
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-amber-300">1. Spot 3D Roadside Landmarks</h4>
                              <span className="text-[9px] font-mono text-zinc-400">STEP 1</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">
                              Cruise along the highway and look for roadside <strong>Cutting Chai Dhabas</strong>, <strong>Shree Ganesh Garages</strong>, <strong>Highway Milestones</strong>, and <strong>AirJio 5G Towers</strong>.
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-start gap-3 hover:border-emerald-500/40 transition">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-lg shrink-0">
                            🎯
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-cyan-300">2. Pull Up Close (≤ 45m Range)</h4>
                              <span className="text-[9px] font-mono text-zinc-400">STEP 2</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">
                              Slow down near the structure. When you enter optical range, the sensor locks on with a green reticle: <span className="bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold text-[10px]">🎯 LOCKED</span>.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-start gap-3 hover:border-emerald-500/40 transition">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0">
                            📸
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-emerald-300">3. Tap 'Scan' in Viewfinder</h4>
                              <span className="text-[9px] font-mono text-zinc-400">STEP 3</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">
                              Click the green <strong>'Scan'</strong> button. The camera flash fires, reads the 3D world QR barcode, and deposits a secret Digital Dhaba coupon into your wallet!
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-start gap-3 hover:border-emerald-500/40 transition">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg shrink-0">
                            🎁
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-purple-300">4. Redeem Superpowers in Wallet</h4>
                              <span className="text-[9px] font-mono text-zinc-400">STEP 4</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">
                              Switch to the <strong>Wallet</strong> tab anytime to claim <strong>Free Cutting Chai (100% Chai boost)</strong>, <strong>Engine Repairs (100% Condition)</strong>, <strong>Nitro Turbo Surge</strong>, or <strong>₹250 Cash Rewards</strong>!
                            </p>
                          </div>
                        </div>

                        {/* Pro Tip Callout */}
                        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 flex items-center gap-2 text-[10px] text-emerald-200">
                          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            <strong>Pro Tip:</strong> You can also type secret promo codes like <code className="bg-black/50 px-1 py-0.5 rounded font-mono text-amber-300">CHAI100</code> or <code className="bg-black/50 px-1 py-0.5 rounded font-mono text-amber-300">DESI2026</code> in the Promo tab!
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-[10px] text-zinc-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span>Don't show automatically</span>
                        </label>

                        <button
                          onClick={handleDismissQrOnboarding}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                        >
                          Start Scanning 🚀
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Toast Notification */}
                {scannerSuccessToast && (
                  <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-1">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-[11px]">{scannerSuccessToast}</span>
                  </div>
                )}

                {/* Sub-mode Tabs Switcher */}
                <div className="grid grid-cols-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 gap-1 text-[10px] font-bold">
                  <button
                    onClick={() => {
                      sounds.playPhoneClick();
                      setScannerMode('viewfinder');
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      scannerMode === 'viewfinder'
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Focus className="w-3 h-3" />
                    <span>Viewfinder</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playPhoneClick();
                      setScannerMode('targets');
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      scannerMode === 'targets'
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ScanLine className="w-3 h-3" />
                    <span>Targets ({nearbyQrTargets.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playPhoneClick();
                      setScannerMode('code');
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      scannerMode === 'code'
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>Promo</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.playPhoneClick();
                      setScannerMode('wallet');
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      scannerMode === 'wallet'
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Gift className="w-3 h-3" />
                    <span>Wallet ({coupons.length})</span>
                  </button>
                </div>

                {/* ======================================================= */}
                {/* MODE 1: LIVE 3D VIEWFINDER                              */}
                {/* ======================================================= */}
                {scannerMode === 'viewfinder' && (
                  <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
                    {/* Viewfinder Screen Box */}
                    <div className="relative aspect-[4/3] w-full bg-zinc-950 rounded-2xl border-2 border-emerald-500/60 overflow-hidden shadow-2xl flex items-center justify-center">
                      {/* Live 3D Canvas Stream */}
                      <canvas
                        ref={viewfinderCanvasRef}
                        className="w-full h-full object-cover filter contrast-105"
                      />

                      {/* Fallback Graphic when engine canvas is not streaming */}
                      {!engine && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 text-center p-4">
                          <QrCode className="w-12 h-12 text-emerald-400/40 mb-2 animate-pulse" />
                          <p className="text-xs font-mono text-zinc-400">
                            Aim phone camera at roadside dhabas on NH-48
                          </p>
                        </div>
                      )}

                      {/* Camera Shutter Flash Overlay */}
                      {isCameraFlashing && (
                        <div className="absolute inset-0 bg-white animate-in fade-in duration-75 z-40" />
                      )}

                      {/* Four Corner Viewfinder Reticle Brackets */}
                      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 pointer-events-none drop-shadow-[0_0_8px_#10b981]" />
                      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 pointer-events-none drop-shadow-[0_0_8px_#10b981]" />
                      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 pointer-events-none drop-shadow-[0_0_8px_#10b981]" />
                      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 pointer-events-none drop-shadow-[0_0_8px_#10b981]" />

                      {/* Center Crosshairs */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 border border-emerald-500/40 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                        </div>
                      </div>

                      {/* Animated Bouncing Laser Scanning Beam */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse pointer-events-none top-1/2 -translate-y-1/2" />

                      {/* Top Viewfinder Telemetry Bar */}
                      <div className="absolute top-2 inset-x-3 flex items-center justify-between text-[9px] font-mono z-20 pointer-events-none">
                        <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-emerald-400 border border-emerald-500/40">
                          {activeLockTarget?.inScanRange ? '🎯 LOCKED' : '🔍 SCANNING ROAD'}
                        </span>
                        <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-zinc-300 border border-zinc-700">
                          AUTO-FOCUS 5G • 60 FPS
                        </span>
                      </div>

                      {/* Target Detection Bounding Overlay */}
                      {activeLockTarget && (
                        <div
                          className={`absolute bottom-3 inset-x-3 p-2 rounded-xl backdrop-blur-md border flex items-center justify-between text-xs transition-all z-20 ${
                            activeLockTarget.inScanRange
                              ? 'bg-emerald-950/85 border-emerald-400 text-white shadow-lg shadow-emerald-950/50'
                              : 'bg-zinc-900/85 border-amber-500/50 text-amber-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-emerald-300">
                                {activeLockTarget.category.toUpperCase()} QR
                              </span>
                              <span className="font-mono text-[9px] text-zinc-400">
                                • {activeLockTarget.distanceMeters}m ({activeLockTarget.direction})
                              </span>
                            </div>
                            <h4 className="text-[11px] font-bold truncate leading-tight">
                              {activeLockTarget.title}
                            </h4>
                            <p className="text-[9px] text-zinc-300 truncate font-mono">
                              Code: <span className="text-amber-300">{activeLockTarget.code}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleScanTarget(activeLockTarget)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs shrink-0 cursor-pointer shadow-md active:scale-95 transition"
                          >
                            Scan
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Viewfinder Controls & Quick Focus */}
                    <div className="flex flex-col gap-2">
                      {activeLockTarget ? (
                        <button
                          onClick={() => handleScanTarget(activeLockTarget)}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/50 cursor-pointer transition active:scale-98"
                        >
                          <QrCode className="w-4 h-4 text-emerald-200" />
                          <span>CAPTURE & SCAN: {activeLockTarget.code}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (nearbyQrTargets.length > 0) {
                              handleScanTarget(nearbyQrTargets[0]);
                            } else {
                              handleClaimManualCode('SHARMA-CHAI-99');
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                        >
                          <Focus className="w-4 h-4 text-emerald-400" />
                          <span>Aim & Focus Nearest Roadside Dhaba</span>
                        </button>
                      )}

                      <p className="text-[9px] text-zinc-400 text-center font-mono">
                        💡 Tip: Chai Dhabas, NH-48 Milestones, Haveli Arches & Tata Trucks carry secret scannable QR codes!
                      </p>
                    </div>
                  </div>
                )}

                {/* ======================================================= */}
                {/* MODE 2: 3D ROADSIDE TARGETS RADAR                       */}
                {/* ======================================================= */}
                {scannerMode === 'targets' && (
                  <div className="flex flex-col gap-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                      <span>NH-48 BEACON RADAR</span>
                      <span>{nearbyQrTargets.length} ACTIVE CODES</span>
                    </div>

                    {nearbyQrTargets.length === 0 ? (
                      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-400 text-xs">
                        <ScanLine className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p>No 3D Dhaba QR codes currently in sensor range.</p>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Drive further along NH-48 highway to discover more!
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
                        {nearbyQrTargets.map((target) => (
                          <div
                            key={target.id}
                            className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 shadow-md ${
                              target.inScanRange
                                ? 'bg-gradient-to-r from-emerald-950/70 to-zinc-900 border-emerald-500/60 ring-1 ring-emerald-500/30'
                                : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span
                                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                    target.category === 'Dhaba'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : target.category === 'Milestone'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : target.category === 'Haveli'
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                      : target.category === 'Highway'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  }`}
                                >
                                  {target.category}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400">
                                  {target.distanceMeters}m • {target.direction}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-white truncate">
                                {target.title}
                              </h4>
                              <p className="text-[10px] text-zinc-400 truncate">
                                {target.locationLabel}
                              </p>
                              <div className="text-[10px] text-amber-300 font-mono mt-1 flex items-center gap-1">
                                <Gift className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{target.reward.discountText}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleScanTarget(target)}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer transition"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Scan</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================= */}
                {/* MODE 3: MANUAL PROMO CODE / DUMMY VOUCHER ENTRY         */}
                {/* ======================================================= */}
                {scannerMode === 'code' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-150">
                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-md">
                      <div>
                        <h4 className="text-xs font-bold text-white">Enter Secret QR / Voucher Code</h4>
                        <p className="text-[10px] text-zinc-400">
                          Type dummy coupon codes discovered from billboards or highway trucks.
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={manualCodeInput}
                          onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleClaimManualCode();
                          }}
                          placeholder="e.g. SHARMA-CHAI-99 or DHABA100"
                          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 font-mono uppercase focus:outline-none focus:border-emerald-400"
                        />
                        <button
                          onClick={() => handleClaimManualCode()}
                          disabled={!manualCodeInput.trim()}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs cursor-pointer active:scale-95 transition"
                        >
                          Claim
                        </button>
                      </div>
                    </div>

                    {/* Discovered Highway Secrets Chips */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider px-1">
                        🔑 Discovered Highway Secrets & Dummy Codes:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { code: 'SHARMA-CHAI-99', label: 'Sharmaji Chai Overdrive ☕' },
                          { code: 'MUNNA-SAMOSA-24', label: 'Munna Samosa Repair 🛠️' },
                          { code: 'NH48-TOLL-FREE', label: 'NH-48 FASTag Pass 🛣️' },
                          { code: 'HAVELI-ROYALE-777', label: 'Haveli Darbar ₹500 👑' },
                          { code: 'NITRO-DHABA-TURBO', label: 'Truck Art Turbo ⚡' },
                          { code: 'AIRJIO-5G-VIP', label: '5G High-Speed Pass 📶' },
                          { code: 'DHABA100', label: 'Secret ₹100 Bonus 💰' },
                          { code: 'DESI2026', label: 'Grand Desi 2026 Kit 🎉' },
                        ].map((item) => (
                          <button
                            key={item.code}
                            onClick={() => handleClaimManualCode(item.code)}
                            className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-left transition active:scale-95 cursor-pointer group"
                          >
                            <span className="font-mono text-[10px] font-bold text-amber-300 block truncate group-hover:text-amber-200">
                              {item.code}
                            </span>
                            <span className="text-[9px] text-zinc-400 block truncate">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ======================================================= */}
                {/* MODE 4: DIGITAL DHABA REWARDS WALLET                    */}
                {/* ======================================================= */}
                {scannerMode === 'wallet' && (
                  <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                      <span>MY DHABA REWARDS ({coupons.length})</span>
                      <span className="text-amber-400">{unredeemedCouponsCount} Unused</span>
                    </div>

                    {coupons.length === 0 ? (
                      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-400 text-xs">
                        <Ticket className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p>No coupons in your wallet yet.</p>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Scan 3D roadside dhabas or enter promo codes to unlock!
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                        {coupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className={`rounded-2xl border p-3 flex flex-col gap-2 relative overflow-hidden transition shadow-md ${
                              coupon.isRedeemed
                                ? 'bg-zinc-950/70 border-zinc-800/80 opacity-70'
                                : 'bg-gradient-to-br from-zinc-900 via-amber-950/20 to-zinc-900 border-amber-500/50 shadow-amber-950/30'
                            }`}
                          >
                            {/* Top Ticket Header */}
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                                    {coupon.badge}
                                  </span>
                                  <span className="text-[9px] font-mono text-zinc-400">
                                    {coupon.dhabaName}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-white leading-tight">
                                  {coupon.title}
                                </h4>
                                <p className="text-[10px] text-zinc-300 mt-0.5">
                                  {coupon.description}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs font-black text-amber-400 block">
                                  {coupon.discountText}
                                </span>
                                <span className="font-mono text-[8px] text-zinc-500">
                                  CODE: {coupon.code}
                                </span>
                              </div>
                            </div>

                            {/* Ticket Perforated Divider */}
                            <div className="border-t border-dashed border-zinc-700/80 my-0.5 relative">
                              <div className="absolute -left-4 -top-1.5 w-3 h-3 rounded-full bg-zinc-950" />
                              <div className="absolute -right-4 -top-1.5 w-3 h-3 rounded-full bg-zinc-950" />
                            </div>

                            {/* Bottom Actions */}
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-[8px] font-mono text-zinc-400">
                                Added {coupon.unlockedAt}
                              </span>

                              {coupon.isRedeemed ? (
                                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> REDEEMED TO AUTO
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRedeemCoupon(coupon)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-[11px] shadow-md active:scale-95 transition cursor-pointer flex items-center gap-1"
                                >
                                  <Gift className="w-3 h-3 text-zinc-950" />
                                  <span>Redeem Reward</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* TAB 7: DESI IN-DASH FM RADIO STATION SELECTOR             */}
            {/* --------------------------------------------------------- */}
            {subTab === 'radio' && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                {/* 1. Radio Header Banner with Live FM Signal */}
                <div className="bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={`p-2 rounded-xl border shrink-0 transition-colors ${
                        currentStationId !== 'off'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}
                    >
                      <Radio className={`w-5 h-5 ${currentStationId !== 'off' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-black text-white tracking-wide">
                          DESI AUTO IN-DASH FM STEREO
                        </h3>
                        <span
                          className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border font-bold ${
                            currentStationId !== 'off'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {currentStationId !== 'off' ? '● STEREO ON AIR' : '○ DECK STANDBY'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Procedural Indian FM Tuner • Bollywood, Highway Beats & Sitar
                      </p>
                    </div>
                  </div>

                  {/* Power Toggle Button */}
                  <button
                    onClick={handleToggleRadioPower}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-md shrink-0 border ${
                      currentStationId !== 'off'
                        ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/50 text-rose-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-zinc-950 shadow-emerald-500/20'
                    }`}
                    title={currentStationId !== 'off' ? 'Power Off Cassette Radio' : 'Power On Radio'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{currentStationId !== 'off' ? 'Power OFF' : 'Power ON'}</span>
                  </button>
                </div>

                {/* 2. Vintage FM Frequency Scale & Glowing LCD Dial */}
                <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-amber-500/50 rounded-2xl p-3 shadow-xl flex flex-col gap-2.5 relative overflow-hidden">
                  {/* Subtle dial glass reflection */}
                  <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl" />

                  {/* Top LED Screen */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-3">
                      {/* Cassette Tape Spools Animation */}
                      <div className="flex items-center gap-1">
                        <Disc
                          className={`w-5 h-5 text-amber-400 ${
                            currentStationId !== 'off' ? 'animate-spin' : 'opacity-40'
                          }`}
                        />
                        <Disc
                          className={`w-5 h-5 text-amber-400 ${
                            currentStationId !== 'off' ? 'animate-spin' : 'opacity-40'
                          }`}
                        />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                          FREQUENCY / BAND
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                            {currentStationId !== 'off' ? tuningFreqDisplay : '--.-'}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-300/80">MHz FM</span>
                        </div>
                      </div>
                    </div>

                    {/* Equalizer Visualizer Bars */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-end gap-1 h-6">
                        {[0.8, 0.4, 1.0, 0.6, 0.9, 0.3, 0.7].map((h, idx) => (
                          <div
                            key={idx}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              currentStationId !== 'off'
                                ? 'bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 animate-pulse'
                                : 'bg-zinc-800'
                            }`}
                            style={{
                              height: currentStationId !== 'off' ? `${Math.max(20, h * 100)}%` : '15%',
                              animationDelay: `${idx * 0.12}s`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[8px] font-mono text-emerald-400 font-bold">
                        {currentStationId !== 'off' ? 'STEREO • RDS' : 'NO CARRIER'}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Analogue Frequency Scale (88 - 108 MHz) */}
                  <div className="relative pt-1 pb-1">
                    <div className="w-full h-8 bg-zinc-950 rounded-lg border border-zinc-800 relative overflow-hidden flex items-center px-3 shadow-inner">
                      {/* Frequency tick marks */}
                      <div className="w-full flex justify-between text-[8px] font-mono font-bold text-zinc-500 z-10 select-none">
                        <span>88</span>
                        <span>92</span>
                        <span>96</span>
                        <span>100</span>
                        <span>104</span>
                        <span>108</span>
                      </div>

                      {/* Small tick tick marks */}
                      <div className="absolute inset-x-3 top-0 bottom-0 flex justify-between items-center opacity-30 pointer-events-none">
                        {Array.from({ length: 41 }).map((_, i) => (
                          <div
                            key={i}
                            className={`bg-amber-400 ${i % 5 === 0 ? 'h-4 w-[1px]' : 'h-2 w-[0.5px]'}`}
                          />
                        ))}
                      </div>

                      {/* Red Tuning Needle */}
                      {currentStationId !== 'off' && (
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] transition-all duration-300 z-20"
                          style={{
                            left: `calc(12px + (100% - 24px) * ${Math.max(
                              0,
                              Math.min(
                                1,
                                (parseFloat(tuningFreqDisplay) - 88) / (108 - 88)
                              )
                            )})`,
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-red-400 -translate-x-[2px] -translate-y-[2px]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transport Navigation Seek Controls */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleSeekRadio('prev')}
                      className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer border border-zinc-700 shadow-sm"
                      title="Seek Previous Radio Station"
                    >
                      <SkipBack className="w-3.5 h-3.5 text-amber-400" />
                      <span>Prev</span>
                    </button>

                    <button
                      onClick={handleToggleRadioPower}
                      className={`col-span-2 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer shadow-md ${
                        currentStationId !== 'off'
                          ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 shadow-amber-500/20'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                      }`}
                      title={currentStationId !== 'off' ? 'Stop Radio' : 'Play Radio'}
                    >
                      {currentStationId !== 'off' ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Mute / Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Turn On Radio</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSeekRadio('next')}
                      className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer border border-zinc-700 shadow-sm"
                      title="Seek Next Radio Station"
                    >
                      <span>Next</span>
                      <SkipForward className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                </div>

                {/* 3. Now Playing Hero Info Card */}
                {currentStationId !== 'off' && (
                  <div className="bg-gradient-to-r from-zinc-900 via-amber-950/30 to-zinc-900 border border-amber-500/40 rounded-2xl p-3 flex items-start gap-3 shadow-md">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0 shadow">
                      {currentStationId === 'bollywood'
                        ? '🎵'
                        : currentStationId === 'highway_beats'
                        ? '🥁'
                        : currentStationId === 'classical_sitar'
                        ? '🪕'
                        : currentStationId === 'folk'
                        ? '🌾'
                        : currentStationId === 'news'
                        ? '🎙️'
                        : '🙏'}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                          {RADIO_STATIONS.find((s) => s.id === currentStationId)?.genre}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {RADIO_STATIONS.find((s) => s.id === currentStationId)?.frequency}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-white truncate mt-0.5">
                        {RADIO_STATIONS.find((s) => s.id === currentStationId)?.name}
                      </h4>

                      <p className="text-[10px] text-amber-200/90 font-medium truncate mt-0.5 flex items-center gap-1">
                        <Music className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{RADIO_STATIONS.find((s) => s.id === currentStationId)?.trackName}</span>
                      </p>

                      <p className="text-[9px] text-zinc-400 truncate mt-0.5">
                        Host: {RADIO_STATIONS.find((s) => s.id === currentStationId)?.djName} •{' '}
                        {RADIO_STATIONS.find((s) => s.id === currentStationId)?.tagline}
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Genre Filter Pills Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[10px] font-bold">
                  <span className="text-zinc-500 uppercase text-[9px] font-mono shrink-0 pl-0.5">Genre:</span>
                  {[
                    { id: 'all', label: 'All Stations' },
                    { id: 'bollywood', label: 'Retro Bollywood 🎵' },
                    { id: 'highway', label: 'Highway Beats 🥁' },
                    { id: 'classical', label: 'Classical Sitar 🪕' },
                    { id: 'folk', label: 'Desi Folk 🌾' },
                    { id: 'news', label: 'AIR News 🎙️' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        sounds.playPhoneClick();
                        setRadioGenreFilter(filter.id as any);
                      }}
                      className={`px-2.5 py-1 rounded-xl shrink-0 transition active:scale-95 cursor-pointer border ${
                        radioGenreFilter === filter.id
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-sm'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700/80'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* 5. Complete Station Cards Selector List */}
                <div className="flex flex-col gap-2">
                  {RADIO_STATIONS.filter((st) => {
                    if (st.id === 'off') return false;
                    if (radioGenreFilter === 'all') return true;
                    if (radioGenreFilter === 'bollywood') return st.id === 'bollywood';
                    if (radioGenreFilter === 'highway') return st.id === 'highway_beats';
                    if (radioGenreFilter === 'classical') return st.id === 'classical_sitar' || st.id === 'devotional';
                    if (radioGenreFilter === 'folk') return st.id === 'folk';
                    if (radioGenreFilter === 'news') return st.id === 'news';
                    return true;
                  }).map((st) => {
                    const isPlayingThis = currentStationId === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => handleTuneRadio(st.id)}
                        className={`rounded-2xl border p-3 flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.98] shadow-md text-left ${
                          isPlayingThis
                            ? 'bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/60 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                            : 'bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Station Icon Avatar */}
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-inner ${
                              isPlayingThis
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            {st.id === 'bollywood'
                              ? '🎵'
                              : st.id === 'highway_beats'
                              ? '🥁'
                              : st.id === 'classical_sitar'
                              ? '🪕'
                              : st.id === 'folk'
                              ? '🌾'
                              : st.id === 'news'
                              ? '🎙️'
                              : '🙏'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full border ${
                                  isPlayingThis
                                    ? 'bg-amber-400 text-zinc-950 border-amber-300'
                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                }`}
                              >
                                {st.genre}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                {st.frequency}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-white truncate mt-0.5">
                              {st.name}
                            </h4>

                            <p className="text-[10px] text-zinc-300 truncate mt-0.5">
                              {st.tagline}
                            </p>

                            <p className="text-[9px] text-zinc-400 font-mono truncate">
                              Host: {st.djName}
                            </p>
                          </div>
                        </div>

                        {/* Tune Action Status */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {isPlayingThis ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-zinc-950 font-black text-[10px] flex items-center gap-1 shadow-sm animate-pulse">
                              <Disc className="w-3 h-3 animate-spin" />
                              <span>ON AIR</span>
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTuneRadio(st.id);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 font-bold text-[10px] border border-zinc-700 transition cursor-pointer"
                            >
                              Tune In
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 6. Quick Numeric Presets (Cassette In-Dash Bar) */}
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 px-1">
                    <span className="uppercase font-bold text-zinc-500">1-Touch Cassette Presets</span>
                    <span className="text-amber-400">Memory Ch 1 - 5</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { num: '1', id: 'bollywood', label: '98.3 Bollywood' },
                      { num: '2', id: 'highway_beats', label: '93.5 Highway' },
                      { num: '3', id: 'classical_sitar', label: '107.1 Sitar' },
                      { num: '4', id: 'folk', label: '104.8 Bhangra' },
                      { num: '5', id: 'news', label: '102.6 News' },
                    ].map((p) => {
                      const isSel = currentStationId === p.id;
                      return (
                        <button
                          key={p.num}
                          onClick={() => handleTuneRadio(p.id as RadioStationId)}
                          className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition active:scale-95 cursor-pointer border text-center ${
                            isSel
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black shadow-inner'
                              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <span className="text-[10px] font-mono font-black text-amber-400">
                            [{p.num}]
                          </span>
                          <span className="text-[8px] truncate max-w-full font-medium mt-0.5">
                            {p.label.split(' ')[1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* DIGITAL DHABA CELEBRATION REWARD UNLOCK MODAL            */}
      {/* ========================================================= */}
      {unlockedModalCoupon && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-w-sm bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500/70 rounded-3xl p-5 shadow-2xl relative flex flex-col items-center text-center">
            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playPhoneClick();
                setUnlockedModalCoupon(null);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/20">
              <Gift className="w-8 h-8 animate-bounce" />
            </div>

            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-0.5">
              🎉 DIGITAL DHABA COUPON UNLOCKED!
            </span>
            <h3 className="text-base font-black text-white leading-tight mb-1">
              {unlockedModalCoupon.title}
            </h3>
            <p className="text-xs text-zinc-300 mb-3 px-2">
              {unlockedModalCoupon.description}
            </p>

            {/* Visual Voucher Ticket Card */}
            <div className="w-full bg-zinc-950 border border-amber-500/40 rounded-2xl p-3 mb-4 text-left shadow-inner">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-400 text-[10px]">{unlockedModalCoupon.dhabaName}</span>
                <span className="font-mono text-amber-400 font-bold text-[10px]">
                  {unlockedModalCoupon.badge}
                </span>
              </div>
              <div className="text-base font-black font-mono text-emerald-400">
                {unlockedModalCoupon.discountText}
              </div>
              <div className="text-[9px] font-mono text-zinc-500 mt-1 flex items-center justify-between border-t border-zinc-800 pt-1">
                <span>VOUCHER CODE: {unlockedModalCoupon.code}</span>
                <span>DESIPHONE 5G</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2">
              {!unlockedModalCoupon.isRedeemed ? (
                <button
                  onClick={() => {
                    handleRedeemCoupon(unlockedModalCoupon);
                    setUnlockedModalCoupon((prev) => (prev ? { ...prev, isRedeemed: true } : null));
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-zinc-950" />
                  <span>Redeem Now to Rickshaw</span>
                </button>
              ) : (
                <div className="w-full py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Applied to Auto Rickshaw!</span>
                </div>
              )}

              <button
                onClick={() => {
                  sounds.playPhoneClick();
                  setUnlockedModalCoupon(null);
                }}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition active:scale-95"
              >
                Keep in Wallet & Drive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCREENSHOT PREVIEW & FALLBACK SHARING MODAL               */}
      {/* ========================================================= */}
      {screenshotDataUrl && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-3 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Phone Screenshot Captured</h4>
                <p className="text-[10px] text-zinc-400">720×1280 Hi-Res Canvas • DesiNet 5G</p>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playPhoneClick();
                setScreenshotDataUrl(null);
                setScreenshotBlob(null);
              }}
              className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition active:scale-90"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Screenshot Image Preview Container */}
          <div className="flex-1 my-2 min-h-0 flex items-center justify-center bg-zinc-950/70 rounded-xl border border-zinc-800/80 p-2 overflow-hidden shadow-inner">
            <img
              src={screenshotDataUrl}
              alt="5G Phone Screen Capture"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-zinc-700/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-zinc-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadScreenshot}
                className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={handleCopyScreenshot}
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 active:scale-95 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-300" />
                <span>Copy Image</span>
              </button>
            </div>

            <button
              onClick={handleShareScreenshot}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share via System Dialog</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
