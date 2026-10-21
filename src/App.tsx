import { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState } from './game/engine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { MissionLogModal } from './components/MissionLogModal';
import { DesiPhoneModal } from './components/DesiPhoneModal';
import { ChaiBreakModal } from './components/ChaiBreakModal';
import { IndiaMapModal } from './components/IndiaMapModal';
import { sounds } from './game/audio';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    speedKmh: 0,
    fareRupees: 25,
    totalEarnings: 0,
    distanceKm: 0,
    chaiBoost: 40,
    condition: 100,
    hasPassenger: false,
    passengerName: '',
    passengersServed: 0,
    chaiCount: 0,
    isPaused: false,
    isGameOver: false,
    activeCameraMode: 'title',
    timeString: '06:15 PM',
    timePhase: 'sunset',
    timePhaseLabel: 'Godhuli Sunset (Sandhya)',
    isNight: false,
    visibilityPercent: 75,
    weather: {
      type: 'sunny',
      label: 'Clear & Sunny',
      hindiLabel: 'धूप (Dhoop)',
      icon: '☀️',
      tractionMultiplier: 1.0,
      visibilityPercent: 100,
      isRaining: false,
      isDusty: false,
      windForce: 0,
    },
    handling: {
      gripPercent: 100,
      surfaceType: 'tarmac',
      surfaceLabel: 'Dry Tarmac (Optimal)',
      isAquaplaning: false,
      isBrakeLocked: false,
      isWheelSpinning: false,
      isWindBuffeting: false,
      adviceTip: 'Smooth highway. Accelerate freely!',
    },
    isNearChaiStall: false,
    isChaiBreakActive: false,
    goals: [],
    unclaimedGoalsCount: 0,
    currentStation: {
      id: 'bollywood',
      name: 'Radio Mirchi Nostalgia',
      frequency: '98.3 FM',
      genre: 'Retro Bollywood',
      tagline: 'Kishore & Lata Classic Golden Melodies',
    },
    isTwoWheelStunt: false,
    incomingCall: null,
    message: '',
  });

  const [isMuted, setIsMuted] = useState(sounds.isMuted);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize 3D Three.js Engine once in isolated ref container
    const engine = new GameEngine(mountRef.current, (newState) => {
      setGameState(newState);
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Global Keyboard shortcuts 'P' (Phone) and 'M' (India Map)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'p' || e.key === 'P') {
        setIsPhoneModalOpen((prev) => !prev);
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMapModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans">
      {/* Isolated WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Title Screen Overlay */}
      {gameState.activeCameraMode === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game Active HUD Overlay */}
      {gameState.activeCameraMode !== 'title' && (
        <GameHUD
          state={gameState}
          engine={engineRef.current}
          onTogglePause={handleTogglePause}
          onToggleMute={handleToggleMute}
          onOpenMissions={() => setIsMissionModalOpen(true)}
          onOpenPhone={() => setIsPhoneModalOpen(true)}
          onOpenMap={() => setIsMapModalOpen(true)}
          isMuted={isMuted}
        />
      )}

      {/* Daily Goals / Mission Log Modal */}
      {isMissionModalOpen && (
        <MissionLogModal
          goals={gameState.goals}
          onClaimReward={(id) => engineRef.current?.claimMissionReward(id)}
          onClose={() => setIsMissionModalOpen(false)}
        />
      )}

      {/* In-Game Mobile Phone (Virtual Calling Simulation) */}
      <DesiPhoneModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        engine={engineRef.current}
        incomingCallAlert={gameState.incomingCall}
        onDismissIncomingAlert={() => engineRef.current?.dismissIncomingCall()}
      />

      {/* Bharat Yatra India Route Map GPS Tracker Modal */}
      <IndiaMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        distanceKm={gameState.distanceKm}
        totalEarnings={gameState.totalEarnings}
        passengersServed={gameState.passengersServed}
        chaiCount={gameState.chaiCount}
      />

      {/* Game Over / Shift Report Card */}
      {gameState.isGameOver && (
        <GameOverModal
          state={gameState}
          onRestart={handleRestart}
        />
      )}

      {/* Roadside Cutting Chai Break Animation Sequence Modal */}
      <ChaiBreakModal
        isOpen={gameState.isChaiBreakActive}
        onFinish={() => engineRef.current?.finishChaiBreak()}
      />
    </div>
  );
}
