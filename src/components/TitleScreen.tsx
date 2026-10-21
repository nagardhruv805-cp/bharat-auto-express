import React from 'react';
import { Volume2, VolumeX, Smartphone } from 'lucide-react';
import { sounds } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, isMuted, onToggleMute }) => {
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const handleStart = () => {
    sounds.playHorn();
    onStart();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 md:p-12 pointer-events-none select-none text-white overflow-y-auto">
      {/* Top Bar with Brand Badge & Audio toggle */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3 bg-zinc-950/85 border border-amber-500/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-amber-300">
            India Real-Physics Simulator
          </span>
        </div>

        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 bg-zinc-950/85 active:bg-zinc-900 border border-zinc-700 hover:border-amber-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>
      </div>

      {/* Centerpiece: Bespoke Indian Truck-Art Title Lockup */}
      <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto pointer-events-auto py-4">
        {/* Decorative Indian Marigold Garland & Truck-Art Emblem */}
        <div className="relative mb-2 flex items-center justify-center">
          <svg className="w-56 h-12 sm:w-72 sm:h-16 md:w-96 md:h-20" viewBox="0 0 400 80" fill="none">
            <path d="M40 40 L80 15 L320 15 L360 40 L320 65 L80 65 Z" fill="#18181b" stroke="#f59e0b" strokeWidth="3" />
            <circle cx="200" cy="40" r="28" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
            <text x="200" y="45" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
              ₹ RE
            </text>
            <path d="M10 40 Q40 20 70 40" stroke="#f59e0b" strokeWidth="2" fill="none" />
            <path d="M330 40 Q360 20 390 40" stroke="#f59e0b" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* Main Title Typography with handcrafted 3D drop shadow */}
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_4px_16px_rgba(217,119,6,0.6)] font-['Cinzel',sans-serif]">
          Bharat Auto Express
        </h1>

        <p className="mt-1 sm:mt-2 text-xs sm:text-base text-amber-100/90 font-medium tracking-wide max-w-xl px-2">
          The Grand Desi Highway Simulator • Heritage Bazaars • Sacred Shrines • Cutting Chai
        </p>

        {/* Mobile Phone Controls Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-[11px] sm:text-xs font-bold text-amber-300">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Phone Dual-Thumb Touch Controls Enabled</span>
        </div>

        {/* Primary Start CTA Button */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleStart}
            onTouchStart={handleStart}
            className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-3.5 sm:py-4 text-base sm:text-xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 active:from-amber-400 active:to-amber-500 text-zinc-950 rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.6)] active:scale-95 transition-all cursor-pointer border-2 border-amber-300"
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">🛺</span>
              <span>CHALO! START DRIVE</span>
              <span className="text-[10px] sm:text-xs bg-zinc-950/20 px-2 py-0.5 rounded font-mono text-zinc-900 font-bold hidden sm:inline-block">
                [SPACE / TAP]
              </span>
            </span>
          </button>

          <span className="text-[11px] sm:text-xs text-amber-200/80 font-mono tracking-wider">
            Tip: Honk at holy cows and traffic to clear the way! 🙏
          </span>
        </div>
      </div>

      {/* Bottom Flat Control-Hint Line */}
      <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-5 bg-zinc-950/85 border border-zinc-800/80 px-4 py-2.5 rounded-2xl text-[11px] sm:text-xs text-zinc-300 pointer-events-auto">
        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
          <span>📱 OPPO F27 5G:</span>
          <span className="text-zinc-200 font-medium">Call Maa, Mechanic, Chaiwala & anyone in-game! [P]</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-zinc-600 hidden sm:block" />
        <div className="flex items-center gap-1 text-zinc-400">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-amber-300 font-mono">WASD</kbd>
          <span>/</span>
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-amber-300 font-mono">SPACE</kbd>
          <span className="ml-1 text-zinc-300">Gas & Steer</span>
        </div>
      </div>
    </div>
  );
};
