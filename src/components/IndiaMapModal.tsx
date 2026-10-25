import React, { useState, useEffect, useMemo } from 'react';
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
  Route as RouteIcon,
  Layers,
  LocateFixed,
  Maximize2,
  Tv,
} from 'lucide-react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { INDIA_STOPS, getPlayerMapLocation, IndiaStop } from '../game/indiaRoute';

interface IndiaMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  distanceKm: number;
  totalEarnings: number;
  passengersServed: number;
  chaiCount: number;
  drivers?: Array<{
    id: string;
    name: string;
    color: string;
    speedKmh: number;
    distanceKm: number;
  }>;
}

// Google Maps API Key from environment or provisioned Demo Key
const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC6Ww9b1t_aQf1FK_oFS0_tEIi6c6SWgT8';

/**
 * Declarative Polyline renderer for Google Maps routes
 */
function RoutePolyline({
  path,
  strokeColor = '#f59e0b',
  strokeWeight = 4,
  strokeOpacity = 0.8,
}: {
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps || !google.maps.Polyline) return;

    const line = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      map,
    });

    return () => {
      line.setMap(null);
    };
  }, [map, path, strokeColor, strokeWeight, strokeOpacity]);

  return null;
}

/**
 * Controller hook to fit bounds or pan camera dynamically
 */
function MapCameraController({
  targetCenter,
  targetZoom,
  fitRouteBounds,
  boundsPoints,
}: {
  targetCenter: google.maps.LatLngLiteral | null;
  targetZoom: number | null;
  fitRouteBounds: boolean;
  boundsPoints: google.maps.LatLngLiteral[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    if (fitRouteBounds && boundsPoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      boundsPoints.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    } else if (targetCenter) {
      map.panTo(targetCenter);
      if (targetZoom) {
        map.setZoom(targetZoom);
      }
    }
  }, [map, targetCenter, targetZoom, fitRouteBounds, boundsPoints]);

  return null;
}

