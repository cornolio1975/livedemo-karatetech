'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ScoreboardEngine, { Competitor } from './ScoreboardEngine';
import { 
  Play, Pause, SkipBack, SkipForward, Square, RotateCcw, RefreshCw, 
  FastForward, Volume2, VolumeX, Maximize2, Minimize2, CheckCircle2, Award 
} from 'lucide-react';

export interface AutomatedMatchScenario {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  tatami: string;
  round: string;
  aka: Competitor;
  ao: Competitor;
  durationSec: number; // seconds
  events: {
    sec: number; // match second when event occurs
    action: 'aka_score' | 'ao_score' | 'ao_penalty' | 'aka_penalty' | 'senshu_aka' | 'senshu_ao' | 'hantei' | 'hansoku';
    points?: number; // 1, 2, 3
    penaltyLevel?: number; // 1 to 5
    hanteiVotes?: { aka: number; ao: number };
  }[];
  winner: 'aka' | 'ao';
  winMethod: string;
}

const MATCH_SCENARIOS: AutomatedMatchScenario[] = [
  {
    id: 1,
    title: 'Match 1 – Win by Points Advantage',
    subtitle: 'Demonstrates Yuko (+1), Waza-ari (+2), and Ippon (+3) scoring under WKF rules',
    category: 'Senior Male Kumite -75kg',
    tatami: 'Tatami 1',
    round: 'Final',
    aka: { name: 'Muhammad Amir', country: 'Malaysia 🇲🇾', club: 'Senshi Club' },
    ao: { name: 'Kenji Sato', country: 'Japan 🇯🇵', club: 'Goju-Ryu Club' },
    durationSec: 30,
    events: [
      { sec: 6, action: 'aka_score', points: 1 },  // AKA Yuko 1pt -> Senshu AKA
      { sec: 14, action: 'ao_score', points: 2 },  // AO Waza-ari 2pts -> Score 1-2
      { sec: 22, action: 'aka_score', points: 3 },  // AKA Ippon 3pts -> Score 4-2
    ],
    winner: 'aka',
    winMethod: 'Points Advantage (Score 4–2)'
  },
  {
    id: 2,
    title: 'Match 2 – Win by First Unopposed Score (Senshu)',
    subtitle: 'Demonstrates tiebreaker rule when scores are equal at match conclusion',
    category: 'Female Kumite -61kg',
    tatami: 'Tatami 1',
    round: 'Final',
    aka: { name: 'Anis Shahira', country: 'Malaysia 🇲🇾', club: 'Senshi Club' },
    ao: { name: 'Sakura Tanaka', country: 'Japan 🇯🇵', club: 'Goju-Ryu Club' },
    durationSec: 30,
    events: [
      { sec: 8, action: 'aka_score', points: 1 },  // AKA Yuko -> Senshu AKA ON
      { sec: 20, action: 'ao_score', points: 1 },  // AO Yuko -> Score 1-1, Senshu remains AKA
    ],
    winner: 'aka',
    winMethod: 'First Unopposed Score (Senshu)'
  },
  {
    id: 3,
    title: 'Match 3 – Win by Superior Points',
    subtitle: 'Demonstrates dominant scoring technique accumulation',
    category: 'Male Kumite -84kg',
    tatami: 'Tatami 1',
    round: 'Final',
    aka: { name: 'Ryuji Tomita', country: 'Japan 🇯🇵', club: 'Senshi Club' },
    ao: { name: 'Harith Danial', country: 'Malaysia 🇲🇾', club: 'Goju-Ryu Club' },
    durationSec: 30,
    events: [
      { sec: 6, action: 'aka_score', points: 1 },  // AKA 1
      { sec: 12, action: 'ao_score', points: 1 },  // AO 1
      { sec: 18, action: 'aka_score', points: 2 },  // AKA 3
      { sec: 24, action: 'aka_score', points: 3 },  // AKA 6
    ],
    winner: 'aka',
    winMethod: 'Superior Points (Score 6–1)'
  },
  {
    id: 4,
    title: 'Match 4 – Win by Referee Decision (Hantei)',
    subtitle: 'Demonstrates 0-0 tie decision with judge flag voting animation',
    category: 'Senior Female Kumite -55kg',
    tatami: 'Tatami 1',
    round: 'Final',
    aka: { name: 'Mei Lin', country: 'Singapore 🇸🇬', club: 'Senshi Club' },
    ao: { name: 'Sarah Tan', country: 'Malaysia 🇲🇾', club: 'Goju-Ryu Club' },
    durationSec: 30,
    events: [
      { sec: 26, action: 'hantei', hanteiVotes: { aka: 4, ao: 1 } }
    ],
    winner: 'aka',
    winMethod: 'Referee Decision (Hantei 4–1)'
  },
  {
    id: 5,
    title: 'Match 5 – Win by Opponent Disqualification (Hansoku)',
    subtitle: 'Demonstrates disqualification resulting from excessive Category penalties',
    category: 'Senior Male Kumite +84kg',
    tatami: 'Tatami 1',
    round: 'Final',
    aka: { name: 'Viktor Kovac', country: 'Croatia 🇭🇷', club: 'Senshi Club' },
    ao: { name: 'Kenji Sato', country: 'Japan 🇯🇵', club: 'Goju-Ryu Club' },
    durationSec: 30,
    events: [
      { sec: 5, action: 'ao_penalty', penaltyLevel: 1 }, // C1
      { sec: 10, action: 'ao_penalty', penaltyLevel: 2 }, // C2
      { sec: 15, action: 'ao_penalty', penaltyLevel: 3 }, // C3
      { sec: 20, action: 'ao_penalty', penaltyLevel: 4 }, // HC
      { sec: 24, action: 'ao_penalty', penaltyLevel: 5 }, // H (Hansoku!)
    ],
    winner: 'aka',
    winMethod: 'Opponent Disqualification (Hansoku)'
  }
];

