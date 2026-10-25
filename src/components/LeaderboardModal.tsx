import React, { useState, useEffect } from 'react';
import {
  Trophy,
  X,
  Medal,
  Flame,
  Zap,
  Coffee,
  Users,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  Share2,
  Download,
  Copy,
  Check,
  Camera,
} from 'lucide-react';
import {
  LeaderboardCategory,
  LeaderboardDriver,
  fetchLeaderboard,
  submitDriverScore,
} from '../game/leaderboard';
import { DriverProfile, AVAILABLE_CITIES } from '../game/auth';
import { sounds } from '../game/audio';
import { RICKSHAW_LIVERIES } from '../game/multiplayer';
import { GameEngine } from '../game/engine';
import { generateScorecardCanvas } from '../game/shareScorecard';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: DriverProfile | null;
  engine?: GameEngine | null;
  currentShiftStats?: {
    earnings: number;
    distanceKm: number;
    topSpeedKmh: number;
    chaiCount: number;
    passengersServed: number;
  };
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  engine,
  currentShiftStats,
}) => {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('earnings');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<LeaderboardDriver[]>([]);
  const [podium, setPodium] = useState<LeaderboardDriver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Share Scorecard State
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const loadData = async (cat = activeCategory, city = selectedCity) => {
    setIsLoading(true);
    try {
      const res = await fetchLeaderboard(cat, city);
      setDrivers(res.entries);
      setPodium(res.podium);
    } catch {
      // Handled in client service
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData(activeCategory, selectedCity);
    }
  }, [isOpen, activeCategory, selectedCity]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: LeaderboardCategory) => {
    sounds.playPhoneClick();
    setActiveCategory(cat);
  };

  const handleCityChange = (city: string) => {
    sounds.playPhoneClick();
    setSelectedCity(city);
  };

  const handleSyncScore = async () => {
    if (!currentProfile) return;
    sounds.playPhoneClick();
    setSyncStatus('Syncing with All-India 5G Server...');

    const res = await submitDriverScore({
      profile: currentProfile,
      earnings: Math.max(currentProfile.totalEarnings, currentShiftStats?.earnings || 0),
      distanceKm: currentShiftStats?.distanceKm || 0,
      topSpeedKmh: currentShiftStats?.topSpeedKmh || 65,
      chaiCount: Math.max(currentProfile.chaiCups, currentShiftStats?.chaiCount || 0),
      passengersServed: Math.max(currentProfile.totalTrips, currentShiftStats?.passengersServed || 0),
    });

    sounds.playPassengerSuccess();
    setSyncStatus(`Score Synced! All-India Rank: #${res.rank || 1}`);
    loadData(activeCategory, selectedCity);
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleShareScore = async () => {
    sounds.playPhoneClick();
    setIsGeneratingShare(true);
    setShareToast(null);

    try {
      const userRank = userEntry ? userEntry.rank : 1;
      const gameCanvas = engine?.getCanvasElement() || null;

      const res = await generateScorecardCanvas({
        profile: currentProfile,
        earnings: Math.max(currentProfile?.totalEarnings || 0, currentShiftStats?.earnings || 0),
        distanceKm: currentShiftStats?.distanceKm || 0,
        topSpeedKmh: currentShiftStats?.topSpeedKmh || 65,
        chaiCount: Math.max(currentProfile?.chaiCups || 0, currentShiftStats?.chaiCount || 0),
        passengersServed: Math.max(currentProfile?.totalTrips || 0, currentShiftStats?.passengersServed || 0),
        rank: userRank,
        category: activeCategory,
        gameCanvas,
      });

      setShareImage(res.dataUrl);
      setShareBlob(res.blob);
      sounds.playPassengerSuccess();
    } catch (err) {
      console.error('Failed to generate scorecard canvas image', err);
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleDownloadImage = () => {
    if (!shareImage) return;
    sounds.playPhoneClick();
    const name = (currentProfile?.name || 'Ustaad').replace(/[^a-zA-Z0-9]/g, '_');
    const link = document.createElement('a');
    link.download = `Bharat_Auto_Scorecard_${name}.png`;
    link.href = shareImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareToast('Scorecard image downloaded! 📥');
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleWebShare = async () => {
    sounds.playPhoneClick();
    if (navigator.share && shareBlob) {
      try {
        const file = new File([shareBlob], 'bharat_auto_scorecard.png', { type: 'image/png' });
        await navigator.share({
          title: 'My Bharat Auto Express Highway Scorecard 🛺🏆',
          text: `Check out my Bharat Auto Express driver license and highway rank! 🛺 Total Fares: ₹${Math.max(currentProfile?.totalEarnings || 0, currentShiftStats?.earnings || 0)}!`,
          files: [file],
        });
        setShareToast('Shared successfully! 🚀');
        setTimeout(() => setShareToast(null), 3000);
        return;
      } catch {
        // Fallback
      }
    }
    handleCopyImage();
  };

  const handleCopyImage = async () => {
    sounds.playPhoneClick();
    if (shareBlob && navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': shareBlob }),
        ]);
        setShareToast('Scorecard image copied to clipboard! 📋');
        setTimeout(() => setShareToast(null), 3000);
        return;
      } catch {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(
        `🛺 Bharat Auto Express Scorecard:\nDriver: ${currentProfile?.name || 'Ustaad'}\nRank: #${userEntry?.rank || 1}\nTotal Fares: ₹${Math.max(currentProfile?.totalEarnings || 0, currentShiftStats?.earnings || 0)}\nDistance: ${(currentShiftStats?.distanceKm || 0).toFixed(1)} km\nCutting Chai: ${Math.max(currentProfile?.chaiCups || 0, currentShiftStats?.chaiCount || 0)} cups`
      );
      setShareToast('Driver stats copied to clipboard! 📋');
      setTimeout(() => setShareToast(null), 3000);
    } catch {
      setShareToast('Download the image using the button below 📥');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  // Filtered entries by search query
  const filteredDrivers = drivers.filter(
    (d) =>
      d.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find user's rank
  const userEntry = currentProfile
    ? drivers.find(
        (d) =>
          d.id === currentProfile.uid ||
          d.licenseNumber === currentProfile.licenseNumber ||
          d.driverName.toLowerCase() === currentProfile.name.toLowerCase()
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-3xl bg-zinc-950 border-2 border-amber-500/80 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.4)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Tricolor Ribbon Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-500 shrink-0" />

        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-950/90 via-zinc-900 to-amber-950/90 border-b border-amber-500/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-black">
                  MAHA USTAAD 5G BOARD
                </span>
                <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline-block">
                  अखिल भारतीय चालक महासंघ
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white tracking-wide uppercase font-['Cinzel',sans-serif]">
                All-India Highway Leaderboard
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(activeCategory, selectedCity)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-amber-300 transition cursor-pointer"
              title="Refresh Ranks"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-red-400 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Close Leaderboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/70 px-2 sm:px-4 py-2 gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
          <button
            onClick={() => handleCategoryChange('earnings')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'earnings'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
            }`}
          >
            <span>💰</span>
            <span>Maha-Lakshmi Fares (₹)</span>
          </button>

          <button
            onClick={() => handleCategoryChange('distance')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'distance'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Highway Yatra (km)</span>
          </button>

          <button
            onClick={() => handleCategoryChange('speed')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'speed'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Raftaar Speed (km/h)</span>
          </button>

          <button
            onClick={() => handleCategoryChange('chai')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'chai'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Kadak Chai (Cups)</span>
          </button>

          <button
            onClick={() => handleCategoryChange('passengers')}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'passengers'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Sawari Trips</span>
          </button>
        </div>

        {/* Sub-Filters: City Dropdown & Search Input */}
        <div className="p-3 bg-zinc-950/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-zinc-400 uppercase">RTO Zone:</span>
            <button
              onClick={() => handleCityChange('all')}
              className={`px-2.5 py-1 rounded-lg border text-xs transition cursor-pointer ${
                selectedCity === 'all'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All India 🇮🇳
            </button>
            {AVAILABLE_CITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCityChange(c.name)}
                className={`px-2 py-1 rounded-lg border text-[11px] transition cursor-pointer shrink-0 ${
                  selectedCity === c.name
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {c.rtoCode} • {c.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search driver / license..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-lg pl-8 pr-2 py-1 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Top 3 Podium (Only when not searching or searching matches podium) */}
          {podium.length >= 3 && !searchQuery && selectedCity === 'all' && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 pb-1">
              {/* 2nd Place Silver */}
              <div className="flex flex-col items-center justify-end p-3 rounded-2xl bg-zinc-900/90 border border-zinc-400/30 text-center relative shadow-lg">
                <div className="text-2xl sm:text-3xl mb-1">{podium[1]?.avatarIcon || '🥈'}</div>
                <div className="w-6 h-6 rounded-full bg-slate-300 text-zinc-950 font-black text-xs flex items-center justify-center shadow">
                  2
                </div>
                <div className="font-bold text-white text-xs sm:text-sm mt-1 truncate max-w-full">
                  {podium[1]?.driverName}
                </div>
                <div className="text-[10px] font-mono text-zinc-400">{podium[1]?.city}</div>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-zinc-800 text-slate-200 font-mono font-black text-xs">
                  {activeCategory === 'earnings' && `₹${podium[1]?.earnings}`}
                  {activeCategory === 'distance' && `${podium[1]?.distanceKm} km`}
                  {activeCategory === 'speed' && `${podium[1]?.topSpeedKmh} km/h`}
                  {activeCategory === 'chai' && `${podium[1]?.chaiCount} cups`}
                  {activeCategory === 'passengers' && `${podium[1]?.passengersServed} trips`}
                </div>
              </div>

              {/* 1st Place Gold Champion */}
              <div className="flex flex-col items-center justify-end p-3.5 rounded-2xl bg-gradient-to-b from-amber-950/80 to-zinc-900 border-2 border-amber-400 text-center relative shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-105 z-10">
                <div className="absolute -top-3 text-lg">👑</div>
                <div className="text-3xl sm:text-4xl mb-1">{podium[0]?.avatarIcon || '🥇'}</div>
                <div className="w-7 h-7 rounded-full bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center shadow-lg">
                  1
                </div>
                <div className="font-black text-amber-300 text-sm sm:text-base mt-1 truncate max-w-full">
                  {podium[0]?.driverName}
                </div>
                <div className="text-[10px] font-mono text-amber-200/80">{podium[0]?.city}</div>
                <div className="mt-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-mono font-black text-xs sm:text-sm shadow">
                  {activeCategory === 'earnings' && `₹${podium[0]?.earnings}`}
                  {activeCategory === 'distance' && `${podium[0]?.distanceKm} km`}
                  {activeCategory === 'speed' && `${podium[0]?.topSpeedKmh} km/h`}
                  {activeCategory === 'chai' && `${podium[0]?.chaiCount} cups`}
                  {activeCategory === 'passengers' && `${podium[0]?.passengersServed} trips`}
                </div>
              </div>

              {/* 3rd Place Bronze */}
              <div className="flex flex-col items-center justify-end p-3 rounded-2xl bg-zinc-900/90 border border-amber-700/40 text-center relative shadow-lg">
                <div className="text-2xl sm:text-3xl mb-1">{podium[2]?.avatarIcon || '🥉'}</div>
                <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow">
                  3
                </div>
                <div className="font-bold text-white text-xs sm:text-sm mt-1 truncate max-w-full">
                  {podium[2]?.driverName}
                </div>
                <div className="text-[10px] font-mono text-zinc-400">{podium[2]?.city}</div>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-zinc-800 text-amber-200/90 font-mono font-black text-xs">
                  {activeCategory === 'earnings' && `₹${podium[2]?.earnings}`}
                  {activeCategory === 'distance' && `${podium[2]?.distanceKm} km`}
                  {activeCategory === 'speed' && `${podium[2]?.topSpeedKmh} km/h`}
                  {activeCategory === 'chai' && `${podium[2]?.chaiCount} cups`}
                  {activeCategory === 'passengers' && `${podium[2]?.passengersServed} trips`}
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table / Cards List */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-12 text-[10px] font-bold text-zinc-400 px-3 py-1 uppercase tracking-wider">
              <span className="col-span-1 text-center">Rank</span>
              <span className="col-span-5 sm:col-span-4">Driver & Permit</span>
              <span className="col-span-3 sm:col-span-3 hidden sm:inline">RTO Zone</span>
              <span className="col-span-3 sm:col-span-2 text-right">Main Score</span>
              <span className="col-span-3 sm:col-span-2 text-right">Trip Fares</span>
            </div>

            {filteredDrivers.map((driver) => {
              const isCurrentUser =
                currentProfile &&
                (driver.id === currentProfile.uid ||
                  driver.licenseNumber === currentProfile.licenseNumber ||
                  driver.driverName.toLowerCase() === currentProfile.name.toLowerCase());

              const livery =
                RICKSHAW_LIVERIES.find((l) => l.id === driver.liveryId) || RICKSHAW_LIVERIES[0];

              return (
                <div
                  key={driver.id}
                  className={`grid grid-cols-12 items-center px-3 py-2 rounded-xl text-xs transition ${
                    isCurrentUser
                      ? 'bg-amber-950/80 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="col-span-1 flex justify-center">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black font-mono text-[11px] ${
                        driver.rank === 1
                          ? 'bg-amber-400 text-zinc-950'
                          : driver.rank === 2
                          ? 'bg-slate-300 text-zinc-950'
                          : driver.rank === 3
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {driver.rank}
                    </span>
                  </div>

                  {/* Driver Name & Avatar */}
                  <div className="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0 pr-1">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                      style={{
                        background: `linear-gradient(135deg, #${livery.hoodHex.toString(16).padStart(6, '0')} 50%, #${livery.bodyHex.toString(16).padStart(6, '0')} 50%)`,
                      }}
                      title={`Paint: ${livery.name}`}
                    />
                    <div className="truncate">
                      <div className="font-bold text-white flex items-center gap-1 truncate">
                        <span>{driver.avatarIcon}</span>
                        <span className="truncate">{driver.driverName}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-amber-500 text-zinc-950 px-1 rounded font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 truncate">
                        {driver.licenseNumber}
                      </div>
                    </div>
                  </div>

                  {/* City */}
                  <div className="col-span-3 sm:col-span-3 hidden sm:block text-zinc-300 text-[11px] truncate">
                    {driver.city}
                  </div>

                  {/* Active Category Metric */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                      {activeCategory === 'earnings' && `₹${driver.earnings}`}
                      {activeCategory === 'distance' && `${driver.distanceKm.toFixed(1)} km`}
                      {activeCategory === 'speed' && `${driver.topSpeedKmh} km/h`}
                      {activeCategory === 'chai' && `${driver.chaiCount} ☕`}
                      {activeCategory === 'passengers' && `${driver.passengersServed} 🛺`}
                    </span>
                  </div>

                  {/* Secondary Metric */}
                  <div className="col-span-3 sm:col-span-2 text-right text-emerald-400 font-mono font-bold text-[11px]">
                    ₹{driver.earnings}
                  </div>
                </div>
              );
            })}

            {filteredDrivers.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No drivers found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Bar for Current Driver Status & Sync Button */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {currentProfile ? (
              <div className="text-left leading-tight">
                <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <span>Logged in as:</span>
                  <span className="text-amber-300 font-bold">{currentProfile.name}</span>
                  <span className="font-mono text-zinc-400">({currentProfile.licenseNumber})</span>
                </div>
                <div className="text-xs text-white font-mono font-bold">
                  {userEntry ? `All-India Rank: #${userEntry.rank}` : 'Rank: Unlisted / New Shift'} • ₹
                  {Math.max(currentProfile.totalEarnings, currentShiftStats?.earnings || 0)} Fares
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-300 font-medium">
                Tip: Choose "Login or Play as Guest" on title screen to record your rank!
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {syncStatus && (
              <span className="text-[11px] text-emerald-400 font-bold animate-pulse">
                {syncStatus}
              </span>
            )}

            {currentProfile && (
              <button
                onClick={handleSyncScore}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-amber-500/50 text-amber-300 font-bold text-xs uppercase flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition"
                title="Sync and submit your latest shift stats to server"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Sync</span>
              </button>
            )}

            {/* Share Score Button */}
            <button
              onClick={handleShareScore}
              disabled={isGeneratingShare}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer active:scale-95 transition disabled:opacity-50"
              title="Generate a shareable driver permit image using canvas data"
            >
              {isGeneratingShare ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isGeneratingShare ? 'Generating...' : 'Share Score 📸'}</span>
            </button>
          </div>
        </div>

        {/* Share Scorecard Preview Modal */}
        {shareImage && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in select-none">
            <div className="relative w-full max-w-xl bg-zinc-950 border-2 border-amber-500 rounded-3xl p-4 sm:p-5 shadow-[0_0_60px_rgba(245,158,11,0.5)] flex flex-col gap-3 max-h-[92vh]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-base">
                    📸
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase font-['Cinzel',sans-serif]">
                      Shareable Driver Scorecard
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      High-resolution permit image generated from live canvas
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShareImage(null)}
                  className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Toast */}
              {shareToast && (
                <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs text-center font-bold animate-in fade-in">
                  {shareToast}
                </div>
              )}

              {/* Image Preview */}
              <div className="overflow-y-auto max-h-[60vh] flex items-center justify-center p-2 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                <img
                  src={shareImage}
                  alt="Bharat Auto Driver Scorecard"
                  className="max-h-[56vh] w-auto object-contain rounded-xl shadow-2xl border border-amber-500/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800">
                <button
                  onClick={handleDownloadImage}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-zinc-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG 📥</span>
                </button>

                <button
                  onClick={handleWebShare}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Score 🚀</span>
                </button>

                <button
                  onClick={handleCopyImage}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 border border-zinc-700 active:scale-95 transition cursor-pointer"
                  title="Copy to Clipboard"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