export const IndiaMapModal: React.FC<IndiaMapModalProps> = ({
  isOpen,
  onClose,
  distanceKm,
  totalEarnings,
  passengersServed,
  chaiCount,
  drivers = [],
}) => {
  const [selectedStop, setSelectedStop] = useState<IndiaStop | null>(null);
  const [activeView, setActiveView] = useState<'google' | 'retro'>('google');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [cameraTarget, setCameraTarget] = useState<google.maps.LatLngLiteral | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number | null>(null);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(false);
  const [autoFollowPlayer, setAutoFollowPlayer] = useState(true);

  const location = getPlayerMapLocation(distanceKm);

  // Highway full lat/lng coordinates
  const fullHighwayLatLngList: google.maps.LatLngLiteral[] = useMemo(
    () => INDIA_STOPS.map((s) => ({ lat: s.lat, lng: s.lng })),
    []
  );

  // Highway completed leg coordinates up to player
  const completedHighwayLatLngList: google.maps.LatLngLiteral[] = useMemo(() => {
    const pts: google.maps.LatLngLiteral[] = [];
    const maxDistance = INDIA_STOPS[INDIA_STOPS.length - 1].km;
    const loopDistance = distanceKm % maxDistance;

    for (let i = 0; i < INDIA_STOPS.length; i++) {
      const s = INDIA_STOPS[i];
      if (s.km <= loopDistance) {
        pts.push({ lat: s.lat, lng: s.lng });
      } else {
        break;
      }
    }
    pts.push({ lat: location.lat, lng: location.lng });
    return pts;
  }, [distanceKm, location.lat, location.lng]);

  // Keep camera on player if auto-follow is active
  useEffect(() => {
    if (autoFollowPlayer && isOpen) {
      setCameraTarget({ lat: location.lat, lng: location.lng });
      setCameraZoom(9);
      setFitBoundsTrigger(false);
    }
  }, [autoFollowPlayer, location.lat, location.lng, isOpen]);

  if (!isOpen) return null;

  // Traced path SVG coordinates string for the highway retro view
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
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[820px] bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-amber-500/60 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden">
        {/* ========================================================= */}
        {/* TOP HEADER: BHARAT YATRA EXPEDITION GPS TRACKER          */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800 bg-zinc-950/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-700 flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-amber-500/30 border border-yellow-200">
              🧭
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-black uppercase tracking-wider text-amber-300 font-['Cinzel',sans-serif]">
                  Bharat Yatra GPS
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE GOOGLE MAPS
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400">
                Trans-India Highway Odyssey • NH-44 / NH-48 Corridor • Lap {location.expeditionLap}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-zinc-900 p-0.5 sm:p-1 rounded-xl border border-zinc-800 text-[10px] sm:text-xs">
              <button
                onClick={() => setActiveView('google')}
                className={`px-2 sm:px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'google'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🛰️</span>
                <span className="hidden xs:inline">Google Maps</span>
              </button>
              <button
                onClick={() => setActiveView('retro')}
                className={`px-2 sm:px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'retro'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🗺️</span>
                <span className="hidden xs:inline">Atlas Radar</span>
              </button>
            </div>

            <div className="hidden md:flex flex-col items-end text-right mr-1">
              <span className="text-[9px] text-zinc-400 uppercase font-mono">Distance Covered</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono tabular-nums">
                {distanceKm.toFixed(2)} km
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white transition cursor-pointer border border-zinc-700"
              title="Close Map (Esc or M)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* EXPEDITION ROUTE MILESTONE PROGRESS BAR                   */}
        {/* ========================================================= */}
        <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800/80 flex flex-col gap-1.5 shrink-0">
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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden min-h-0">
          {/* LEFT/CENTER: MAP CANVAS (7 COLS ON MD) */}
          <div className="md:col-span-7 bg-zinc-950 relative flex flex-col items-center justify-center min-h-[300px] border-b md:border-b-0 md:border-r border-zinc-800 overflow-hidden">
            {activeView === 'google' ? (
              /* REAL GOOGLE MAPS IMPLEMENTATION */
              <div className="relative w-full h-full min-h-[300px]">
                {/* Floating Map Navigation Action Buttons */}
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setAutoFollowPlayer(true);
                      setCameraTarget({ lat: location.lat, lng: location.lng });
                      setCameraZoom(10);
                      setFitBoundsTrigger(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold border backdrop-blur-md transition flex items-center gap-1.5 shadow-lg cursor-pointer ${
                      autoFollowPlayer
                        ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-amber-500/20'
                        : 'bg-zinc-900/90 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>Track My Rickshaw</span>
                  </button>

                  <button
                    onClick={() => {
                      setAutoFollowPlayer(false);
                      setFitBoundsTrigger(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-zinc-900/90 text-zinc-200 border border-zinc-700 hover:bg-zinc-800 backdrop-blur-md transition flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Fit All India</span>
                  </button>

                  {/* Map Type Switcher */}
                  <button
                    onClick={() =>
                      setMapType((prev) =>
                        prev === 'roadmap' ? 'hybrid' : prev === 'hybrid' ? 'terrain' : 'roadmap'
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-zinc-900/90 text-zinc-200 border border-zinc-700 hover:bg-zinc-800 backdrop-blur-md transition flex items-center gap-1.5 shadow-lg cursor-pointer capitalize"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{mapType}</span>
                  </button>
                </div>

                {/* Live GPS Coordinates Watermark */}
                <div className="absolute bottom-2 left-3 z-10 pointer-events-none bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800 text-[9px] font-mono text-zinc-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    GPS: {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
                  </span>
                </div>

                {/* Google Maps Container */}
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry']}>
                  <div className="w-full h-full">
                    <Map
                      id="bharat-yatra-map"
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      defaultCenter={{ lat: location.lat, lng: location.lng }}
                      defaultZoom={8}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      mapTypeId={mapType}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <MapCameraController
                        targetCenter={cameraTarget}
                        targetZoom={cameraZoom}
                        fitRouteBounds={fitBoundsTrigger}
                        boundsPoints={fullHighwayLatLngList}
                      />

                      {/* Trans-India Highway Polyline (Full Corridor) */}
                      <RoutePolyline
                        path={fullHighwayLatLngList}
                        strokeColor="#3f3f46"
                        strokeWeight={4}
                        strokeOpacity={0.7}
                      />

                      {/* Completed Leg Polyline (Traveled Route) */}
                      <RoutePolyline
                        path={completedHighwayLatLngList}
                        strokeColor="#10b981"
                        strokeWeight={5}
                        strokeOpacity={0.9}
                      />

                      {/* Milestone City Markers with AdvancedMarker */}
                      {INDIA_STOPS.map((stop) => {
                        const isPassed = (distanceKm % 75) >= stop.km;
                        const isCurrent = location.currentStop.id === stop.id;
                        const isNext = location.nextStop.id === stop.id;
                        const isSelected = selectedStop?.id === stop.id;

                        return (
                          <AdvancedMarker
                            key={stop.id}
                            position={{ lat: stop.lat, lng: stop.lng }}
                            title={`${stop.name} (${stop.highwayCode})`}
                            onClick={() => {
                              setSelectedStop(stop);
                              setAutoFollowPlayer(false);
                              setCameraTarget({ lat: stop.lat, lng: stop.lng });
                              setCameraZoom(11);
                              setFitBoundsTrigger(false);
                            }}
                          >
                            <div className="relative flex flex-col items-center cursor-pointer group transition-transform hover:scale-110">
                              <Pin
                                background={
                                  isSelected
                                    ? '#f59e0b'
                                    : isCurrent
                                    ? '#d97706'
                                    : isPassed
                                    ? '#10b981'
                                    : isNext
                                    ? '#0284c7'
                                    : '#475569'
                                }
                                borderColor="#ffffff"
                                glyphColor="#ffffff"
                                scale={isSelected || isCurrent ? 1.25 : 1.0}
                              >
                                <span className="text-xs">{stop.icon}</span>
                              </Pin>
                              <div
                                className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold font-sans whitespace-nowrap shadow-md pointer-events-none ${
                                  isSelected || isCurrent
                                    ? 'bg-amber-500 text-zinc-950'
                                    : 'bg-zinc-900/90 text-zinc-200 border border-zinc-700'
                                }`}
                              >
                                {stop.name.split(' ')[0]}
                              </div>
                            </div>
                          </AdvancedMarker>
                        );
                      })}

                      {/* Live Player Auto-Rickshaw Advanced Marker */}
                      <AdvancedMarker
                        position={{ lat: location.lat, lng: location.lng }}
                        title="Your Auto-Rickshaw (Live GPS)"
                        zIndex={999}
                      >
                        <div className="relative flex items-center justify-center">
                          {/* Pulsing Beacon Ring */}
                          <div className="absolute w-12 h-12 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
                          <div className="relative w-9 h-9 rounded-full bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-lg drop-shadow-md">
                            🛺
                          </div>
                          <div className="absolute -top-6 whitespace-nowrap bg-emerald-500 text-zinc-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md border border-white">
                            YOU (LIVE)
                          </div>
                        </div>
                      </AdvancedMarker>

                      {/* Remote Multiplayer Fleet Drivers along the Highway */}
                      {drivers.map((d) => {
                        const dLoc = getPlayerMapLocation(d.distanceKm);
                        return (
                          <AdvancedMarker
                            key={d.id}
                            position={{ lat: dLoc.lat, lng: dLoc.lng }}
                            title={`${d.name} (${d.speedKmh} km/h)`}
                          >
                            <div className="relative flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-cyan-600 border-2 border-white shadow-lg flex items-center justify-center text-xs">
                                🛺
                              </div>
                              <div className="mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-bold bg-zinc-900 text-cyan-300 border border-cyan-700 whitespace-nowrap shadow">
                                {d.name.split(' ')[0]} ({d.speedKmh}k)
                              </div>
                            </div>
                          </AdvancedMarker>
                        );
                      })}

                      {/* InfoWindow for Selected Stop */}
                      {selectedStop && (
                        <InfoWindow
                          position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
                          onCloseClick={() => setSelectedStop(null)}
                          maxWidth={260}
                        >
                          <div className="text-zinc-950 font-sans p-1">
                            <div className="flex items-center gap-1.5 font-bold text-sm text-amber-800">
                              <span>{selectedStop.icon}</span>
                              <span>{selectedStop.name}</span>
                            </div>
                            <div className="text-[11px] text-zinc-600 font-medium">
                              {selectedStop.hindiName} • {selectedStop.state}
                            </div>
                            <div className="mt-1 text-xs text-zinc-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                              <div>📍 {selectedStop.landmark}</div>
                              <div className="mt-0.5 text-amber-900 font-semibold">
                                ☕ {selectedStop.foodOrHighlight}
                              </div>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                              <span>Highway: {selectedStop.highwayCode}</span>
                              <span className="font-bold text-amber-700">{selectedStop.km.toFixed(1)} km</span>
                            </div>
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </div>
                </APIProvider>
              </div>
            ) : (
              /* RETRO VECTOR RADAR VIEW */
              <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
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

                <svg
                  viewBox="40 25 340 480"
                  className="w-full max-h-[460px] h-full object-contain filter drop-shadow-2xl overflow-visible"
                >
                  <defs>
                    <linearGradient id="indiaLand" x1="0%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="45%" stopColor="#1c1917" />
                      <stop offset="85%" stopColor="#292524" />
                      <stop offset="100%" stopColor="#18181b" />
                    </linearGradient>

                    <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <circle
                    cx="200"
                    cy="250"
                    r="190"
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="0.5"
                    strokeDasharray="4 6"
                    opacity="0.4"
                  />
                  <text
                    x="75"
                    y="380"
                    fill="#3f3f46"
                    fontSize="10"
                    fontWeight="bold"
                    letterSpacing="2"
                    opacity="0.6"
                  >
                    ARABIAN SEA
                  </text>
                  <text
                    x="260"
                    y="380"
                    fill="#3f3f46"
                    fontSize="10"
                    fontWeight="bold"
                    letterSpacing="2"
                    opacity="0.6"
                  >
                    BAY OF BENGAL
                  </text>
                  <text
                    x="140"
                    y="500"
                    fill="#3f3f46"
                    fontSize="9"
                    fontWeight="bold"
                    letterSpacing="1.5"
                    opacity="0.6"
                  >
                    INDIAN OCEAN
                  </text>

                  <path
                    d={indiaOutlinePath}
                    fill="url(#indiaLand)"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    className="transition duration-300"
                  />

                  {/* Complete National Highway Route Line */}
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

                  {/* Traced Path Completed So Far */}
                  {INDIA_STOPS.map((stop, i) => {
                    if (i === 0) return null;
                    const prevStop = INDIA_STOPS[i - 1];
                    const isPassed = (distanceKm % 75) >= stop.km;
                    const isCurrentLeg =
                      (distanceKm % 75) >= prevStop.km && (distanceKm % 75) <= stop.km;

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

                  {/* City Milestone Stop Markers */}
                  {INDIA_STOPS.map((stop) => {
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

                  {/* Remote Multiplayer Drivers */}
                  {drivers.map((d) => {
                    const dLoc = getPlayerMapLocation(d.distanceKm);
                    return (
                      <g key={d.id} transform={`translate(${dLoc.x}, ${dLoc.y})`}>
                        <circle cx="0" cy="0" r="10" fill="#06b6d4" opacity="0.3" className="animate-ping" />
                        <circle cx="0" cy="0" r="4.5" fill="#0891b2" stroke="#ffffff" strokeWidth="1" />
                        <text
                          x="0"
                          y="1.5"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="6"
                          className="pointer-events-none"
                        >
                          🛺
                        </text>
                        <text
                          x="0"
                          y="-7"
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="6"
                          fontWeight="bold"
                          className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] font-sans"
                        >
                          {d.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}

                  {/* Live Player Auto-Rickshaw Marker */}
                  <g
                    transform={`translate(${location.x}, ${location.y})`}
                    className="transition-all duration-150 ease-out"
                  >
                    <circle cx="0" cy="0" r="14" fill="url(#radarPulse)" className="animate-ping" />
                    <circle cx="0" cy="0" r="7" fill="#fbbf24" opacity="0.4" />
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
            )}
          </div>

          {/* RIGHT PANEL: CITY DETAILS, STATS & EXPEDITION LOG (5 COLS ON MD) */}
          <div className="md:col-span-5 p-3 sm:p-4 flex flex-col justify-between gap-3 bg-zinc-900/60 overflow-y-auto min-h-0">
            {/* Active City Card */}
            {selectedStop ? (
              <div className="bg-zinc-950/90 border-2 border-amber-500/70 rounded-2xl p-3.5 shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-400 font-mono tracking-wider">
                      {selectedStop.state} • {selectedStop.highwayCode}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
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
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Current Location
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {location.progressPercent}% of current leg
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
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
                    <div className="text-xs sm:text-sm font-black text-amber-300">
                      {location.remainingKmToNext.toFixed(1)} km
                    </div>
                    <div className="text-[8px] text-zinc-400 uppercase">Remaining</div>
                  </div>
                </div>
              </div>
            )}

            {/* Expedition Lifetime Statistics */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Driver Odyssey Stats
              </span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <div className="text-[11px] text-zinc-400">Total Fares</div>
                  <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">₹{totalEarnings}</div>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <div className="text-[11px] text-zinc-400">Passengers</div>
                  <div className="text-sm sm:text-base font-black text-amber-300 font-mono">{passengersServed} riders</div>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <div className="text-[11px] text-zinc-400">Cutting Chais</div>
                  <div className="text-sm sm:text-base font-black text-yellow-400 font-mono">{chaiCount} cups ☕</div>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <div className="text-[11px] text-zinc-400">Cities Passed</div>
                  <div className="text-sm sm:text-base font-black text-sky-400 font-mono">
                    {location.stopsCompletedCount} / {INDIA_STOPS.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Expedition Goal & CTA */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="text-[10px] text-zinc-400 text-center font-mono">
                🇮🇳 Tap any city milestone on Google Maps to zoom into its heritage & Dhaba highlights.
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
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
