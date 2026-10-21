import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { Zap, Smartphone, Eye, EyeOff } from 'lucide-react';

interface PhoneControlsProps {
  engine: GameEngine | null;
  chaiBoost: number;
  areButtonsHidden?: boolean;
  onToggleHideButtons?: () => void;
}

export const PhoneControls: React.FC<PhoneControlsProps> = ({
  engine,
  chaiBoost,
  areButtonsHidden = false,
  onToggleHideButtons,
}) => {
  const [controlMode, setControlMode] = useState<'buttons' | 'joystick' | 'tilt'>('buttons');
  const [joystickKnobX, setJoystickKnobX] = useState(0);
  const [isTiltActive, setIsTiltActive] = useState(false);
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);
  const [isBoostPressed, setIsBoostPressed] = useState(false);
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);

  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickTouchIdRef = useRef<number | null>(null);

  const triggerHaptic = (ms = 15) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // Haptics may be blocked without permission
    }
  };

  // --- Tilt / DeviceOrientation Steering ---
  const handleDeviceOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      if (!isTiltActive || !engine) return;
      // In landscape or portrait, gamma (left-to-right tilt) is typically -90 to +90
      let tilt = e.gamma || 0;
      // Adjust if phone is in landscape
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        tilt = e.beta || 0; // beta handles tilt when phone is sideways
      }
      // Deadzone and clamp
      const deadzone = 3;
      if (Math.abs(tilt) < deadzone) {
        engine.inputs.analogSteer = 0;
      } else {
        const normalized = Math.max(-1, Math.min(1, (tilt - Math.sign(tilt) * deadzone) / 25));
        // Steer: positive tilt is right, negative tilt is left
        engine.inputs.analogSteer = -normalized;
      }
    },
    [isTiltActive, engine]
  );

  const toggleTiltMode = async () => {
    if (isTiltActive) {
      setIsTiltActive(false);
      setControlMode('buttons');
      if (engine) engine.inputs.analogSteer = 0;
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      return;
    }

    // Check permission for iOS 13+ devices
    const deviceOrient = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof deviceOrient?.requestPermission === 'function') {
      try {
        const response = await deviceOrient.requestPermission();
        if (response === 'granted') {
          setIsTiltActive(true);
          setControlMode('tilt');
          triggerHaptic(30);
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
      } catch {
        // Fallback to buttons
      }
    } else {
      setIsTiltActive(true);
      setControlMode('tilt');
      triggerHaptic(30);
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      if (engine) {
        engine.inputs.analogSteer = 0;
        engine.inputs.analogThrottle = 0;
        engine.inputs.analogBrake = 0;
        engine.inputs.boost = false;
      }
    };
  }, [handleDeviceOrientation, engine]);

  // --- Virtual Joystick Handlers ---
  const handleJoystickStart = (e: React.TouchEvent) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    updateJoystickPos(touch.clientX);
    triggerHaptic(10);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        updateJoystickPos(e.changedTouches[i].clientX);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickKnobX(0);
        if (engine) engine.inputs.analogSteer = 0;
        break;
      }
    }
  };

  const updateJoystickPos = (touchClientX: number) => {
    if (!joystickBaseRef.current || !engine) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const maxRadius = rect.width / 2 - 16;
    const deltaX = touchClientX - centerX;
    const clampedDelta = Math.max(-maxRadius, Math.min(maxRadius, deltaX));
    setJoystickKnobX(clampedDelta);

    // Negative is left steer, positive is right steer
    const ratio = clampedDelta / maxRadius;
    engine.inputs.analogSteer = -ratio;
  };

  // --- Button Touch Helpers ---
  const handleGasStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsGasPressed(true);
    triggerHaptic(12);
    if (engine) {
      engine.inputs.analogThrottle = 1.0;
      engine.inputs.forward = true;
    }
  };

  const handleGasEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsGasPressed(false);
    if (engine) {
      engine.inputs.analogThrottle = 0;
      engine.inputs.forward = false;
    }
  };

  const handleBrakeStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsBrakePressed(true);
    triggerHaptic(15);
    if (engine) {
      engine.inputs.analogBrake = 1.0;
      engine.inputs.backward = true;
    }
  };

  const handleBrakeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsBrakePressed(false);
    if (engine) {
      engine.inputs.analogBrake = 0;
      engine.inputs.backward = false;
    }
  };

  const handleLeftStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsLeftPressed(true);
    triggerHaptic(10);
    if (engine) engine.inputs.left = true;
  };

  const handleLeftEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsLeftPressed(false);
    if (engine) engine.inputs.left = false;
  };

  const handleRightStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsRightPressed(true);
    triggerHaptic(10);
    if (engine) engine.inputs.right = true;
  };

  const handleRightEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsRightPressed(false);
    if (engine) engine.inputs.right = false;
  };

  const handleHornTap = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    triggerHaptic(25);
    engine?.triggerHorn();
  };

  const handleBoostStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsBoostPressed(true);
    triggerHaptic(20);
    if (engine) engine.inputs.boost = true;
  };

  const handleBoostEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsBoostPressed(false);
    if (engine) engine.inputs.boost = false;
  };

  const handleToggleHide = () => {
    triggerHaptic(20);
    if (onToggleHideButtons) {
      onToggleHideButtons();
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none select-none p-3 pb-5 flex flex-col justify-end">
      {/* Top Controls Bar: Switcher Pills + Dedicated Hide Button */}
      {!areButtonsHidden ? (
        <div className="w-full flex items-center justify-center gap-2 mb-2 pointer-events-auto flex-wrap">
          <button
            onClick={() => {
              setControlMode('buttons');
              setIsTiltActive(false);
              if (engine) engine.inputs.analogSteer = 0;
              triggerHaptic(15);
            }}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
              controlMode === 'buttons'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'bg-zinc-950/70 text-zinc-400 border border-zinc-800'
            }`}
          >
            Buttons
          </button>

          <button
            onClick={() => {
              setControlMode('joystick');
              setIsTiltActive(false);
              triggerHaptic(15);
            }}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
              controlMode === 'joystick'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'bg-zinc-950/70 text-zinc-400 border border-zinc-800'
            }`}
          >
            Handlebar Slider
          </button>

          <button
            onClick={toggleTiltMode}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition ${
              controlMode === 'tilt'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'bg-zinc-950/70 text-zinc-400 border border-zinc-800'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Tilt Phone</span>
          </button>

          {/* Dedicated Hide Button - hides extra buttons, keeps Race, Brake, Left & Right */}
          <button
            onClick={handleToggleHide}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-900/90 text-amber-300 hover:text-white border border-amber-500/60 shadow-lg transition active:scale-95 cursor-pointer"
            title="Hide Extra Buttons (Keeps Race, Brake, Left & Right buttons)"
          >
            <EyeOff className="w-3 h-3 text-amber-400" />
            <span>Hide Buttons</span>
          </button>
        </div>
      ) : (
        /* Floating Unhide / Show Buttons Pill when in Hidden mode */
        <div className="w-full flex items-center justify-center mb-2 pointer-events-auto">
          <button
            onClick={handleToggleHide}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/95 text-zinc-950 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] transition active:scale-95 animate-pulse cursor-pointer"
            title="Show all buttons"
          >
            <Eye className="w-3.5 h-3.5 fill-current" />
            <span>Show Buttons</span>
          </button>
        </div>
      )}

      {/* Main Dual-Thumb Driving Controls */}
      <div className="w-full flex items-end justify-between px-1 sm:px-4 max-w-6xl mx-auto">
        {/* ========================================================= */}
        {/* LEFT THUMB ZONE: LEFT & RIGHT BUTTONS (ALWAYS ACTIVE!)   */}
        {/* ========================================================= */}
        <div className="pointer-events-auto">
          {(controlMode === 'buttons' || areButtonsHidden) && (
            <div className="flex items-center gap-2 sm:gap-3 bg-zinc-950/80 p-2 rounded-2xl border-2 border-zinc-800/90 shadow-2xl backdrop-blur-none">
              <button
                onTouchStart={handleLeftStart}
                onTouchEnd={handleLeftEnd}
                onTouchCancel={handleLeftEnd}
                onMouseDown={handleLeftStart}
                onMouseUp={handleLeftEnd}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex flex-col items-center justify-center font-black transition active:scale-95 touch-none cursor-pointer ${
                  isLeftPressed
                    ? 'bg-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                    : 'bg-zinc-900 border border-zinc-700/80 text-amber-300'
                }`}
                title="Steer Left"
              >
                <span className="text-2xl sm:text-3xl leading-none">◀</span>
                <span className="text-[9px] uppercase tracking-wider mt-0.5 font-sans">Left</span>
              </button>

              <button
                onTouchStart={handleRightStart}
                onTouchEnd={handleRightEnd}
                onTouchCancel={handleRightEnd}
                onMouseDown={handleRightStart}
                onMouseUp={handleRightEnd}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex flex-col items-center justify-center font-black transition active:scale-95 touch-none cursor-pointer ${
                  isRightPressed
                    ? 'bg-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                    : 'bg-zinc-900 border border-zinc-700/80 text-amber-300'
                }`}
                title="Steer Right"
              >
                <span className="text-2xl sm:text-3xl leading-none">▶</span>
                <span className="text-[9px] uppercase tracking-wider mt-0.5 font-sans">Right</span>
              </button>
            </div>
          )}

          {!areButtonsHidden && controlMode === 'joystick' && (
            <div
              ref={joystickBaseRef}
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              onTouchCancel={handleJoystickEnd}
              className="relative w-40 h-20 sm:w-48 sm:h-24 bg-zinc-950/90 border-2 border-amber-500/50 rounded-2xl p-2 flex items-center justify-center shadow-2xl touch-none"
            >
              {/* Steer Guide Rail */}
              <div className="absolute inset-x-4 h-3 bg-zinc-900 rounded-full border border-zinc-700 flex items-center justify-between px-2">
                <span className="text-[9px] text-zinc-500 font-bold">◀ L</span>
                <span className="text-[9px] text-amber-400 font-bold">●</span>
                <span className="text-[9px] text-zinc-500 font-bold">R ▶</span>
              </div>

              {/* Draggable Handlebar Knob */}
              <div
                className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-white shadow-xl flex items-center justify-center text-zinc-950 font-black cursor-grab active:cursor-grabbing transform transition-transform duration-75"
                style={{ transform: `translateX(${joystickKnobX}px)` }}
              >
                <span className="text-xs">🛺</span>
              </div>
            </div>
          )}

          {!areButtonsHidden && controlMode === 'tilt' && (
            <div className="bg-zinc-950/90 border-2 border-amber-500/60 rounded-2xl px-5 py-3 shadow-2xl flex flex-col items-center text-center max-w-[170px]">
              <Smartphone className="w-6 h-6 text-amber-400 animate-bounce" />
              <span className="text-xs font-bold text-amber-200 mt-1 uppercase">Tilt to Steer</span>
              <span className="text-[9px] text-zinc-400">Physically tilt phone left / right</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* CENTER ACCENT: HORN BUTTON (HIDDEN IF areButtonsHidden)    */}
        {/* ========================================================= */}
        {!areButtonsHidden && (
          <div className="pointer-events-auto mx-1 mb-1">
            <button
              onTouchStart={handleHornTap}
              onClick={handleHornTap}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-600 via-amber-500 to-yellow-500 hover:scale-105 active:scale-95 border-3 border-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex flex-col items-center justify-center text-zinc-950 font-black transition cursor-pointer touch-none"
              title="Honk Horn"
            >
              <span className="text-xl sm:text-2xl leading-none">📯</span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-tighter font-extrabold leading-none mt-0.5">
                HORN OK
              </span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* RIGHT THUMB ZONE: BRAKE & RACE (ALWAYS VISIBLE!) + BOOST  */}
        {/* ========================================================= */}
        <div className="flex items-end gap-2 pointer-events-auto">
          {/* Chai Nitro Boost Button - Hidden when buttons are hidden */}
          {!areButtonsHidden && (
            <button
              onTouchStart={handleBoostStart}
              onTouchEnd={handleBoostEnd}
              onTouchCancel={handleBoostEnd}
              onMouseDown={handleBoostStart}
              onMouseUp={handleBoostEnd}
              disabled={chaiBoost <= 0}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center transition active:scale-95 touch-none ${
                chaiBoost > 0
                  ? isBoostPressed
                    ? 'bg-amber-400 text-zinc-950 shadow-[0_0_25px_rgba(251,191,36,0.8)]'
                    : 'bg-zinc-950/90 border-2 border-amber-500 text-amber-300'
                  : 'bg-zinc-900/60 border border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
              }`}
              title="Nitro Boost"
            >
              <Zap className={`w-5 h-5 ${chaiBoost > 0 ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
              <span className="text-[8px] uppercase font-bold tracking-wider mt-0.5">Boost</span>
            </button>
          )}

          {/* Brake Pedal - ALWAYS VISIBLE */}
          <button
            onTouchStart={handleBrakeStart}
            onTouchEnd={handleBrakeEnd}
            onTouchCancel={handleBrakeEnd}
            onMouseDown={handleBrakeStart}
            onMouseUp={handleBrakeEnd}
            className={`w-15 h-20 sm:w-18 sm:h-24 rounded-2xl flex flex-col items-center justify-between p-2 font-black transition active:scale-95 touch-none cursor-pointer ${
              isBrakePressed
                ? 'bg-rose-600 text-white shadow-[0_0_25px_rgba(225,29,72,0.8)] border-2 border-rose-300'
                : 'bg-rose-950/70 border-2 border-rose-800/80 text-rose-300'
            }`}
            title="Brake / Reverse"
          >
            <span className="text-[9px] uppercase tracking-wider">STOP</span>
            <span className="text-xl sm:text-2xl font-mono leading-none">▼</span>
            <span className="text-[8px] uppercase tracking-tighter">BRAKE</span>
          </button>

          {/* Gas / Accelerator Pedal (RACE) - ALWAYS VISIBLE */}
          <button
            onTouchStart={handleGasStart}
            onTouchEnd={handleGasEnd}
            onTouchCancel={handleGasEnd}
            onMouseDown={handleGasStart}
            onMouseUp={handleGasEnd}
            className={`w-16 h-24 sm:w-20 sm:h-28 rounded-2xl flex flex-col items-center justify-between p-2.5 font-black transition active:scale-95 touch-none cursor-pointer ${
              isGasPressed
                ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_30px_rgba(16,185,129,0.8)] border-2 border-white'
                : 'bg-emerald-950/80 border-2 border-emerald-600 text-emerald-300'
            }`}
            title="Accelerate / Race"
          >
            <span className="text-[9px] uppercase tracking-wider">RACE</span>
            <span className="text-2xl sm:text-3xl font-mono leading-none">▲</span>
            <span className="text-[9px] uppercase tracking-widest font-extrabold">GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
