import React from 'react';
import { GameState } from '../game/engine';

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ state, onRestart }) => {
  return (
    <div className="absolute inset-0 z-40 bg-zinc-950/85 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-stone-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 flex flex-col gap-4 relative overflow-hidden">
        {/* Tricolor Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-white to-emerald-600" />

        {/* Receipt Header */}
        <div className="text-center pt-2">
          <div className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
            Trip Completion Receipt
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-300 font-['Cinzel',sans-serif] uppercase tracking-wide">
            Shift Ended
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            DL 1R TA 4092 • Delhi-Jaipur Express Highway
          </p>
        </div>

        {/* Printed Bill Card */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3 font-mono text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-400">
            <span>Total Distance</span>
            <span className="text-stone-200 font-bold">{state.distanceKm.toFixed(2)} km</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-400">
            <span>Passengers Delivered</span>
            <span className="text-stone-200 font-bold">{state.passengersServed} passengers</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-400">
            <span>Cutting Chai Cups</span>
            <span className="text-amber-400 font-bold">{state.chaiCount} cups ☕</span>
          </div>

          <div className="flex items-center justify-between pt-1 text-base sm:text-lg font-bold">
            <span className="text-amber-300 font-sans">Total Fare ₹</span>
            <span className="text-emerald-400 text-xl font-black">₹ {state.totalEarnings}</span>
          </div>
        </div>

        {/* Driver Badge */}
        <div className="bg-amber-950/40 border border-amber-600/30 rounded-xl p-3 text-center">
          <div className="text-xs text-amber-300 font-semibold">Driver Rating</div>
          <div className="text-base sm:text-lg text-amber-400 font-black mt-0.5">
            ⭐⭐⭐⭐⭐ {state.passengersServed >= 3 ? 'Supreme Auto Ustad' : 'Certified Desi Driver'}
          </div>
        </div>

        {/* Restart Action */}
        <button
          onClick={onRestart}
          onTouchStart={onRestart}
          className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 active:from-amber-400 active:to-amber-500 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
        >
          Start New Shift (Drive Again) 🛺
        </button>
      </div>
    </div>
  );
};