export default function AutomatedDemoEngine() {
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Transition Banner state (3 seconds after match ends)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState(3);

  // Elapsed tenths of a second (10 tenths = 1 second)
  const [elapsedTenths, setElapsedTenths] = useState(0);
  const [scoreAka, setScoreAka] = useState(0);
  const [scoreAo, setScoreAo] = useState(0);
  const [c1Aka, setC1Aka] = useState(0);
  const [c1Ao, setC1Ao] = useState(0);
  const [senshuAka, setSenshuAka] = useState(false);
  const [senshuAo, setSenshuAo] = useState(false);
  const [winner, setWinner] = useState<'aka' | 'ao' | null>(null);
  const [winMethod, setWinMethod] = useState('');
  const [showHantei, setShowHantei] = useState(false);
  const [hanteiVotes, setHanteiVotes] = useState({ aka: 0, ao: 0 });
  const [showHansoku, setShowHansoku] = useState(false);

  const senshuAkaRef = useRef(senshuAka);
  const senshuAoRef = useRef(senshuAo);

  useEffect(() => { senshuAkaRef.current = senshuAka; }, [senshuAka]);
  useEffect(() => { senshuAoRef.current = senshuAo; }, [senshuAo]);

  const activeScenario = MATCH_SCENARIOS[currentMatchIdx];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedEventsRef = useRef<Set<number>>(new Set());

  const endTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (transitionTimerRef.current) { clearInterval(transitionTimerRef.current); transitionTimerRef.current = null; }
    if (endTimeoutRef.current) { clearTimeout(endTimeoutRef.current); endTimeoutRef.current = null; }
  }, []);

  // Listen for browser fullscreen changes
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Reset match state when scenario changes
  const resetMatchState = useCallback(() => {
    clearAllTimers();
    setElapsedTenths(0);
    setScoreAka(0);
    setScoreAo(0);
    setC1Aka(0);
    setC1Ao(0);
    setSenshuAka(false);
    setSenshuAo(false);
    senshuAkaRef.current = false;
    senshuAoRef.current = false;
    setWinner(null);
    setWinMethod('');
    setShowHantei(false);
    setShowHansoku(false);
    setIsTransitioning(false);
    setTransitionCountdown(3);
    processedEventsRef.current.clear();
  }, [clearAllTimers]);

  useEffect(() => {
    resetMatchState();
    return () => clearAllTimers();
  }, [currentMatchIdx, resetMatchState, clearAllTimers]);

  const play15sWarningBell = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playBellRing = (startTime: number) => {
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.6);
        gainNode.connect(ctx.destination);

        const freqs = [880, 1200, 1760];
        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime + startTime);
          osc.connect(gainNode);
          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + 0.6);
        });
      };

      playBellRing(0);
      playBellRing(0.4);
      playBellRing(0.8);
    } catch (e) {
      console.warn('Audio Context warning bell error:', e);
    }
  }, [soundEnabled]);

  const triggerMatchEnd = useCallback((winSide: 'aka' | 'ao', method: string) => {
    clearAllTimers();
    setWinner(winSide);
    setWinMethod(method);
    setIsTransitioning(true);
    let count = 3;
    setTransitionCountdown(3);

    const stepMs = 1000 / playbackSpeed;
    transitionTimerRef.current = setInterval(() => {
      count -= 1;
      setTransitionCountdown(count);
      if (count <= 0) {
        clearAllTimers();
        setCurrentMatchIdx((prevIdx) => (prevIdx + 1) % MATCH_SCENARIOS.length);
      }
    }, stepMs);
  }, [clearAllTimers, playbackSpeed]);

  // Main timer tick effect
  useEffect(() => {
    if (!isPlaying || isTransitioning || winner) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 100 / playbackSpeed;
    timerRef.current = setInterval(() => {
      setElapsedTenths((prevTenths) => {
        const nextTenths = prevTenths + 1;
        const currentSec = Math.floor(nextTenths / 10);
        const remainingTenthsVal = Math.max(0, activeScenario.durationSec * 10 - nextTenths);

        if (remainingTenthsVal === 150) {
          play15sWarningBell();
        }

        // Process scheduled scenario events
        activeScenario.events.forEach((evt, idx) => {
          if (evt.sec === currentSec && !processedEventsRef.current.has(idx)) {
            processedEventsRef.current.add(idx);

            if (evt.action === 'aka_score') {
              setScoreAka(s => s + (evt.points || 1));
              if (!senshuAkaRef.current && !senshuAoRef.current) {
                setSenshuAka(true);
                senshuAkaRef.current = true;
              }
            } else if (evt.action === 'ao_score') {
              setScoreAo(s => s + (evt.points || 1));
              if (!senshuAoRef.current && !senshuAkaRef.current) {
                setSenshuAo(true);
                senshuAoRef.current = true;
              }
            } else if (evt.action === 'ao_penalty') {
              const level = evt.penaltyLevel || 1;
              setC1Ao(level);
              if (level >= 5) {
                setShowHansoku(true);
                triggerMatchEnd('aka', activeScenario.winMethod);
              }
            } else if (evt.action === 'aka_penalty') {
              const level = evt.penaltyLevel || 1;
              setC1Aka(level);
              if (level >= 5) {
                setShowHansoku(true);
                triggerMatchEnd('ao', activeScenario.winMethod);
              }
            } else if (evt.action === 'hantei') {
              setShowHantei(true);
              setHanteiVotes(evt.hanteiVotes || { aka: 4, ao: 1 });
            }
          }
        });

        // Time limit check
        const totalDurationTenths = activeScenario.durationSec * 10;
        if (nextTenths >= totalDurationTenths && !winner) {
          triggerMatchEnd(activeScenario.winner, activeScenario.winMethod);
        }

        return nextTenths;
      });
    }, intervalMs);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, isTransitioning, winner, playbackSpeed, activeScenario, play15sWarningBell, triggerMatchEnd]);

  // Playback Control Handlers
  const handlePlayPause = () => setIsPlaying(p => !p);
  const handleNextMatch = () => {
    clearAllTimers();
    setCurrentMatchIdx(i => (i + 1) % MATCH_SCENARIOS.length);
  };
  const handlePrevMatch = () => {
    clearAllTimers();
    setCurrentMatchIdx(i => (i - 1 + MATCH_SCENARIOS.length) % MATCH_SCENARIOS.length);
  };
  const handleReplayMatch = () => {
    clearAllTimers();
    resetMatchState();
    setIsPlaying(true);
  };
  const handleRestartDemo = () => {
    clearAllTimers();
    setCurrentMatchIdx(0);
    resetMatchState();
    setIsPlaying(true);
  };
  const handleStop = () => {
    clearAllTimers();
    setIsPlaying(false);
    resetMatchState();
  };
  const toggleSpeed = () => {
    setPlaybackSpeed(s => (s === 1 ? 2 : s === 2 ? 4 : 1));
  };

  // Remaining time in tenths of a second
  const remainingTenths = Math.max(0, activeScenario.durationSec * 10 - elapsedTenths);
  const progressPercent = Math.min(100, Math.round((elapsedTenths / (activeScenario.durationSec * 10)) * 100));

  return (
    <div className={`w-full flex flex-col items-center space-y-3 font-sans select-none ${
      isFullscreen ? 'fixed inset-0 z-[500] bg-[#070b15] overflow-y-auto p-6' : ''
    }`}>

      {/* ══ MEDIA PLAYER CONTROL TOOLBAR ══ */}
      <div className="w-full bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col space-y-3 z-20">
        
        {/* Top Info Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black uppercase tracking-widest rounded-lg animate-pulse">
              Match {currentMatchIdx + 1} of {MATCH_SCENARIOS.length}
            </span>
            <div>
              <h4 className="text-sm font-black text-white tracking-wide">{activeScenario.title}</h4>
              <p className="text-[11px] font-semibold text-slate-400">{activeScenario.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSpeed}
              className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition cursor-pointer border ${
                playbackSpeed > 1 ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/40' : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
              }`}
            >
              <FastForward className="h-3.5 w-3.5 inline mr-1" />
              {playbackSpeed}x SPEED
            </button>

            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                isFullscreen ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
              }`}
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(s => !s)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-white/10 transition cursor-pointer"
              title="Toggle Sound Effects"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-red-400" />}
            </button>
          </div>
        </div>

        {/* Playback Buttons & Progress Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          
          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMatch}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer border border-white/5"
              title="Previous Match (⏮)"
            >
              <SkipBack className="h-4 w-4 fill-white" />
            </button>

            <button
              onClick={handlePlayPause}
              className={`p-3 rounded-xl font-black transition shadow-lg cursor-pointer flex items-center justify-center ${
                isPlaying ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-900/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
              title={isPlaying ? 'Pause (⏸)' : 'Play (▶)'}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            <button
              onClick={handleStop}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-xl transition cursor-pointer border border-white/5"
              title="Stop (⏹)"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>

            <button
              onClick={handleNextMatch}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer border border-white/5"
              title="Next Match (⏭)"
            >
              <SkipForward className="h-4 w-4 fill-white" />
            </button>

            <div className="w-px h-6 bg-slate-800 mx-1" />

            <button
              onClick={handleReplayMatch}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-white/5"
              title="Replay Current Match (🔁)"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Replay
            </button>

            <button
              onClick={handleRestartDemo}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-white/5"
              title="Restart Entire Demo (🔄)"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Restart
            </button>
          </div>

          {/* Scenario Progress Indicator */}
          <div className="flex-1 min-w-[200px] flex flex-col space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>PROGRESS</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>

      </div>

      {/* ══ TRANSITION OVERLAY BANNER (3-second fade transition between matches) ══ */}
      {isTransitioning && (
        <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center animate-fade-in z-30">
          <Award className="h-10 w-10 text-amber-400 animate-bounce mb-2" />
          <h3 className="text-2xl font-black text-white uppercase tracking-wider">
            {activeScenario.winner.toUpperCase()} VICTORIOUS: {activeScenario.winMethod}
          </h3>
          <p className="text-sm font-bold text-indigo-300 mt-1">
            Next match loading in <span className="text-yellow-400 text-lg font-black">{transitionCountdown}</span> seconds...
          </p>
          <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3 border border-white/10">
            <div 
              className="bg-yellow-400 h-full transition-all duration-1000"
              style={{ width: `${(transitionCountdown / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ══ LIVE RE-USED SCOREBOARD CONTROL ENGINE ══ */}
      <ScoreboardEngine
        tournamentName="Senshi Goju-Ryu Karate Championship 2026"
        tatamiName={activeScenario.tatami}
        categoryName={activeScenario.category}
        roundName={activeScenario.round}
        aka={activeScenario.aka}
        ao={activeScenario.ao}
        initialDuration={activeScenario.durationSec}
        interactive={false} // Automated playback controls actions
        soundEnabled={soundEnabled}
        playbackSpeed={playbackSpeed}
        externalState={{
          scoreAka,
          scoreAo,
          c1Aka,
          c1Ao,
          senshuAka,
          senshuAo,
          timeLeft: remainingTenths,
          timerRunning: isPlaying && !isTransitioning && !winner,
          winner,
          winMethod,
          showHanteiOverlay: showHantei,
          hanteiVotes,
          showHansokuOverlay: showHansoku
        }}
      />

    </div>
  );
}
