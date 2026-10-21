import React, { useState } from 'react';
import {
  X,
  Compass,
  MapPin,
  Flag,
  Coffee,
  Navigation,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Route,
} from 'lucide-react';
import { INDIA_STOPS, getPlayerMapLocation, IndiaStop } from '../game/indiaRoute';

interface IndiaMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  distanceKm: number;
  totalEarnings: number;
  passengersServed: number;
  chaiCount: number;
}

export const IndiaMapModal: React.FC<IndiaMapModalProps> = ({
  isOpen,
  onClose,
  distanceKm,
  totalEarnings,
  passengersServed,
  chaiCount,
}) => {
  const [selectedStop, setSelectedStop] = useState<IndiaStop | null>(null);
  const location = getPlayerMapLocation(distanceKm);

  if (!isOpen) return null;

  // Traced path SVG coordinates string for the highway
  const highwayPoints = INDIA_STOPS.map((s) => `${s.x},${s.y}`).join(' ');

  // SVG Outline for Republic of India
  const indiaOutlinePath = `
    M 155,38 
    C 165,45 178,50 185,62 
    C 192,72 188,88 180,98 
    C 174,106 182,118 190,132 
    C 200,146 220,165 242,175 
    C 260,182 278,185 285,188 
    C 292,178 300,175 306,184 
    C 310,190 322,175 340,165 
    C 360,155 378,172 372,190 
    C 368,205 355,225 352,245 
    C 346,252 334,242 332,230 
    C 328,218 318,222 312,235 
    C 305,248 302,260 295,268 
    C 285,280 270,305 255,325 
    C 240,345 228,375 222,405 
    C 216,425 200,450 185,465 
    C 175,475 168,485 165,488 
    C 160,485 152,472 148,458 
    C 142,440 135,415 128,390 
    C 120,365 110,340 106,318 
    C 102,298 90,285 75,275 
    C 62,265 64,250 72,238 
    C 80,228 68,220 74,208 
    C 82,192 95,168 110,148 
    C 125,128 135,105 142,85 
    C 148,68 145,50 155,38 Z
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/85 backdrop-blur-md select-none text-white font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-amber-500/60 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden">
        {/* ========================================================= */}
        {/* TOP HEADER: BHARAT YATRA EXPEDITION GPS TRACKER          */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-700 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-amber-500/30 border border-yellow-200">
              🧭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-amber-300 font-['Cinzel',sans-serif]">
                  Bharat Yatra GPS
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  ● LIVE SATELLITE
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400">
                Trans-India Highway Rickshaw Expedition • Lap {location.expeditionLap}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end text-right mr-2">
              <span className="text-[10px] text-zinc-400 uppercase font-mono">Distance Covered</span>
              <span className="text-sm font-black text-amber-400 font-mono tabular-nums">
                {distanceKm.toFixed(2)} km
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white transition cursor-pointer border border-zinc-700"
              title="Close Map (Esc or M)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* EXPEDITION ROUTE MILESTONE PROGRESS BAR                   */}
        {/* ========================================================= */}
        <div className="bg-zinc-950/90 px-4 py-2 border-b border-zinc-800/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-200">
              <Navigation className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Current Sector:</span>
              <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded">
                {location.currentStop.name} ➔ {location.nextStop.name}
              </span>
            </div>
            <div className="font-mono text-zinc-400">
              <span className="text-amber-400 font-bold">{location.remainingKmToNext.toFixed(1)} km</span> to{' '}
              {location.nextStop.name.split(' ')[0]}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-zinc-800/90 rounded-full overflow-hidden border border-zinc-700/60 relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-300 transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${location.totalProgressPercent}%` }}
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: INTERACTIVE MAP & DETAILS PANEL                */}
        {/* ========================================================= */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto">
          {/* LEFT/CENTER: MAP CANVAS (7 COLS ON MD) */}
          <div className="md:col-span-7 bg-zinc-950 relative flex items-center justify-center p-2 sm:p-4 min-h-[340px] sm:min-h-[440px] border-b md:border-b-0 md:border-r border-zinc-800">
            {/* Watermark / Compass Rose */}
            <div className="absolute top-3 left-4 text-left pointer-events-none opacity-60">
              <div className="text-[10px] font-mono font-bold tracking-widest text-amber-500/80 uppercase">
                BHARAT ROAD ATLAS
              </div>
              <div className="text-[8px] font-mono text-zinc-500">SCALE: 1:2,500,000 • NH-44 / NH-48</div>
            </div>

            <div className="absolute bottom-3 left-4 pointer-events-none flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE GPS SIGNAL: 100% (IRNSS NavIC)</span>
            </div>

            {/* SVG Interactive Map of India */}
            <svg
              viewBox="40 25 340 480"
              className="w-full max-h-[500px] h-full object-contain filter drop-shadow-2xl overflow-visible"
            >
              <defs>
                {/* Landmass Shading Gradient */}
                <linearGradient id="indiaLand" x1="0%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="45%" stopColor="#1c1917" />
                  <stop offset="85%" stopColor="#292524" />
                  <stop offset="100%" stopColor="#18181b" />
                </linearGradient>

                {/* Radar Ripple Effect */}
                <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* 1. Surrounding Ocean Watermark Grids */}
              <circle cx="200" cy="250" r="190" fill="none" stroke="#27272a" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.4" />
              <text x="75" y="380" fill="#3f3f46" fontSize="10" fontWeight="bold" letterSpacing="2" opacity="0.6">
                ARABIAN SEA
              </text>
              <text x="260" y="380" fill="#3f3f46" fontSize="10" fontWeight="bold" letterSpacing="2" opacity="0.6">
                BAY OF BENGAL
              </text>
              <text x="140" y="500" fill="#3f3f46" fontSize="9" fontWeight="bold" letterSpacing="1.5" opacity="0.6">
                INDIAN OCEAN
              </text>

              {/* 2. Republic of India Landmass Outline */}
              <path
                d={indiaOutlinePath}
                fill="url(#indiaLand)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeOpacity="0.6"
                className="transition duration-300"
              />

              {/* 3. Island Territories */}
              {/* Lakshadweep */}
              <circle cx="100" cy="440" r="2.5" fill="#f59e0b" opacity="0.7" />
              <circle cx="98" cy="450" r="2" fill="#f59e0b" opacity="0.7" />
              {/* Andaman & Nicobar */}
              <circle cx="340" cy="380" r="3" fill="#f59e0b" opacity="0.7" />
              <circle cx="343" cy="395" r="2.5" fill="#f59e0b" opacity="0.7" />
              <circle cx="346" cy="420" r="3.5" fill="#f59e0b" opacity="0.7" />

              {/* 4. Complete National Highway Route Line (Golden Quadrilateral & NH-44) */}
              <polyline
                points={highwayPoints}
                fill="none"
                stroke="#52525b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
                opacity="0.7"
              />

              {/* 5. Traced Path Completed So Far */}
              {INDIA_STOPS.map((stop, i) => {
                if (i === 0) return null;
                const prevStop = INDIA_STOPS[i - 1];
                const isPassed = (distanceKm % 75) >= stop.km;
                const isCurrentLeg = (distanceKm % 75) >= prevStop.km && (distanceKm % 75) <= stop.km;

                if (!isPassed && !isCurrentLeg) return null;

                const endX = isCurrentLeg ? location.x : stop.x;
                const endY = isCurrentLeg ? location.y : stop.y;

                return (
                  <line
                    key={`line-${stop.id}`}
                    x1={prevStop.x}
                    y1={prevStop.y}
                    x2={endX}
                    y2={endY}
                    stroke="#10b981"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  />
                );
              })}

              {/* 6. City Milestone Stop Markers */}
              {INDIA_STOPS.map((stop, idx) => {
                const isPassed = (distanceKm % 75) >= stop.km;
                const isCurrent = location.currentStop.id === stop.id;
                const isNext = location.nextStop.id === stop.id;
                const isSelected = selectedStop?.id === stop.id;

                return (
                  <g
                    key={stop.id}
                    onClick={() => setSelectedStop(stop)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {/* Ripple ring for current/next destination */}
                    {(isCurrent || isNext) && (
                      <circle
                        cx={stop.x}
                        cy={stop.y}
                        r="9"
                        fill="none"
                        stroke={isCurrent ? '#f59e0b' : '#38bdf8'}
                        strokeWidth="1.2"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer Node Circle */}
                    <circle
                      cx={stop.x}
                      cy={stop.y}
                      r={isSelected ? 6.5 : isCurrent ? 5.5 : 4}
                      fill={
                        isPassed
                          ? '#10b981'
                          : isCurrent
                          ? '#f59e0b'
                          : isNext
                          ? '#38bdf8'
                          : '#3f3f46'
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2 : 1}
                      className="drop-shadow-md"
                    />

                    {/* City Name Label */}
                    <text
                      x={stop.x + 8}
                      y={stop.y + 3}
                      fill={isCurrent ? '#fbbf24' : isPassed ? '#34d399' : '#a1a1aa'}
                      fontSize={isCurrent || isSelected ? '7.5' : '6.2'}
                      fontWeight={isCurrent || isSelected ? '900' : '600'}
                      fontFamily="sans-serif"
                      className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                    >
                      {stop.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* 7. Live Player Auto-Rickshaw Marker */}
              <g
                transform={`translate(${location.x}, ${location.y})`}
                className="transition-all duration-150 ease-out"
              >
                {/* Radar Beacon Pulses */}
                <circle cx="0" cy="0" r="14" fill="url(#radarPulse)" className="animate-ping" />
                <circle cx="0" cy="0" r="7" fill="#fbbf24" opacity="0.4" />

                {/* Auto-Rickshaw Icon Badge */}
                <circle cx="0" cy="0" r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7"
                  className="pointer-events-none"
                >
                  🛺
                </text>
              </g>
            </svg>
          </div>

          {/* RIGHT PANEL: CITY DETAILS, STATS & EXPEDITION LOG (5 COLS ON MD) */}
          <div className="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-4 bg-zinc-900/60">
            {/* Active City Card */}
            {selectedStop ? (
              <div className="bg-zinc-950/90 border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-400 font-mono tracking-wider">
                      {selectedStop.state} • {selectedStop.highwayCode}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                      <span>{selectedStop.icon}</span> {selectedStop.name}
                    </h3>
                    <p className="text-xs text-amber-300/90 font-medium">{selectedStop.hindiName}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStop(null)}
                    className="text-zinc-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{selectedStop.landmark}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-200">
                    <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{selectedStop.foodOrHighlight}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800 font-mono">
                  <span className="text-zinc-400">Milestone:</span>
                  <span className="text-amber-400 font-bold">{selectedStop.km.toFixed(1)} KM</span>
                </div>
              </div>
            ) : (
              /* Current Location Live Status Box */
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Current Location
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {location.progressPercent}% of current leg
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>{location.currentStop.icon}</span> {location.currentStop.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{location.currentStop.landmark}</p>
                </div>

                {/* Next Target Banner */}
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{location.nextStop.icon}</span>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-amber-400">Next Destination</div>
                      <div className="text-xs font-bold text-white">{location.nextStop.name}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-black text-amber-300">
                      {location.remainingKmToNext.toFixed(1)} km
                    </div>
                    <div className="text-[8px] text-zinc-400 uppercase">Remaining</div>
                  </div>
                </div>
              </div>
            )}

            {/* Expedition Lifetime Statistics */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Driver Odyssey Stats
              </span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400">Total Fares</div>
                  <div className="text-base font-black text-emerald-400 font-mono">₹{totalEarnings}</div>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400">Passengers</div>
                  <div className="text-base font-black text-amber-300 font-mono">{passengersServed} riders</div>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400">Cutting Chais</div>
                  <div className="text-base font-black text-yellow-400 font-mono">{chaiCount} cups ☕</div>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400">Cities Passed</div>
                  <div className="text-base font-black text-sky-400 font-mono">
                    {location.stopsCompletedCount} / {INDIA_STOPS.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Expedition Goal & CTA */}
            <div className="flex flex-col gap-2">
              <div className="text-[10px] text-zinc-400 text-center font-mono">
                🇮🇳 Tap any city milestone on the map to explore its famous dhaba specials & heritage.
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
              >
                Back to Highway Driving
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
