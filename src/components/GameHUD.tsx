import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Camera,
  Zap,
  Heart,
  ClipboardList,
  Radio,
  Disc,
  Smartphone,
  PhoneCall,
  PhoneOff,
  Coffee,
  CloudRain,
  Eye,
  EyeOff,
  Map,
  Users,
  Trophy,
} from 'lucide-react';
import { GameState, GameEngine } from '../game/engine';
import { sounds } from '../game/audio';
import { PhoneControls } from './PhoneControls';
import { AnalogSpeedometer } from './AnalogSpeedometer';
import { IndiaMiniMap } from './IndiaMiniMap';
import { DriverProfile } from '../game/auth';

interface GameHUDProps {
  state: GameState;
  engine: GameEngine | null;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onOpenMissions: () => void;
  onOpenPhone: () => void;
  onOpenMap: () => void;
  onOpenMultiplayer: () => void;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
  driverProfile: DriverProfile | null;
  isMuted: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  engine,
  onTogglePause,
  onToggleMute,
  onOpenMissions,
  onOpenPhone,
  onOpenMap,
  onOpenMultiplayer,
  onOpenLeaderboard,
  onOpenAuth,
  driverProfile,
  isMuted,
}) => {
  const [hornType, setHornType] = useState<'airhorn' | 'bulb'>('airhorn');
  const [areButtonsHidden, setAreButtonsHidden] = useState(false);

  const handleTuneRadio = () => {
    engine?.nextRadioStation();
  };

  const handleToggleHornType = () => {
    const next = hornType === 'airhorn' ? 'bulb' : 'airhorn';
    setHornType(next);
    engine?.setStateMessage(`Horn switched to: ${next === 'airhorn' ? 'Brassy Pressure Horn' : 'Rubber Bulb Squeezer'}`);
    engine?.triggerHorn(next);
  };

  const handleToggleHideButtons = () => {
    setAreButtonsHidden((prev) => {
      const next = !prev;
      engine?.setStateMessage(
        next
          ? '👁️ Extra buttons hidden • Race, Brake, Left & Right buttons active!'
          : '👁️ All buttons restored!'
      );
      return next;
    });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'KeyB') {
        handleToggleHideButtons();
      }
      if (e.code === 'KeyM') {
        onOpenMap();
      }
      if (e.code === 'KeyN') {
        onOpenMultiplayer();
      }
      if (e.code === 'KeyL') {
        onOpenLeaderboard();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [engine, onOpenMap, onOpenMultiplayer, onOpenLeaderboard]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-2 sm:p-5 pointer-events-none select-none text-white font-sans overflow-hidden">
      {/* ==================================================== */}
      {/* 1. TOP PERIMETER STATUS CLUSTERS (<15% occlusion)    */}
      {/* ==================================================== */}
      <div className="flex items-start justify-between w-full max-w-7xl mx-auto gap-1.5 sm:gap-2">
        {/* TOP-LEFT: AUTHENTIC INDIAN DIGITAL FARE TAXI METER & BHARAT GPS MINI-MAP */}
        <div className="flex flex-col gap-1.5 items-start">
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

          {/* Real-time Bharat India Mini-Map GPS Widget */}
          <IndiaMiniMap
            distanceKm={state.distanceKm}
            onOpenFullMap={onOpenMap}
            areButtonsHidden={areButtonsHidden}
            drivers={state.multiplayer.drivers}
          />
        </div>

        {/* TOP-CENTER: SPEEDOMETER, TIME OF DAY, CASSETTE RADIO & 2-WHEEL STUNT */}
        <div className="flex flex-col items-center gap-1">
          {/* Cockpit Convex Rear-View Mirror Header */}
          {state.activeCameraMode === 'cockpit' && (
            <div className="bg-zinc-900/95 border-2 border-zinc-700 rounded-full px-3 py-1 flex items-center gap-2 shadow-2xl pointer-events-auto">
              <span className="text-[9px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" /> Rear-View
              </span>
              <div className="w-24 sm:w-36 h-2 bg-zinc-800 rounded-full relative overflow-hidden flex items-center justify-center">
                <div className="text-[7px] font-mono text-zinc-400">OBJECTS IN MIRROR ARE CLOSER</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Classic Rickshaw Speedometer & Chai Nitro Instrument Cluster */}
            <div className="bg-zinc-950/95 border sm:border-2 border-amber-500/50 rounded-2xl px-2.5 sm:px-3 py-1.5 shadow-[0_0_20px_rgba(0,0,0,0.85)] flex items-center gap-2 sm:gap-3 pointer-events-auto">
              {/* Classic Analog Gauge with Rotating Needle */}
              <AnalogSpeedometer
                speedKmh={state.speedKmh}
                isBoosting={Boolean(state.chaiBoost > 0 && engine?.inputs.boost)}
              />

              {/* Vertical Brass Accent Divider */}
              <div className="w-[1px] h-14 sm:h-16 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent" />

              {/* Digital Speed Dial + Chai Nitro Gauge */}
              <div className="flex flex-col gap-1 min-w-[65px] sm:min-w-[85px]">
                {/* Speed Dial Integer readout */}
                <div className="text-left leading-none">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 tabular-nums">
                      {state.speedKmh}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-amber-300/80 uppercase tracking-widest font-mono">
                      KM/H
                    </span>
                  </div>
                </div>

                {/* Chai Boost Gauge */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-bold text-amber-200">
                    <span className="flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> Boost
                    </span>
                    <span className="font-mono tabular-nums">{Math.round(state.chaiBoost)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/60 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-100 rounded-full"
                      style={{ width: `${state.chaiBoost}%` }}
                    />
                  </div>
                </div>

                {/* Grip / Road Condition Status */}
                <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-mono text-zinc-400 pt-0.5 border-t border-zinc-800/80">
                  <span className="text-zinc-500 uppercase">Grip:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      (state.handling?.gripPercent ?? 100) < 60 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {state.handling?.gripPercent ?? 100}%
                  </span>
                </div>
              </div>
            </div>

            {/* Auxiliary Buttons Bar - Hidden when areButtonsHidden is true */}
            {!areButtonsHidden && (
              <>
                {/* In-Dash Cassette Radio Tuner Button */}
                <button
                  onClick={handleTuneRadio}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-2xl transition cursor-pointer pointer-events-auto active:scale-95 ${
                    state.currentStation.id !== 'off'
                      ? 'bg-amber-950/90 border-amber-400/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-zinc-950/90 border-zinc-700 text-zinc-400'
                  }`}
                  title="Tune In-Dash Radio Station (Press R)"
                >
                  <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] sm:text-xs font-mono font-bold tabular-nums">
                        {state.currentStation.frequency}
                      </span>
                      {state.currentStation.id !== 'off' && (
                        <Disc className="w-2.5 h-2.5 text-amber-400 animate-spin" />
                      )}
                    </div>
                    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-amber-300/90 tracking-tight truncate max-w-[80px] sm:max-w-[110px]">
                      {state.currentStation.name.split(' ')[0]}
                    </span>
                  </div>
                </button>

                {/* Dynamic Time-of-Day Badge */}
                <button
                  onClick={() => engine?.cycleTimeOfDay()}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-2xl transition cursor-pointer pointer-events-auto active:scale-95 ${
                    state.isNight
                      ? 'bg-indigo-950/90 border-indigo-500/60 text-indigo-200'
                      : state.timePhase === 'sunset'
                      ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
                      : state.timePhase === 'sunrise'
                      ? 'bg-orange-950/90 border-orange-400/60 text-orange-200'
                      : 'bg-sky-950/90 border-sky-400/60 text-sky-200'
                  }`}
                  title="Tap to cycle time: Sunrise, Noon, Sunset, Night"
                >
                  <span className="text-sm sm:text-base leading-none">
                    {state.isNight ? '🌙' : state.timePhase === 'sunset' ? '🌇' : state.timePhase === 'sunrise' ? '🌅' : '☀️'}
                  </span>
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] sm:text-xs font-mono font-bold tabular-nums">
                      {state.timeString}
                    </span>
                    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-amber-300/90 tracking-tight">
                      {state.timePhase}
                    </span>
                  </div>
                </button>

                {/* Dynamic Weather System Badge & Toggle */}
                <button
                  onClick={() => engine?.cycleWeather()}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-2xl transition cursor-pointer pointer-events-auto active:scale-95 ${
                    state.weather?.type === 'monsoon'
                      ? 'bg-blue-950/90 border-blue-400/80 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : state.weather?.type === 'dusty_haze'
                      ? 'bg-amber-950/90 border-amber-500/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                  }`}
                  title={`Weather: ${state.weather?.label || 'Sunny'} (Tap to cycle weather, or press Q) - Traction Grip: ${Math.round((state.weather?.tractionMultiplier || 1.0) * 100)}%`}
                >
                  <span className="text-sm sm:text-base leading-none">
                    {state.weather?.icon || '☀️'}
                  </span>
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] sm:text-xs font-mono font-bold tabular-nums">
                      {state.weather?.type === 'monsoon' ? 'MONSOON' : state.weather?.type === 'dusty_haze' ? 'DUST LOO' : 'SUNNY'}
                    </span>
                    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-amber-300/90 tracking-tight">
                      {Math.round((state.weather?.tractionMultiplier || 1.0) * 100)}% GRIP
                    </span>
                  </div>
                </button>

                {/* Daily Goals Mission Button */}
                <button
                  onClick={onOpenMissions}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-2xl transition cursor-pointer pointer-events-auto active:scale-95 ${
                    state.unclaimedGoalsCount > 0
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : 'bg-zinc-950/90 border-amber-500/50 text-amber-300 hover:border-amber-400'
                  }`}
                  title="Open Daily Goals Mission Log"
                >
                  <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] sm:text-xs font-bold flex items-center gap-1">
                      Goals
                      {state.unclaimedGoalsCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold text-amber-300/90 tracking-tight">
                      {state.unclaimedGoalsCount > 0
                        ? `🎁 ${state.unclaimedGoalsCount} READY`
                        : `${state.goals.filter((g) => g.completed).length}/${state.goals.length || 3}`}
                    </span>
                  </div>
                </button>

                {/* In-Game OPPO F27 5G Smartphone Button */}
                <button
                  onClick={onOpenPhone}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-2xl transition cursor-pointer pointer-events-auto active:scale-95 ${
                    state.incomingCall
                      ? 'bg-amber-950/90 border-amber-400 text-amber-200 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                      : 'bg-zinc-950/90 border-cyan-500/50 hover:border-cyan-400 text-cyan-300'
                  }`}
                  title="Open OPPO F27 5G In-Game Phone (Press P) - 5G Internet, Wikipedia Search, Satellite Weather & AI Copilot!"
                >
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] sm:text-xs font-bold flex items-center gap-1 text-white">
                      OPPO 5G
                      {state.incomingCall ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold text-cyan-300/90 tracking-tight">
                      {state.incomingCall ? 'HALO RINGING' : '5G NET • [ P ]'}
                    </span>
                  </div>
                </button>

                {/* Bharat India GPS Map Button */}
                <button
                  onClick={onOpenMap}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-amber-500/50 bg-zinc-950/90 hover:border-amber-400 text-amber-300 shadow-2xl transition cursor-pointer pointer-events-auto active:scale-95"
                  title="Open Bharat Yatra GPS Route Map (Press M)"
                >
                  <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1">
                      Map
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-amber-300/90 tracking-tight">
                      [ M ]
                    </span>
                  </div>
                </button>

                {/* 5G Highway Multiplayer Fleet Button */}
                <button
                  onClick={onOpenMultiplayer}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-cyan-500/50 bg-zinc-950/90 hover:border-cyan-400 text-cyan-300 shadow-2xl transition cursor-pointer pointer-events-auto active:scale-95"
                  title="Open NH-48 5G Multiplayer Fleet Lobby, Yaar Friends Network, Live Radio Chat & Custom Paint (Press N)"
                >
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1">
                      Fleet & Yaar
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-cyan-300/90 tracking-tight">
                      {state.multiplayer.onlineCount > 1 ? `${state.multiplayer.onlineCount} 5G` : '1 5G'} • [ N ]
                    </span>
                  </div>
                </button>

                {/* All-India Maha Ustaad Leaderboard Button */}
                <button
                  onClick={onOpenLeaderboard}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-amber-500/50 bg-zinc-950/90 hover:border-amber-400 text-amber-300 shadow-2xl transition cursor-pointer pointer-events-auto active:scale-95"
                  title="Open All-India Maha Ustaad Leaderboard & Highway Rankings (Press L)"
                >
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1">
                      Ranks
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-amber-300/90 tracking-tight">
                      [ L ]
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Incoming Call Floating Ringing Banner (OPPO F27 5G Halo Light) */}
          {state.incomingCall && (
            <div className="bg-gradient-to-r from-amber-950 via-zinc-950 to-amber-950 border-2 border-amber-400 rounded-2xl p-2 sm:p-2.5 shadow-[0_0_30px_rgba(245,158,11,0.8)] flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto animate-bounce max-w-sm w-full mx-auto my-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-9 h-9 rounded-full bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center text-xl shrink-0 animate-pulse shadow-md shadow-amber-500/50">
                  {state.incomingCall.avatar}
                </div>
                <div className="truncate text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate">{state.incomingCall.name}</span>
                    <span className="text-[8px] px-1 rounded-full bg-amber-500/30 text-amber-300 font-semibold uppercase">
                      OPPO 5G Call
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-300 truncate">{state.incomingCall.relation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onOpenPhone}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer transition border border-emerald-300/40"
                  title="Answer Incoming Call on OPPO F27 5G (Press P)"
                >
                  <PhoneCall className="w-3.5 h-3.5 fill-current" />
                  <span>Answer</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playPhoneClick();
                    engine?.dismissIncomingCall();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/60 active:scale-95 cursor-pointer transition border border-rose-400/40 group"
                  title="Cut Call (Reject incoming call)"
                >
                  <PhoneOff className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Cut Call</span>
                </button>
              </div>
            </div>
          )}

          {/* Roadside Chai Break Prompt Banner */}
          {state.isNearChaiStall && !state.isChaiBreakActive && (
            <button
              onClick={() => engine?.startChaiBreak()}
              className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-2 border-yellow-300 rounded-2xl px-3.5 py-1.5 sm:py-2 shadow-[0_0_30px_rgba(245,158,11,0.9)] flex items-center gap-2 pointer-events-auto animate-bounce cursor-pointer active:scale-95 my-1"
              title="Pull Over at Roadside Stall for Cutting Chai Break (Press E)"
            >
              <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 fill-zinc-950" />
              <div className="text-left leading-tight">
                <div className="text-xs sm:text-sm font-black text-zinc-950 uppercase tracking-wide">
                  ☕ PULL OVER FOR CHAI BREAK! [E]
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-zinc-900">
                  Munna Tapri • Refuel 100% Stamina & Cool Engine
                </div>
              </div>
            </button>
          )}

          {/* Active Speed Buff / Nitro Overclock Banner */}
          {state.speedBuff && state.speedBuff.remainingSeconds > 0 && (
            <div className="bg-gradient-to-r from-amber-500/90 via-yellow-400 to-amber-500 text-zinc-950 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse pointer-events-auto">
              <Zap className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span>⚡ {state.speedBuff.label.toUpperCase()}</span>
              <span className="bg-zinc-950 text-amber-300 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black">
                +{state.speedBuff.speedBonusKmh} KM/H • {Math.ceil(state.speedBuff.remainingSeconds)}s
              </span>
            </div>
          )}

          {/* 2-Wheel Stunt Thrill Badge */}
          {state.isTwoWheelStunt && (
            <div className="bg-amber-500 text-zinc-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider animate-bounce shadow-lg">
              ⚡ 2-WHEEL TILT STUNT!
            </div>
          )}

          {/* Dynamic Vernacular Notification Toast Banner */}
          {state.message && (
            <div className="bg-zinc-950/95 border border-amber-500/40 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold text-amber-200 shadow-lg tracking-wide text-center pointer-events-none max-w-[240px] sm:max-w-md truncate">
              {state.message}
            </div>
          )}

          {/* Live Multiplayer Highway Radio Chat Toast */}
          {state.multiplayer.lastChatToast && (
            <div
              onClick={onOpenMultiplayer}
              className="bg-zinc-950/95 border border-cyan-400/80 hover:border-cyan-300 rounded-2xl px-3 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 pointer-events-auto cursor-pointer animate-in fade-in slide-in-from-top-1 max-w-xs sm:max-w-md my-0.5"
              title="Click to Open Fleet Radio Chat [N]"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 flex items-center justify-center text-xs shrink-0">
                📻
              </div>
              <div className="truncate text-left leading-tight">
                <span className="text-[10px] font-bold text-cyan-300 truncate block">
                  🛺 {state.multiplayer.lastChatToast.name}:
                </span>
                <span className="text-[11px] text-white font-medium truncate block">
                  "{state.multiplayer.lastChatToast.text}"
                </span>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold shrink-0 ml-auto border border-cyan-500/30">
                [N]
              </span>
            </div>
          )}
        </div>

        {/* TOP-RIGHT: EARNINGS, CONDITION & QUICK ACTION BUTTONS */}
        <div className="bg-zinc-950/90 border sm:border-2 border-zinc-800 rounded-xl p-2 sm:p-3 shadow-2xl flex flex-col gap-1 sm:gap-2 min-w-[110px] sm:min-w-[160px] pointer-events-auto">
          {/* Driver Permit Badge */}
          <div
            onClick={onOpenAuth}
            className="flex items-center justify-between gap-1 pb-1 sm:pb-1.5 border-b border-zinc-800 cursor-pointer group hover:opacity-90 transition active:scale-98"
            title="Driver Profile & License - Click to view, upgrade, or switch accounts"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs sm:text-sm">{driverProfile?.avatarIcon || '🛺'}</span>
              <div className="truncate text-left leading-tight">
                <div className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1">
                  {driverProfile?.isGuest ? 'Guest' : '⭐ Verified'}
                </div>
                <div className="text-[10px] sm:text-xs font-black text-amber-300 truncate max-w-[80px] sm:max-w-[115px]">
                  {driverProfile?.name || 'Guest Driver'}
                </div>
              </div>
            </div>
            <span className="text-[8px] bg-zinc-800 group-hover:bg-amber-500/30 text-amber-300 px-1 py-0.5 rounded font-mono font-bold shrink-0">
              {driverProfile?.isGuest ? 'Save' : 'ID'}
            </span>
          </div>

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
            {/* Dedicated Hide / Show Buttons Toggle */}
            <button
              onClick={handleToggleHideButtons}
              className={`p-1 sm:p-1.5 rounded-lg transition cursor-pointer ${
                areButtonsHidden
                  ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
                  : 'bg-zinc-800 active:bg-zinc-700 text-amber-300 hover:text-white'
              }`}
              title={
                areButtonsHidden
                  ? 'Show All Buttons [B]'
                  : 'Hide Extra Buttons (Keeps Race, Brake, Left & Right buttons) [B]'
              }
            >
              {areButtonsHidden ? (
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              ) : (
                <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </button>

            {!areButtonsHidden && (
              <>
                <button
                  onClick={() => engine?.startChaiBreak()}
                  className={`p-1 sm:p-1.5 rounded-lg transition cursor-pointer ${
                    state.isNearChaiStall
                      ? 'bg-amber-500 text-zinc-950 border border-amber-300 animate-pulse'
                      : 'bg-zinc-800 active:bg-zinc-700 text-amber-300 hover:text-white'
                  }`}
                  title="Chai Break (E) - Refuel Stamina at roadside stall"
                >
                  <Coffee className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={handleToggleHornType}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-amber-300 hover:text-white transition cursor-pointer"
                  title={`Switch Horn (Current: ${hornType === 'airhorn' ? 'Air Horn' : 'Bulb Horn'})`}
                >
                  <span className="text-[10px] font-bold">
                    {hornType === 'airhorn' ? '🎺' : '🔴'}
                  </span>
                </button>
                <button
                  onClick={handleTuneRadio}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-amber-300 hover:text-white transition cursor-pointer"
                  title="Next Radio Station (R)"
                >
                  <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={() => engine?.toggleCamera()}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Camera Mode (C) - Chase / Cockpit"
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
                  onClick={onOpenMap}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-amber-300 hover:text-white transition cursor-pointer"
                  title="Open Bharat Yatra GPS Route Map (M)"
                >
                  <Map className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                </button>
                <button
                  onClick={onOpenMultiplayer}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-cyan-300 hover:text-white transition cursor-pointer relative"
                  title="Open NH-48 5G Multiplayer Fleet & Radio (N)"
                >
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                  {state.multiplayer.onlineCount > 1 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse absolute top-0.5 right-0.5" />
                  )}
                </button>
              </>
            )}

            <button
              onClick={onTogglePause}
              className="p-1 sm:p-1.5 rounded-lg bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Pause Game"
            >
              {state.isPaused ? <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" /> : <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. DEDICATED PHONE & TOUCH CONTROLS (FULL DUAL-THUMB) */}
      {/* ==================================================== */}
      <PhoneControls
        engine={engine}
        chaiBoost={state.chaiBoost}
        areButtonsHidden={areButtonsHidden}
        onToggleHideButtons={handleToggleHideButtons}
      />

      {/* Pause Overlay Modal */}
      {state.isPaused && (
        <div className="absolute inset-0 z-40 bg-zinc-950/85 flex items-center justify-center pointer-events-auto p-4">
          <div className="bg-zinc-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-sm text-center shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 uppercase tracking-wider font-['Cinzel',sans-serif]">
              Game Paused
            </h2>
            <p className="text-xs text-zinc-300">
              Taking a cutting chai break? Tap Resume to continue driving across Bharat.
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
