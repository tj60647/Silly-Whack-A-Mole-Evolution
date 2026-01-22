
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, LevelData } from './types';
import { INITIAL_DIFFICULTY, GRID_SIZE } from './constants';
import { generateLevelContent } from './services/geminiService';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [currentLevelData, setCurrentLevelData] = useState<LevelData | null>(null);
  const [activeMoles, setActiveMoles] = useState<number[]>([]);
  const [hitMoles, setHitMoles] = useState<number[]>([]);
  const [isError, setIsError] = useState(false);

  // Fix: Use specific types for refs to avoid 'unknown' errors when using clearTimeout/clearInterval
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moleStayTimers = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});

  const loadNextLevel = useCallback(async (nextLvl: number) => {
    setGameState(GameState.LEVEL_LOADING);
    setIsError(false);
    try {
      const content = await generateLevelContent(nextLvl);
      
      const difficulty = {
        spawnInterval: Math.max(300, INITIAL_DIFFICULTY.spawnInterval - (nextLvl * 100)),
        moleStayDuration: Math.max(400, INITIAL_DIFFICULTY.moleStayDuration - (nextLvl * 60)),
        targetScore: INITIAL_DIFFICULTY.targetScore + (nextLvl * 3),
        activeMoleCount: Math.min(5, Math.floor(nextLvl / 2) + 1),
      };

      setCurrentLevelData({
        id: nextLvl,
        ...content,
        difficulty
      });
      setGameState(GameState.LEVEL_INTRO);
    } catch (err) {
      console.error("Failed to load level:", err);
      setIsError(true);
      setGameState(GameState.START);
    }
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    loadNextLevel(1);
  };

  const startLevel = () => {
    setScore(0);
    setTimeLeft(30);
    setActiveMoles([]);
    setHitMoles([]);
    setGameState(GameState.PLAYING);
  };

  // Timer Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setGameState(GameState.GAME_OVER);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Mole Spawning Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING && currentLevelData) {
      const spawnMole = () => {
        setActiveMoles(prev => {
          if (prev.length >= currentLevelData.difficulty.activeMoleCount) return prev;
          
          const availableIndices = Array.from({ length: GRID_SIZE })
            .map((_, i) => i)
            .filter(i => !prev.includes(i) && !hitMoles.includes(i));
          
          if (availableIndices.length === 0) return prev;
          
          const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          
          // Fix: Handle existing timer cleanup with typed ref
          if (moleStayTimers.current[randomIndex]) {
            clearTimeout(moleStayTimers.current[randomIndex]);
          }

          moleStayTimers.current[randomIndex] = setTimeout(() => {
            setActiveMoles(current => current.filter(id => id !== randomIndex));
          }, currentLevelData.difficulty.moleStayDuration);

          return [...prev, randomIndex];
        });
      };

      gameLoopRef.current = setInterval(spawnMole, currentLevelData.difficulty.spawnInterval);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      Object.values(moleStayTimers.current).forEach(t => clearTimeout(t));
      moleStayTimers.current = {};
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      Object.values(moleStayTimers.current).forEach(t => clearTimeout(t));
    };
  }, [gameState, currentLevelData, hitMoles]);

  const handleWhack = (index: number) => {
    setHitMoles(prev => [...prev, index]);
    setScore(s => {
      const newScore = s + 1;
      if (currentLevelData && newScore >= currentLevelData.difficulty.targetScore) {
        setGameState(GameState.LEVEL_TRANSITION);
        setTimeout(() => {
          setLevel(l => {
            const next = l + 1;
            loadNextLevel(next);
            return next;
          });
        }, 800);
      }
      return newScore;
    });

    setTimeout(() => {
      setHitMoles(prev => prev.filter(id => id !== index));
      setActiveMoles(prev => prev.filter(id => id !== index));
    }, 200);
  };

  const StartScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-black">
      <div className="mb-6 p-4 bg-yellow-400 text-black font-arcade rounded-lg rotate-2 shadow-xl animate-pulse">
        AI-POWERED SILLINESS!
      </div>
      <h1 className="text-6xl md:text-8xl font-arcade mb-4 text-white drop-shadow-[0_8px_0_#4f46e5]">
        WHACK-A-<span className="text-yellow-400">THING</span>
      </h1>
      
      <div className="max-w-xl bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md mb-12">
        <h3 className="text-yellow-400 font-arcade text-xl mb-4 text-left">INSTRUCTIONS:</h3>
        <ul className="text-left space-y-3 text-indigo-100 mb-8 list-disc list-inside">
          <li>A unique theme is generated by Gemini for every level.</li>
          <li>Click (whack) the weird creatures as fast as you can.</li>
          <li>Reach the target score before the 30-second timer runs out.</li>
          <li>Complexity increases: more moles, faster spawns, shorter stays!</li>
        </ul>
        <button 
          onClick={startGame}
          className="w-full px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white text-3xl font-arcade rounded-2xl shadow-[0_8px_0_#3730a3] transition-all hover:-translate-y-1 active:translate-y-2 active:shadow-none"
        >
          START MISSION
        </button>
      </div>
      
      {isError && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded-xl text-red-200">
          Oops! The AI got stage fright. Please check your connection or API key.
        </div>
      )}
    </div>
  );

  const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-8">
      <div className="relative w-40 h-40 mb-12">
        <div className="absolute inset-0 border-8 border-white/5 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🎨</span>
        </div>
      </div>
      <h2 className="text-4xl font-arcade text-white mb-4">PREPARING LEVEL {level}</h2>
      <p className="text-indigo-300 font-bold animate-pulse text-xl">
        {level === 1 ? "Imagining creatures..." : "Ramping up the silliness..."}
      </p>
    </div>
  );

  const LevelIntroScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-8">
      <div className="relative group">
        <div className="absolute -inset-4 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <img 
          src={currentLevelData?.moleImageUrl} 
          alt="Level Mole" 
          className="relative w-72 h-72 rounded-full object-cover border-8 border-yellow-400 shadow-2xl mb-8"
        />
      </div>
      
      <div className="text-center max-w-2xl mb-12">
        <span className="bg-indigo-600 px-4 py-1 rounded-full font-bold text-sm tracking-widest mb-4 inline-block">LEVEL {level}</span>
        <h1 className="text-5xl md:text-7xl font-arcade text-white mb-6 uppercase tracking-tight">
          THE {currentLevelData?.moleName}S
        </h1>
        <p className="text-2xl text-indigo-200 font-medium italic border-l-4 border-yellow-400 pl-6 text-left">
          "{currentLevelData?.intro}"
        </p>
      </div>
      
      <button 
        onClick={startLevel}
        className="px-16 py-8 bg-yellow-400 hover:bg-yellow-300 text-black text-3xl font-arcade rounded-full shadow-[0_10px_0_#b45309] transition-all active:translate-y-2 active:shadow-none"
      >
        WHACK 'EM!
      </button>
    </div>
  );

  const GameOverScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-950 p-8 text-center">
      <h1 className="text-8xl font-arcade text-white mb-4">GAME OVER</h1>
      <p className="text-3xl text-red-200 mb-8 font-arcade">YOU REACHED LEVEL {level}</p>
      <div className="bg-black/40 p-8 rounded-3xl border border-red-500/30 mb-12">
        <p className="text-xl text-white mb-2">Final Whacks: <span className="text-yellow-400 font-arcade text-2xl">{score}</span></p>
        <p className="text-indigo-300 italic">"The moles were just too fast this time!"</p>
      </div>
      <button 
        onClick={() => setGameState(GameState.START)}
        className="px-12 py-6 bg-white text-black text-3xl font-arcade rounded-full shadow-[0_8px_0_#94a3b8] hover:-translate-y-1 transition-all active:translate-y-1"
      >
        TRY AGAIN
      </button>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {gameState === GameState.START && <StartScreen />}
      {gameState === GameState.LEVEL_LOADING && <LoadingScreen />}
      {gameState === GameState.LEVEL_INTRO && <LevelIntroScreen />}
      {gameState === GameState.GAME_OVER && <GameOverScreen />}
      
      {gameState === GameState.LEVEL_TRANSITION && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-600/80 backdrop-blur-md">
          <h2 className="text-8xl font-arcade text-white animate-bounce">LEVEL COMPLETE!</h2>
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.LEVEL_TRANSITION) && currentLevelData && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 dirt-pattern">
          
          {/* Top HUD */}
          <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-md border-b-4 border-indigo-500 p-6 rounded-t-3xl flex justify-between items-center mb-0 shadow-2xl">
            <div className="flex flex-col">
              <span className="text-indigo-400 text-xs font-arcade tracking-widest uppercase">Target Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-arcade text-yellow-400 tabular-nums">{score}</span>
                <span className="text-xl font-arcade text-indigo-500">/ {currentLevelData.difficulty.targetScore}</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-red-400 text-xs font-arcade tracking-widest uppercase mb-1">Time Remaining</span>
              <div className={`text-5xl font-arcade tabular-nums px-4 py-2 rounded-xl border-2 ${timeLeft <= 5 ? 'text-red-500 animate-pulse border-red-500' : 'text-white border-white/20'}`}>
                {timeLeft}s
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-indigo-400 text-xs font-arcade tracking-widest uppercase">Current Level</span>
              <span className="text-4xl font-arcade text-white">{level}</span>
            </div>
          </div>

          {/* Game Arena */}
          <div className="w-full max-w-2xl bg-indigo-900/40 p-8 rounded-b-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-x-4 border-b-4 border-indigo-500">
            <GameBoard
              activeIndices={activeMoles}
              hitIndices={hitMoles}
              moleImageUrl={currentLevelData.moleImageUrl}
              catchphrase={currentLevelData.catchphrase}
              onWhack={handleWhack}
            />
          </div>

          <div className="mt-8 px-6 py-3 bg-black/50 rounded-full border border-white/10 text-indigo-200 font-bold tracking-wider">
            WATCH OUT FOR: <span className="text-yellow-400 uppercase">{currentLevelData.moleName}s</span>
          </div>
        </div>
      )}

      {/* Persistence Controls */}
      {(gameState === GameState.PLAYING || gameState === GameState.LEVEL_INTRO || gameState === GameState.GAME_OVER) && (
        <button 
          onClick={() => setGameState(GameState.START)}
          className="fixed bottom-6 left-6 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white/50 hover:text-white text-xs font-bold rounded-lg transition-all"
        >
          EXIT GAME
        </button>
      )}
    </div>
  );
};

export default App;
