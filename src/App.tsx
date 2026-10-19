import { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState } from './game/engine';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { sounds } from './game/audio';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

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
          isMuted={isMuted}
        />
      )}

      {/* Game Over / Shift Report Card */}
      {gameState.isGameOver && (
        <GameOverModal
          state={gameState}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
