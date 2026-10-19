import React from 'react';
import { Volume2, VolumeX, Pause, Play, Camera, Zap, Heart } from 'lucide-react';
import { GameState, GameEngine } from '../game/engine';
import { PhoneControls } from './PhoneControls';

interface GameHUDProps {
  state: GameState;
  engine: GameEngine | null;
  onTogglePause: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  engine,
  onTogglePause,
  onToggleMute,
  isMuted,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-2 sm:p-5 pointer-events-none select-none text-white font-sans overflow-hidden">
      {/* ==================================================== */}
      {/* 1. TOP PERIMETER STATUS CLUSTERS (<15% occlusion)    */}
      {/* ==================================================== */}
      <div className="flex items-start justify-between w-full max-w-7xl mx-auto gap-1.5 sm:gap-2">
        {/* TOP-LEFT: AUTHENTIC INDIAN DIGITAL FARE TAXI METER */}
        <div className="bg-zinc-950/90 border sm:border-2 border-zinc-800 rounded-xl p-2 sm:p-3 shadow-2xl flex flex-col gap-0.5 sm:gap-1 min-w-[110px] sm:min-w-[170px] pointer-events-auto">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
              Meter
            </span>
            <span
              className={`text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded tracking-wide ${
                state.hasPassenger
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {state.hasPassenger ? '● HIRED' : '○ VACANT'}
            </span>
          </div>

          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-lg sm:text-3xl font-black font-mono tracking-tight text-amber-400 tabular-nums">
              ₹ {state.fareRupees.toFixed(0)}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-amber-300/70">.00</span>
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-xs text-zinc-400 pt-0.5 sm:pt-1 border-t border-zinc-800/80 font-mono">
            <span>Trip:</span>
            <span className="text-zinc-200 font-bold tabular-nums">
              {state.distanceKm.toFixed(2)} km
            </span>
          </div>
          {state.hasPassenger && (
            <div className="text-[9px] sm:text-[10px] text-amber-300 font-medium truncate max-w-[100px] sm:max-w-[160px]">
              {state.passengerName.split(' ')[0]}
            </div>
          )}
        </div>

        {/* TOP-CENTER: SPEEDOMETER & CUTTING CHAI NITRO GAUGE */}
        <div className="flex flex-col items-center gap-1">
          <div className="bg-zinc-950/90 border sm:border-2 border-amber-500/40 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xl flex items-center gap-2 sm:gap-4 pointer-events-auto">
            {/* Speed Dial Integer */}
            <div className="text-center">
              <div className="text-xl sm:text-4xl font-black font-mono text-amber-400 tabular-nums leading-none">
                {state.speedKmh}
              </div>
              <div className="text-[8px] sm:text-[10px] font-bold text-amber-300/80 uppercase tracking-widest mt-0.5">
                KM/H
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-[1px] h-6 sm:h-8 bg-zinc-800" />

            {/* Chai Boost Gauge */}
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-[60px] sm:min-w-[90px]">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-amber-200">
                <span className="flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400" /> Boost
                </span>
                <span className="font-mono tabular-nums">{Math.round(state.chaiBoost)}%</span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/60">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-100 rounded-full"
                  style={{ width: `${state.chaiBoost}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Vernacular Notification Toast Banner */}
          {state.message && (
            <div className="bg-zinc-950/95 border border-amber-500/40 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold text-amber-200 shadow-lg tracking-wide text-center pointer-events-none max-w-[220px] sm:max-w-md truncate">
              {state.message}
            </div>
          )}
        </div>

        {/* TOP-RIGHT: EARNINGS, CONDITION & QUICK ACTION BUTTONS */}
        <div className="bg-zinc-950/90 border sm:border-2 border-zinc-800 rounded-xl p-2 sm:p-3 shadow-2xl flex flex-col gap-1 sm:gap-2 min-w-[110px] sm:min-w-[160px] pointer-events-auto">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
              ₹ Earned
            </span>
            <span className="text-xs sm:text-base font-black font-mono text-emerald-400 tabular-nums">
              ₹ {state.totalEarnings}
            </span>
          </div>

          {/* Rickshaw Condition (Health) */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-zinc-400">
              <span className="flex items-center gap-0.5 sm:gap-1">
                <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500 fill-rose-500" /> Condition
              </span>
              <span className="font-mono font-bold text-zinc-200 tabular-nums">{state.condition}%</span>
            </div>
            <div className="w-full h-1 sm:h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  state.condition > 40 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${state.condition}%` }}
              />
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-end gap-1 pt-0.5 sm:pt-1 border-t border-zinc-800/80">
            <button
              onClick={() => engine?.toggleCamera()}
              className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Camera (C)"
            >
              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={onToggleMute}
              className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Audio Mute"
            >
              {isMuted ? <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" /> : <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={onTogglePause}
              className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Pause"
            >
              {state.isPaused ? <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" /> : <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. DEDICATED PHONE & TOUCH CONTROLS (FULL DUAL-THUMB) */}
      {/* ==================================================== */}
      <PhoneControls engine={engine} chaiBoost={state.chaiBoost} />

      {/* Pause Overlay Modal */}
      {state.isPaused && (
        <div className="absolute inset-0 z-40 bg-zinc-950/85 flex items-center justify-center pointer-events-auto p-4">
          <div className="bg-zinc-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-sm text-center shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 uppercase tracking-wider font-['Cinzel',sans-serif]">
              Game Paused
            </h2>
            <p className="text-xs text-zinc-300">
              Taking a cutting chai break? Tap Resume to continue driving.
            </p>
            <button
              onClick={onTogglePause}
              className="w-full py-3 rounded-xl bg-amber-500 active:bg-amber-400 text-zinc-950 font-black uppercase tracking-wider transition cursor-pointer"
            >
              Resume Drive
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
