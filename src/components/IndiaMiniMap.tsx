import React from 'react';
import { MapPin, Navigation, Compass, ChevronRight } from 'lucide-react';
import { getPlayerMapLocation } from '../game/indiaRoute';

interface IndiaMiniMapProps {
  distanceKm: number;
  onOpenFullMap: () => void;
  areButtonsHidden?: boolean;
}

export const IndiaMiniMap: React.FC<IndiaMiniMapProps> = ({
  distanceKm,
  onOpenFullMap,
  areButtonsHidden = false,
}) => {
  const location = getPlayerMapLocation(distanceKm);

  // Simplified vector contour for India Mini-Map
  const miniIndiaPath = `
    M 50,12 
    C 55,15 62,20 62,28 
    C 60,35 68,44 76,48 
    C 84,52 92,48 95,58 
    C 92,68 85,78 78,98 
    C 72,114 62,130 55,142 
    C 52,148 48,142 45,130 
    C 40,115 36,98 32,88 
    C 24,78 20,72 24,64 
    C 28,54 36,44 42,32 
    C 45,22 46,15 50,12 Z
  `;

  // Scale coordinates from 400x500 to 100x160 mini canvas
  const miniX = 18 + (location.x / 400) * 68;
  const miniY = 10 + (location.y / 500) * 135;

  return (
    <button
      onClick={onOpenFullMap}
      className={`group bg-zinc-950/90 border border-amber-500/40 hover:border-amber-400 rounded-2xl p-1.5 sm:p-2 shadow-2xl transition-all cursor-pointer pointer-events-auto flex items-center gap-2 active:scale-95 text-left ${
        areButtonsHidden ? 'opacity-80 hover:opacity-100 max-w-[140px] sm:max-w-[170px]' : 'max-w-[170px] sm:max-w-[210px]'
      }`}
      title="Open Full India GPS Journey Map [M]"
    >
      {/* Mini SVG Radar Map */}
      <div className="relative w-9 h-12 sm:w-11 sm:h-14 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
        <svg viewBox="10 5 90 150" className="w-full h-full p-0.5">
          {/* India Mini Landmass */}
          <path
            d={miniIndiaPath}
            fill="#27272a"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Golden Highway Guide Line */}
          <line
            x1="48"
            y1="48"
            x2="52"
            y2="140"
            stroke="#eab308"
            strokeWidth="1.4"
            strokeDasharray="2 2"
            opacity="0.6"
          />

          {/* Glowing Auto-Rickshaw GPS Blip */}
          <circle cx={miniX} cy={miniY} r="5" fill="#f59e0b" className="animate-ping opacity-75" />
          <circle cx={miniX} cy={miniY} r="2.8" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
        </svg>

        {/* Live GPS badge indicator */}
        <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {/* Location Telemetry Info */}
      <div className="flex flex-col min-w-0 pr-0.5 leading-tight">
        <div className="flex items-center gap-1">
          <span className="text-[8px] sm:text-[9px] font-bold text-amber-400 uppercase tracking-wider truncate flex items-center gap-0.5">
            <Compass className="w-2.5 h-2.5 text-amber-400 animate-spin shrink-0" style={{ animationDuration: '8s' }} />
            <span>Bharat GPS</span>
          </span>
          <span className="text-[7px] text-zinc-500 font-mono">[ M ]</span>
        </div>

        <div className="text-[10px] sm:text-xs font-black text-white truncate mt-0.5 group-hover:text-amber-300 transition">
          {location.currentStop.name.split(' ')[0]}
        </div>

        <div className="text-[8px] sm:text-[9px] text-zinc-400 font-mono truncate">
          ➔ {location.nextStop.name.split(' ')[0]} ({location.remainingKmToNext.toFixed(1)}k)
        </div>
      </div>

      <ChevronRight className="w-3 h-3 text-amber-400/60 group-hover:text-amber-300 group-hover:translate-x-0.5 transition shrink-0 ml-auto" />
    </button>
  );
};
