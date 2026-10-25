import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  ShieldCheck,
  Zap,
  Dice5,
  CheckCircle,
  AlertCircle,
  LogOut,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Car,
} from 'lucide-react';
import {
  DriverProfile,
  AVAILABLE_CITIES,
  getRandomGuestName,
  createGuestDriver,
  loginDriver,
  registerDriver,
  logoutDriver,
} from '../game/auth';
import { RICKSHAW_LIVERIES } from '../game/multiplayer';
import { sounds } from '../game/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: DriverProfile | null;
  onProfileUpdated: (profile: DriverProfile | null) => void;
  onStartDriveAfterAuth?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
  onStartDriveAfterAuth,
}) => {
  // Tabs: 'guest' | 'login' | 'register' | 'profile'
  const [activeTab, setActiveTab] = useState<'guest' | 'login' | 'register' | 'profile'>(
    currentProfile ? 'profile' : 'guest'
  );

  // Guest State
  const [guestName, setGuestName] = useState(getRandomGuestName());
  const [guestCity, setGuestCity] = useState(AVAILABLE_CITIES[0].id);
  const [guestLivery, setGuestLivery] = useState(RICKSHAW_LIVERIES[0].id);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register State
  const [regName, setRegName] = useState(currentProfile?.isGuest ? currentProfile.name : '');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState(AVAILABLE_CITIES[0].id);
  const [regLivery, setRegLivery] = useState(RICKSHAW_LIVERIES[0].id);

  // Status message
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleRollGuestName = () => {
    sounds.playPhoneClick();
    setGuestName(getRandomGuestName());
  };

  const handleContinueAsGuest = () => {
    sounds.playHorn('bulb');
    const profile = createGuestDriver(guestName, guestLivery, guestCity);
    onProfileUpdated(profile);
    onClose();
    if (onStartDriveAfterAuth) {
      onStartDriveAfterAuth();
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = loginDriver(loginEmail, loginPassword);
    if (!res.success || !res.profile) {
      setErrorMessage(res.error || 'Login failed. Please check credentials.');
      return;
    }

    sounds.playHorn('airhorn');
    setSuccessMessage(`Swagat Hai, ${res.profile.name}! Driver License Verified.`);
    onProfileUpdated(res.profile);
    setTimeout(() => {
      onClose();
      if (onStartDriveAfterAuth) {
        onStartDriveAfterAuth();
      }
    }, 600);
  };

  const handleQuickDemoLogin = (email: string) => {
    sounds.playPhoneClick();
    setLoginEmail(email);
    setLoginPassword('auto123');
    setErrorMessage('');
    const res = loginDriver(email, 'auto123');
    if (res.success && res.profile) {
      sounds.playHorn('airhorn');
      setSuccessMessage(`Logged in as demo driver: ${res.profile.name}!`);
      onProfileUpdated(res.profile);
      setTimeout(() => {
        onClose();
        if (onStartDriveAfterAuth) {
          onStartDriveAfterAuth();
        }
      }, 500);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = registerDriver({
      name: regName,
      email: regEmail,
      password: regPassword,
      cityId: regCity,
      liveryId: regLivery,
      existingGuestProfile: currentProfile?.isGuest ? currentProfile : null,
    });

    if (!res.success || !res.profile) {
      setErrorMessage(res.error || 'Registration failed.');
      return;
    }

    sounds.playHorn('airhorn');
    setSuccessMessage(`Driver License ${res.profile.licenseNumber} issued successfully!`);
    onProfileUpdated(res.profile);
    setTimeout(() => {
      onClose();
      if (onStartDriveAfterAuth) {
        onStartDriveAfterAuth();
      }
    }, 700);
  };

  const handleSignOut = () => {
    sounds.playPhoneClick();
    logoutDriver();
    onProfileUpdated(null);
    setActiveTab('guest');
    setSuccessMessage('Signed out. Choose guest or login to continue driving.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-xl bg-zinc-950 border-2 border-amber-500/70 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Transport Department Header Ribbon */}
        <div className="relative px-5 py-3.5 bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-xl shadow-inner">
              🛺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-black">
                  CHALAK PARWANA
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Bharat RTO Transport</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase font-['Cinzel',sans-serif]">
                Driver License & Authentication
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/60 px-2 sm:px-4 pt-2 gap-1.5 overflow-x-auto text-xs font-bold">
          {currentProfile && (
            <button
              onClick={() => {
                setActiveTab('profile');
                setErrorMessage('');
              }}
              className={`px-3 py-2 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-zinc-950 text-amber-300 border-t-2 border-x-2 border-amber-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Permit</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('guest');
              setErrorMessage('');
            }}
            className={`px-3 py-2 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'guest'
                ? 'bg-zinc-950 text-amber-300 border-t-2 border-x-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Play as Guest</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
            }}
            className={`px-3 py-2 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'login'
                ? 'bg-zinc-950 text-amber-300 border-t-2 border-x-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Driver Login</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
            }}
            className={`px-3 py-2 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'register'
                ? 'bg-zinc-950 text-amber-300 border-t-2 border-x-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>New License (Register)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-zinc-200">
          {/* Notifications */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: CURRENT DRIVER LICENSE CARD (if logged in or guest) */}
          {activeTab === 'profile' && currentProfile && (
            <div className="space-y-4">
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-950/90 via-zinc-900 to-zinc-950 border-2 border-amber-500 shadow-xl overflow-hidden">
                {/* Holographic Watermark */}
                <div className="absolute top-2 right-3 text-right opacity-20 pointer-events-none">
                  <div className="text-3xl font-black font-mono">BHARAT RTO</div>
                  <div className="text-xs">COMMERCIAL PERMIT</div>
                </div>

                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-md">
                      {currentProfile.avatarIcon || '🛺'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">{currentProfile.name}</h3>
                        {currentProfile.isGuest ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300 font-bold uppercase">
                            Guest Driver
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-bold uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> DL Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-amber-300">
                        License: {currentProfile.licenseNumber}
                      </p>
                      <p className="text-[11px] text-zinc-400">RTO Zone: {currentProfile.city}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-amber-400 font-bold text-sm">⭐ {currentProfile.rating}</div>
                    <div className="text-[10px] text-zinc-400">Driver Rating</div>
                  </div>
                </div>

                {/* Driving Stats Grid */}
                <div className="mt-4 pt-3 border-t border-amber-500/30 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800">
                    <div className="text-zinc-400 text-[10px] uppercase font-bold">Fares Collected</div>
                    <div className="text-amber-400 font-black font-mono text-sm sm:text-base">
                      ₹ {currentProfile.totalEarnings}
                    </div>
                  </div>
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800">
                    <div className="text-zinc-400 text-[10px] uppercase font-bold">Trips Served</div>
                    <div className="text-white font-black font-mono text-sm sm:text-base">
                      {currentProfile.totalTrips} Trips
                    </div>
                  </div>
                  <div className="bg-zinc-950/60 p-2 rounded-xl border border-zinc-800">
                    <div className="text-zinc-400 text-[10px] uppercase font-bold">Cutting Chai</div>
                    <div className="text-amber-300 font-black font-mono text-sm sm:text-base">
                      {currentProfile.chaiCups} Cups
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  onClick={() => {
                    sounds.playHorn('bulb');
                    onClose();
                    if (onStartDriveAfterAuth) {
                      onStartDriveAfterAuth();
                    }
                  }}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
                >
                  <span>Chalo! Hit The Highway</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {currentProfile.isGuest ? (
                  <button
                    onClick={() => {
                      setRegName(currentProfile.name);
                      setActiveTab('register');
                    }}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-cyan-950 border border-cyan-400/50 hover:bg-cyan-900 text-cyan-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    title="Convert your guest stats to an official verified account"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upgrade to Official License</span>
                  </button>
                ) : null}

                <button
                  onClick={handleSignOut}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-rose-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Switch / Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PLAY AS GUEST */}
          {activeTab === 'guest' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-100">
                  <span className="font-bold text-amber-300 block">Instant Guest Mode</span>
                  Drive immediately without an account. Your stats and high scores are saved in this
                  browser and you can register an official license anytime!
                </div>
              </div>

              {/* Guest Nickname Input with Desi Randomizer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Driver Nickname</span>
                  <button
                    type="button"
                    onClick={handleRollGuestName}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  >
                    <Dice5 className="w-3.5 h-3.5" /> Roll Random Desi Handle
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    maxLength={24}
                    placeholder="Enter nickname (e.g. Ustaad Raju #402)"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* City Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Home RTO City / Route</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_CITIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setGuestCity(c.id)}
                      className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                        guestCity === c.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-mono text-[9px] text-amber-400/80">{c.rtoCode}</div>
                      <div className="truncate">{c.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rickshaw Livery Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Rickshaw Paint Style</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {RICKSHAW_LIVERIES.map((liv) => (
                    <button
                      key={liv.id}
                      type="button"
                      onClick={() => setGuestLivery(liv.id)}
                      className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer flex items-center gap-2 ${
                        guestLivery === liv.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow"
                        style={{
                          background: `linear-gradient(135deg, #${liv.hoodHex.toString(16).padStart(6, '0')} 50%, #${liv.bodyHex.toString(16).padStart(6, '0')} 50%)`,
                        }}
                      />
                      <div className="truncate text-[11px]">{liv.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer active:scale-98"
              >
                <span>CHALO! HOP IN AS GUEST DRIVER 🛺</span>
              </button>
            </div>
          )}

          {/* TAB 3: DRIVER LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Driver Email / ID</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. ustaad@bharat.in"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">PIN / Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter driver password"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-3 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo Account Quick Shortcut */}
              <div className="pt-1">
                <div className="text-[11px] text-zinc-400 mb-1.5 font-semibold">
                  Quick Demo Accounts:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('ustaad@bharat.in')}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-[11px] font-mono text-amber-300 hover:bg-zinc-800 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>👳🏽‍♂️ Ustaad Vikram (Delhi)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('mumbai@speed.in')}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 hover:bg-zinc-800 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🕶️ Babu Kaali-Peeli (Mumbai)</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
              >
                <span>VERIFY LICENSE & START ENGINE 🔑</span>
              </button>
            </form>
          )}

          {/* TAB 4: REGISTER NEW DRIVER LICENSE */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {currentProfile?.isGuest && (
                <div className="bg-cyan-950/80 border border-cyan-400/40 p-2.5 rounded-xl text-xs text-cyan-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>
                    Your current guest earnings (₹{currentProfile.totalEarnings}) and trips will be
                    preserved into this new license!
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Driver Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Verma"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="driver@example.com"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Set Driver Password</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">RTO Permit Zone</label>
                  <select
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {AVAILABLE_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.rtoCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Rickshaw Paint Style</label>
                  <select
                    value={regLivery}
                    onChange={(e) => setRegLivery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {RICKSHAW_LIVERIES.map((liv) => (
                      <option key={liv.id} value={liv.id}>
                        {liv.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
              >
                <span>APPLY & ISSUE OFFICIAL DRIVING LICENSE 🪪</span>
              </button>
            </form>
          )}
        </div>

        {/* Bottom Indian Transport Seal Footer */}
        <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Bharat Transport Highway Authority • 5G Network Ready</span>
          </div>
          <span className="font-mono text-zinc-400">Ver 2.5 • NH-48 Express</span>
        </div>
      </div>
    </div>
  );
};
