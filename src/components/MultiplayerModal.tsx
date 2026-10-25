import React, { useState } from 'react';
import {
  Users,
  Wifi,
  Radio,
  Send,
  Sparkles,
  Palette,
  Volume2,
  X,
  Check,
  Compass,
  ArrowRight,
  ShieldCheck,
  Coffee,
  Zap,
  UserPlus,
  Star,
  Copy,
  Trash2,
  MessageCircle,
  Award,
  Heart,
} from 'lucide-react';
import { GameEngine } from '../game/engine';
import { RICKSHAW_LIVERIES, RickshawLivery, ChatMessage, NetworkPlayer } from '../game/multiplayer';
import { sounds } from '../game/audio';
import { getSavedSession, saveSession } from '../game/auth';
import {
  FriendDriver,
  getSavedFriends,
  addNewFriend,
  removeFriend,
  toggleFavorite,
  giftChaiToFriend,
  inviteToConvoy,
  getMyDriverFriendCode,
} from '../game/friends';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine | null;
  drivers: Array<{
    id: string;
    name: string;
    color: string;
    speedKmh: number;
    distanceKm: number;
  }>;
  recentChats: ChatMessage[];
  isConnected: boolean;
  pingMs: number;
  onlineCount: number;
}

const QUICK_TAUNTS = [
  'HORN OK PLEASE! 🎺',
  'Side do Ustaad, jaldi hai! 🛺💨',
  'Chai break at next dhaba? ☕',
  'Race to the toll plaza! 🏁',
  'Namaste Bhai! Shubh Yatra! 🙏',
  'Monsoon rain, drive carefully! 🌧️',
  'Buri nazar wale tera muh kala! 🧿',
];

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  engine,
  drivers,
  recentChats,
  isConnected,
  pingMs,
  onlineCount,
}) => {
  const [tab, setTab] = useState<'fleet' | 'friends' | 'chat' | 'livery'>('fleet');
  const [chatInput, setChatInput] = useState('');
  const [driverNameInput, setDriverNameInput] = useState(
    engine?.multiplayer?.driverName || 'Ustaad Driver'
  );
  const [selectedLivery, setSelectedLivery] = useState<string>(
    engine?.multiplayer?.liveryId || 'classic_green_yellow'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Friends Feature State
  const [friends, setFriends] = useState<FriendDriver[]>(() => getSavedFriends());
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'favorites'>('all');
  const [newFriendCodeInput, setNewFriendCodeInput] = useState('');
  const [friendToast, setFriendToast] = useState<string | null>(null);
  const [copiedCodeToast, setCopiedCodeToast] = useState(false);
  const myFriendCode = getMyDriverFriendCode();

  if (!isOpen) return null;

  const showFriendToast = (msg: string) => {
    setFriendToast(msg);
    setTimeout(() => setFriendToast(null), 3500);
  };

  const handleSendChat = (customText?: string) => {
    const text = (customText || chatInput).trim();
    if (!text) return;
    sounds.playPhoneClick();
    engine?.multiplayer?.sendChat(text);
    setChatInput('');
  };

  const handleHonkAtDriver = () => {
    sounds.playPhoneClick();
    sounds.playHorn('bulb');
    engine?.multiplayer?.sendHonk('bulb');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPhoneClick();
    if (engine) {
      engine.updatePlayerProfile(driverNameInput, selectedLivery);
    } else {
      try {
        localStorage.setItem('bharat_driver_name', driverNameInput);
        localStorage.setItem('bharat_rickshaw_livery', selectedLivery);
      } catch {
        // Ignore localStorage error
      }
    }

    // Sync auth session if one exists
    const session = getSavedSession();
    if (session) {
      session.name = driverNameInput.trim() || session.name;
      session.liveryId = selectedLivery;
      saveSession(session);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Friends Handlers
  const handleCopyMyCode = () => {
    sounds.playPhoneClick();
    try {
      navigator.clipboard.writeText(myFriendCode);
      setCopiedCodeToast(true);
      setTimeout(() => setCopiedCodeToast(false), 2500);
    } catch {
      showFriendToast(`Your Driver Code: ${myFriendCode}`);
    }
  };

  const handleAddFriendByInput = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newFriendCodeInput.trim();
    if (!val) return;
    sounds.playPhoneClick();

    const res = addNewFriend({
      name: val.startsWith('YAAR-') ? `Driver ${val.substring(5)}` : val,
      driverCode: val.startsWith('YAAR-') ? val : undefined,
    });

    if (res.success) {
      setFriends(getSavedFriends());
      setNewFriendCodeInput('');
      showFriendToast(res.message);
    } else {
      showFriendToast(res.message);
    }
  };

  const handleAddFriendFromFleet = (driverName: string, color: string) => {
    sounds.playPhoneClick();
    const res = addNewFriend({
      name: driverName,
      liveryId: color,
    });
    setFriends(getSavedFriends());
    showFriendToast(res.message);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavorite(id);
    setFriends(updated);
  };

  const handleRemoveFriend = (id: string, name: string) => {
    const updated = removeFriend(id);
    setFriends(updated);
    showFriendToast(`Removed ${name} from friends.`);
  };

  const handleGiftChai = (friendId: string) => {
    const res = giftChaiToFriend(friendId);
    setFriends(getSavedFriends());
    showFriendToast(res.message);
  };

  const handleInviteConvoy = (friendId: string, friendName: string) => {
    const res = inviteToConvoy(friendId);
    engine?.multiplayer?.sendChat(`🛺💨 @${friendName} Let's drive in convoy!`);
    showFriendToast(res.message);
  };

  const filteredFriends = friends.filter((f) => {
    if (friendFilter === 'online') return f.status !== 'offline';
    if (friendFilter === 'favorites') return f.isFavorite;
    return true;
  });

  const onlineFriendsCount = friends.filter((f) => f.status !== 'offline').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-zinc-900 to-cyan-950/80 border-b border-cyan-500/30 p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  NH-48 Fleet & Yaar Network
                </h2>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span>{isConnected ? `${onlineCount} Online` : 'Connecting...'}</span>
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                Real-Time 5G WebSocket Highway Network • Ping: {pingMs} ms
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Close Multiplayer Lobby"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Toast for Friends and Actions */}
        {friendToast && (
          <div className="bg-gradient-to-r from-cyan-950 to-emerald-950 border-b border-cyan-500/40 px-3.5 py-2 text-xs text-cyan-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-[11px] truncate">{friendToast}</span>
          </div>
        )}

        {/* Navigation Tabs (4 Tabs) */}
        <div className="grid grid-cols-4 bg-zinc-900/90 border-b border-zinc-800 text-xs font-bold shrink-0">
          <button
            onClick={() => {
              sounds.playPhoneClick();
              setTab('fleet');
            }}
            className={`py-2.5 flex flex-col sm:flex-row items-center justify-center gap-1 border-b-2 transition cursor-pointer ${
              tab === 'fleet'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-xs">Fleet ({drivers.length + 1})</span>
          </button>

          <button
            onClick={() => {
              sounds.playPhoneClick();
              setTab('friends');
            }}
            className={`py-2.5 flex flex-col sm:flex-row items-center justify-center gap-1 border-b-2 transition cursor-pointer relative ${
              tab === 'friends'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <span className="text-[10px] sm:text-xs">Yaar ({friends.length})</span>
            {onlineFriendsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse absolute top-1.5 right-2" />
            )}
          </button>

          <button
            onClick={() => {
              sounds.playPhoneClick();
              setTab('chat');
            }}
            className={`py-2.5 flex flex-col sm:flex-row items-center justify-center gap-1 border-b-2 transition cursor-pointer relative ${
              tab === 'chat'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-xs">Radio</span>
            {recentChats.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute top-1.5 right-2" />
            )}
          </button>

          <button
            onClick={() => {
              sounds.playPhoneClick();
              setTab('livery');
            }}
            className={`py-2.5 flex flex-col sm:flex-row items-center justify-center gap-1 border-b-2 transition cursor-pointer ${
              tab === 'livery'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-xs">Paint</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-3 scrollbar-thin">
          {/* ========================================================= */}
          {/* TAB 1: FLEET DRIVERS LIST                                */}
          {/* ========================================================= */}
          {tab === 'fleet' && (
            <div className="flex flex-col gap-3">
              {/* Local Player Status Card */}
              <div className="bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-zinc-950 border border-cyan-500/40 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl shadow-md">
                    🛺
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-white">
                        {engine?.multiplayer?.driverName || 'You (Local Driver)'}
                      </h4>
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.2 rounded font-mono">
                        YOU
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Code:{' '}
                      <span className="text-amber-300 font-mono font-semibold">{myFriendCode}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleHonkAtDriver}
                    className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition active:scale-95 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title="Honk Bulb Horn at Fleet"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Honk</span>
                  </button>
                </div>
              </div>

              {/* Online Drivers Count Notice */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono px-1">
                <span>ONLINE AUTO-RICKSHAWS ON HIGHWAY</span>
                <span className="text-cyan-400 font-bold">{drivers.length + 1} Vehicles Active</span>
              </div>

              {/* Other Drivers List */}
              <div className="space-y-2">
                {drivers.length === 0 ? (
                  <div className="text-center py-8 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <span className="text-3xl">🛺💨</span>
                    <p className="text-xs font-semibold text-zinc-200">Cruising on open highway!</p>
                    <p className="text-[10px] text-zinc-400 max-w-xs leading-relaxed">
                      Share your Yaar code with fellow drivers to race together in real-time, or add them as friends!
                    </p>
                  </div>
                ) : (
                  drivers.map((d, idx) => {
                    const liveryInfo =
                      RICKSHAW_LIVERIES.find((l) => l.id === d.color) || RICKSHAW_LIVERIES[0];
                    const isAlreadyFriend = friends.some(
                      (f) => f.name.toLowerCase() === d.name.toLowerCase()
                    );

                    return (
                      <div
                        key={d.id || idx}
                        className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/40 rounded-2xl p-3 flex items-center justify-between transition-all shadow-md group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10 shrink-0"
                            style={{ backgroundColor: `${liveryInfo.bodyHex}33` }}
                          >
                            🛺
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                              {d.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                              <span className="text-amber-300 font-mono font-bold">
                                {d.speedKmh} km/h
                              </span>
                              <span>•</span>
                              <span className="text-zinc-400 font-mono">Dist: {d.distanceKm} km</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAlreadyFriend ? (
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Yaar
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddFriendFromFleet(d.name, d.color)}
                              className="px-2 py-1 rounded-lg bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 shadow"
                              title="Add to Yaar Driver Network"
                            >
                              <UserPlus className="w-3 h-3 text-cyan-400" />
                              <span>+ Yaar</span>
                            </button>
                          )}

                          <button
                            onClick={handleHonkAtDriver}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-700 transition cursor-pointer text-xs"
                            title="Honk at driver"
                          >
                            🎺
                          </button>
                          <button
                            onClick={() => handleSendChat(`Namaste ${d.name}! 🛺`)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-300 border border-zinc-700 transition cursor-pointer text-xs"
                            title="Wave at driver"
                          >
                            👋
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: YAAR FRIENDS NETWORK (DRIVER BUDDY MANDAL)         */}
          {/* ========================================================= */}
          {tab === 'friends' && (
            <div className="flex flex-col gap-3 min-h-[340px]">
              {/* My Driver Code Card */}
              <div className="bg-gradient-to-r from-amber-950/70 via-zinc-900 to-amber-950/70 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-lg">
                    🪪
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">
                      Your Driver Yaar Code
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm sm:text-base font-black text-white tracking-widest">
                        {myFriendCode}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyMyCode}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-md"
                >
                  {copiedCodeToast ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Add New Friend Bar */}
              <form onSubmit={handleAddFriendByInput} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFriendCodeInput}
                  onChange={(e) => setNewFriendCodeInput(e.target.value)}
                  placeholder="Enter Friend's Yaar Code (e.g. YAAR-DL44) or Name..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!newFriendCodeInput.trim()}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 shadow-md whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Yaar</span>
                </button>
              </form>

              {/* Filter Chips Bar */}
              <div className="flex items-center justify-between text-[10px] pt-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFriendFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      friendFilter === 'all'
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({friends.length})
                  </button>
                  <button
                    onClick={() => setFriendFilter('online')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                      friendFilter === 'online'
                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online ({onlineFriendsCount})</span>
                  </button>
                  <button
                    onClick={() => setFriendFilter('favorites')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                      friendFilter === 'favorites'
                        ? 'bg-yellow-400 text-zinc-950 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span>Favorites ({friends.filter((f) => f.isFavorite).length})</span>
                  </button>
                </div>

                <span className="text-zinc-500 font-mono hidden sm:inline">
                  Bharat Yaar Mandal
                </span>
              </div>

              {/* Friends List Cards */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-8 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <span className="text-2xl">🤝</span>
                    <p className="text-xs font-semibold text-zinc-200">No friends in this filter</p>
                    <p className="text-[10px] text-zinc-500">
                      Add fellow auto drivers by entering their driver code or clicking "+ Yaar" in the Fleet tab!
                    </p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-zinc-900/85 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-3 flex flex-col gap-2 transition shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shrink-0 shadow-inner">
                            {friend.avatarIcon || '🛺'}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-white truncate">
                                {friend.name}
                              </h4>
                              <button
                                onClick={() => handleToggleFavorite(friend.id)}
                                className="text-zinc-500 hover:text-yellow-400 transition"
                                title="Toggle Favorite"
                              >
                                <Star
                                  className={`w-3 h-3 ${
                                    friend.isFavorite
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-zinc-600'
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
                              <span className="text-amber-400 font-semibold">{friend.driverCode}</span>
                              <span>•</span>
                              <span>{friend.city}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${
                              friend.status === 'online'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : friend.status === 'racing'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : friend.status === 'chai_break'
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {friend.status !== 'offline' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                            <span className="capitalize">{friend.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                      </div>

                      {/* Status Text & Location */}
                      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-2.5 py-1.5 text-[10px] text-zinc-300 flex items-center justify-between">
                        <span className="truncate italic">"{friend.statusText}"</span>
                        {friend.speedKmh > 0 && (
                          <span className="font-mono text-amber-300 font-bold ml-2 shrink-0">
                            {friend.speedKmh} km/h
                          </span>
                        )}
                      </div>

                      {/* Stats & Interactive Action Buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px]">
                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[9px]">
                          <span>Trips: <strong className="text-white">{friend.tripsTogether}</strong></span>
                          <span>•</span>
                          <span>Chai: <strong className="text-amber-300">{friend.chaiShared} ☕</strong></span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Send Cutting Chai */}
                          <button
                            onClick={() => handleGiftChai(friend.id)}
                            className="px-2 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-[10px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-sm"
                            title="Send hot cutting chai gift"
                          >
                            <Coffee className="w-3 h-3 text-amber-400" />
                            <span>Chai</span>
                          </button>

                          {/* Convoy Invite */}
                          <button
                            onClick={() => handleInviteConvoy(friend.id, friend.name)}
                            className="px-2 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-sm"
                            title="Invite to drive in Convoy"
                          >
                            <Zap className="w-3 h-3 text-cyan-400 fill-current" />
                            <span>Convoy</span>
                          </button>

                          {/* Quick Message */}
                          <button
                            onClick={() => {
                              sounds.playPhoneClick();
                              setTab('chat');
                              setChatInput(`@${friend.name} `);
                            }}
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Message friend"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveFriend(friend.id, friend.name)}
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                            title="Remove from Friends"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LIVE HIGHWAY RADIO WALKIE-TALKIE CHAT              */}
          {/* ========================================================= */}
          {tab === 'chat' && (
            <div className="flex flex-col gap-3 min-h-[340px] justify-between">
              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto space-y-2 p-1 max-h-[200px] scrollbar-thin">
                {recentChats.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    Highway wireless channel is quiet. Broadcast the first shout!
                  </div>
                ) : (
                  recentChats.map((c) => (
                    <div
                      key={c.id}
                      className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 text-xs shadow-md"
                    >
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                        <span className="font-bold text-cyan-300 flex items-center gap-1">
                          <span>🛺</span>
                          <span>{c.name}</span>
                        </span>
                        <span className="font-mono text-[9px]">{c.time}</span>
                      </div>
                      <p className="text-white font-medium leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Preset Shout Buttons */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Quick Highway Shouts:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto scrollbar-none">
                  {QUICK_TAUNTS.map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChat(msg)}
                      className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-cyan-300 border border-zinc-800 px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition active:scale-95"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2 pt-2 border-t border-zinc-800"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Broadcast message to all drivers..."
                  className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: RICKSHAW PAINT & CUSTOM LIVERY                     */}
          {/* ========================================================= */}
          {tab === 'livery' && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              {/* Driver Name Input */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Driver Nickname</span>
                  <span className="text-[10px] text-zinc-400 font-normal">(Visible to all players)</span>
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={driverNameInput}
                  onChange={(e) => setDriverNameInput(e.target.value)}
                  placeholder="e.g. Ustaad Raju, NH-48 King..."
                  className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Livery Selector Cards */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white">Select Rickshaw Paint Theme:</label>
                <div className="grid grid-cols-2 gap-2">
                  {RICKSHAW_LIVERIES.map((liv) => (
                    <button
                      key={liv.id}
                      type="button"
                      onClick={() => {
                        sounds.playPhoneClick();
                        setSelectedLivery(liv.id);
                      }}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1.5 transition cursor-pointer relative ${
                        selectedLivery === liv.id
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Two-tone color preview balls */}
                        <div className="flex items-center -space-x-1">
                          <div
                            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: `#${liv.hoodHex.toString(16).padStart(6, '0')}` }}
                            title="Canopy Roof"
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: `#${liv.bodyHex.toString(16).padStart(6, '0')}` }}
                            title="Cab Body"
                          />
                        </div>

                        {selectedLivery === liv.id && (
                          <span className="w-4 h-4 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white">{liv.name}</h4>
                        <span className="text-[9px] text-zinc-400 block">{liv.city}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-98 cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-1"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Profile & Livery Saved!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Apply Profile & Livery to 3D Auto</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
