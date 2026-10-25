import { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState } from './game/engine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { MissionLogModal } from './components/MissionLogModal';
import { DesiPhoneModal } from './components/DesiPhoneModal';
import { ChaiBreakModal } from './components/ChaiBreakModal';
import { IndiaMapModal } from './components/IndiaMapModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { AuthModal } from './components/AuthModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { sounds } from './game/audio';
import { DriverProfile, getSavedSession } from './game/auth';
import { submitDriverScore } from './game/leaderboard';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(() => getSavedSession());
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

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
    multiplayer: {
      isConnected: false,
      pingMs: 24,
      onlineCount: 1,
      selfId: null,
      drivers: [],
      recentChats: [],
      lastChatToast: null,
    },
    speedBuff: null,
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

  // Global Keyboard shortcuts 'P' (Phone), 'M' (India Map), 'N' / 'Tab' (Multiplayer Fleet)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'p' || e.key === 'P') {
        setIsPhoneModalOpen((prev) => !prev);
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMapModalOpen((prev) => !prev);
      }
      if (e.key === 'n' || e.key === 'N') {
        setIsMultiplayerModalOpen((prev) => !prev);
      }
      if (e.key === 'l' || e.key === 'L') {
        setIsLeaderboardModalOpen((prev) => !prev);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsMultiplayerModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync to leaderboard on Game Over
  useEffect(() => {
    if (gameState.isGameOver && driverProfile) {
      submitDriverScore({
        profile: driverProfile,
        earnings: gameState.totalEarnings,
        distanceKm: gameState.distanceKm,
        topSpeedKmh: gameState.speedKmh,
        chaiCount: gameState.chaiCount,
        passengersServed: gameState.passengersServed,
      });
    }
  }, [gameState.isGameOver]);

  const handleProfileUpdated = (newProfile: DriverProfile | null) => {
    setDriverProfile(newProfile);
    if (engineRef.current && newProfile) {
      engineRef.current.updatePlayerProfile(newProfile.name, newProfile.liveryId);
    }
  };

  const handleStartGame = () => {
    if (!driverProfile) {
      setIsAuthModalOpen(true);
      return;
    }
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
      {/* Google Maps Platform Quota Defense Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Isolated WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Title Screen Overlay */}
      {gameState.activeCameraMode === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardModalOpen(true)}
          onlineCount={gameState.multiplayer.onlineCount}
          driverProfile={driverProfile}
          onOpenAuth={() => setIsAuthModalOpen(true)}
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
          onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          driverProfile={driverProfile}
          isMuted={isMuted}
        />
      )}

      {/* Daily Goals / Mission Log Modal */}
      {isMissionModalOpen && (
        <MissionLogModal
          goals={gameState.goals}
          onClaimReward={(id) => engineRef.current?.claimMissionReward(id)}
          onClose={() => setIsMissionModalOpen(false)}
          currentSpeedKmh={gameState.speedKmh}
          activeSpeedBuff={gameState.speedBuff}
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
        drivers={gameState.multiplayer.drivers}
      />

      {/* 5G Real-Time Fleet Multiplayer Lobby Modal */}
      <MultiplayerModal
        isOpen={isMultiplayerModalOpen}
        onClose={() => setIsMultiplayerModalOpen(false)}
        engine={engineRef.current}
        drivers={gameState.multiplayer.drivers}
        recentChats={gameState.multiplayer.recentChats}
        isConnected={gameState.multiplayer.isConnected}
        pingMs={gameState.multiplayer.pingMs}
        onlineCount={gameState.multiplayer.onlineCount}
      />

      {/* Game Over / Shift Report Card */}
      {gameState.isGameOver && (
        <GameOverModal
          state={gameState}
          onRestart={handleRestart}
          onOpenLeaderboard={() => setIsLeaderboardModalOpen(true)}
        />
      )}

      {/* Roadside Cutting Chai Break Animation Sequence Modal */}
      <ChaiBreakModal
        isOpen={gameState.isChaiBreakActive}
        onFinish={() => engineRef.current?.finishChaiBreak()}
      />

      {/* All-India Highway Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        currentProfile={driverProfile}
        engine={engineRef.current}
        currentShiftStats={{
          earnings: gameState.totalEarnings,
          distanceKm: gameState.distanceKm,
          topSpeedKmh: gameState.speedKmh,
          chaiCount: gameState.chaiCount,
          passengersServed: gameState.passengersServed,
        }}
      />

      {/* Driver License & Auth Gateway Modal (Login to Play or Play as Guest) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentProfile={driverProfile}
        onProfileUpdated={handleProfileUpdated}
        onStartDriveAfterAuth={() => {
          if (gameState.activeCameraMode === 'title' && engineRef.current) {
            engineRef.current.startGame();
          }
        }}
      />
    </div>
  );
}
