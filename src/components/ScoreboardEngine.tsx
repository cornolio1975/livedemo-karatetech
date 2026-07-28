'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Square, RotateCcw, Maximize2, Minimize2, Zap, Volume2, VolumeX, 
  Award, ShieldAlert, Flag, Tv, List, Undo, Check, ChevronLeft, Globe, LogIn 
} from 'lucide-react';

export interface Competitor {
  name: string;
  country: string; // e.g. "Malaysia 🇲🇾"
  club?: string;
  flag?: string;
}

export interface ScoreboardEngineProps {
  tournamentName?: string;
  tatamiName?: string;
  categoryName?: string;
  roundName?: string;
  aka?: Competitor;
  ao?: Competitor;
  initialDuration?: number; // seconds
  interactive?: boolean;
  soundEnabled?: boolean;
  playbackSpeed?: number;
  
  // Controlled state (optional for automated demo)
  externalState?: {
    scoreAka: number;
    scoreAo: number;
    c1Aka: number;
    c1Ao: number;
    senshuAka: boolean;
    senshuAo: boolean;
    timeLeft: number; // in tenths of a second (e.g. 1800 = 3:00.0)
    timerRunning: boolean;
    winner: 'aka' | 'ao' | null;
    winMethod: string;
    showHanteiOverlay?: boolean;
    hanteiVotes?: { aka: number; ao: number };
    showHansokuOverlay?: boolean;
    pointsHistoryAka?: number[];
    pointsHistoryAo?: number[];
  };

  onStateChange?: (state: any) => void;
  onMatchComplete?: (winner: 'aka' | 'ao', winMethod: string) => void;
}

export default function ScoreboardEngine({
  tournamentName = 'Senshi Goju-Ryu Karate Championship 2026',
  tatamiName = 'Tatami 1',
  categoryName = 'Senior Male Kumite -75kg',
  roundName = 'Final',
  aka = { name: 'Muhammad Amir', country: 'Malaysia 🇲🇾', club: 'Senshi Club' },
  ao = { name: 'Kenji Sato', country: 'Japan 🇯🇵', club: 'Goju-Ryu Club' },
  initialDuration = 180,
  interactive = true,
  soundEnabled = true,
  playbackSpeed = 1,
  externalState,
  onStateChange,
  onMatchComplete
}: ScoreboardEngineProps) {

  // Internal Live scoring states (used when not fully controlled externally)
  const [scoreAka, setScoreAka] = useState(0);
  const [scoreAo, setScoreAo] = useState(0);
  const [c1Aka, setC1Aka] = useState(0);
  const [c1Ao, setC1Ao] = useState(0);
  const [senshuAka, setSenshuAka] = useState(false);
  const [senshuAo, setSenshuAo] = useState(false);
  const [firstScorer, setFirstScorer] = useState<'aka' | 'ao' | 'none' | null>(null);
  
  // Time in tenths of seconds (1800 = 3:00.0)
  const [timeLeftTenths, setTimeLeftTenths] = useState(initialDuration * 10);
  const [timerRunning, setTimerRunning] = useState(false);
  const [matchDuration, setMatchDuration] = useState(initialDuration);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [winner, setWinner] = useState<'aka' | 'ao' | null>(null);
  const [winMethod, setWinMethod] = useState<string>('');
  const [fullscreen, setFullscreen] = useState(false);
  const [historyAka, setHistoryAka] = useState<number[]>([]);
  const [historyAo, setHistoryAo] = useState<number[]>([]);
  
  // Hantei / Disqualification Overlay States
  const [showHantei, setShowHantei] = useState(false);
  const [hanteiVotes, setHanteiVotes] = useState<{ aka: number; ao: number }>({ aka: 0, ao: 0 });
  const [showHansoku, setShowHansoku] = useState(false);

  // Sync state if provided externally
  useEffect(() => {
    if (externalState) {
      setScoreAka(externalState.scoreAka);
      setScoreAo(externalState.scoreAo);
      setC1Aka(externalState.c1Aka);
      setC1Ao(externalState.c1Ao);
      setSenshuAka(externalState.senshuAka);
      setSenshuAo(externalState.senshuAo);
      setTimeLeftTenths(externalState.timeLeft);
      setTimerRunning(externalState.timerRunning);
      setWinner(externalState.winner);
      setWinMethod(externalState.winMethod);
      if (externalState.showHanteiOverlay !== undefined) setShowHantei(externalState.showHanteiOverlay);
      if (externalState.hanteiVotes) setHanteiVotes(externalState.hanteiVotes);
      if (externalState.showHansokuOverlay !== undefined) setShowHansoku(externalState.showHansokuOverlay);
      if (externalState.pointsHistoryAka) setHistoryAka(externalState.pointsHistoryAka);
      if (externalState.pointsHistoryAo) setHistoryAo(externalState.pointsHistoryAo);
    }
  }, [externalState]);

  // Audio synthesis helper
  const playSound = useCallback((freq = 587.33, duration = 0.3) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback not supported:', e);
    }
  }, [soundEnabled]);

  // Derive Senshu from firstScorer if not externally set
  useEffect(() => {
    if (externalState) return;
    if (firstScorer === 'aka') {
      setSenshuAka(true);
      setSenshuAo(false);
    } else if (firstScorer === 'ao') {
      setSenshuAo(true);
      setSenshuAka(false);
    } else {
      setSenshuAka(false);
      setSenshuAo(false);
    }
  }, [firstScorer, externalState]);

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

  // Timer tick (tenths of a second)
  useEffect(() => {
    if (externalState) return; // Controlled externally
    if (timerRunning) {
      const intervalMs = 100 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setTimeLeftTenths(t => {
          if (t === 150) {
            play15sWarningBell();
          }
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            playSound(880, 0.8);
            return 0;
          }
          return t - 1;
        });
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, playbackSpeed, playSound, play15sWarningBell, externalState]);

  // Automatic WKF end of match resolution
  useEffect(() => {
    if (externalState) return;
    if (timeLeftTenths === 0 && !winner) {
      if (scoreAka > scoreAo) {
        declareWinner('aka', 'Points Advantage');
      } else if (scoreAo > scoreAka) {
        declareWinner('ao', 'Points Advantage');
      } else {
        if (senshuAka) {
          declareWinner('aka', 'First Unopposed Score (Senshu)');
        } else if (senshuAo) {
          declareWinner('ao', 'First Unopposed Score (Senshu)');
        } else {
          triggerHanteiDecision();
        }
      }
    }
  }, [timeLeftTenths, winner, scoreAka, scoreAo, senshuAka, senshuAo, externalState]);

  const declareWinner = (side: 'aka' | 'ao', method: string) => {
    setTimerRunning(false);
    setWinner(side);
    setWinMethod(method);
    playSound(783.99, 0.5);
    if (onMatchComplete) onMatchComplete(side, method);
  };

  const triggerHanteiDecision = () => {
    setShowHantei(true);
    setHanteiVotes({ aka: 4, ao: 1 });
    setTimeout(() => {
      declareWinner('aka', 'Referee Decision (Hantei)');
    }, 2500);
  };

  // Unified Action History Stack for Undo
  interface ActionHistoryEntry {
    type: 'score' | 'penalty' | 'senshu';
    side: 'aka' | 'ao';
    pts?: number;
    prevPenalty?: number;
    prevSenshuAka?: boolean;
    prevSenshuAo?: boolean;
    prevFirstScorer?: 'aka' | 'ao' | 'none' | null;
  }
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);

  // Actions
  const addScore = (side: 'aka' | 'ao', pts: number) => {
    if (!interactive || winner) return;
    playSound(pts === 3 ? 880 : pts === 2 ? 659.25 : 523.25, 0.2);

    setActionHistory(prev => [
      ...prev,
      {
        type: 'score',
        side,
        pts,
        prevSenshuAka: senshuAka,
        prevSenshuAo: senshuAo,
        prevFirstScorer: firstScorer
      }
    ]);

    if (side === 'aka') {
      const next = scoreAka + pts;
      setScoreAka(next);
      setHistoryAka(h => [...h, pts]);
      if (firstScorer === null) setFirstScorer('aka');
      
      if (next - scoreAo >= 8) {
        declareWinner('aka', 'Superior Points (8-Pt Gap)');
      }
    } else {
      const next = scoreAo + pts;
      setScoreAo(next);
      setHistoryAo(h => [...h, pts]);
      if (firstScorer === null) setFirstScorer('ao');

      if (next - scoreAka >= 8) {
        declareWinner('ao', 'Superior Points (8-Pt Gap)');
      }
    }
  };

  const addPenalty = (side: 'aka' | 'ao', level: number) => {
    if (!interactive || winner) return;
    playSound(440, 0.3);

    const prevLevel = side === 'aka' ? c1Aka : c1Ao;
    setActionHistory(prev => [
      ...prev,
      {
        type: 'penalty',
        side,
        prevPenalty: prevLevel
      }
    ]);

    if (side === 'aka') {
      const nextVal = c1Aka === level ? Math.max(0, level - 1) : level;
      setC1Aka(nextVal);
      if (nextVal >= 5) {
        setShowHansoku(true);
        declareWinner('ao', 'Opponent Disqualification (Hansoku)');
      }
    } else {
      const nextVal = c1Ao === level ? Math.max(0, level - 1) : level;
      setC1Ao(nextVal);
      if (nextVal >= 5) {
        setShowHansoku(true);
        declareWinner('aka', 'Opponent Disqualification (Hansoku)');
      }
    }
  };

  const toggleSenshu = (side: 'aka' | 'ao') => {
    if (!interactive || winner) return;

    setActionHistory(prev => [
      ...prev,
      {
        type: 'senshu',
        side,
        prevSenshuAka: senshuAka,
        prevSenshuAo: senshuAo
      }
    ]);

    if (side === 'aka') {
      setSenshuAka(s => !s);
      if (!senshuAka) setSenshuAo(false);
    } else {
      setSenshuAo(s => !s);
      if (!senshuAo) setSenshuAka(false);
    }
  };

  const undoLastAction = () => {
    if (!interactive || actionHistory.length === 0) return;
    const lastAction = actionHistory[actionHistory.length - 1];
    setActionHistory(h => h.slice(0, -1));

    if (lastAction.type === 'score') {
      const pts = lastAction.pts || 0;
      if (lastAction.side === 'aka') {
        setScoreAka(s => Math.max(0, s - pts));
        setHistoryAka(h => h.slice(0, -1));
      } else {
        setScoreAo(s => Math.max(0, s - pts));
        setHistoryAo(h => h.slice(0, -1));
      }
      if (lastAction.prevSenshuAka !== undefined) setSenshuAka(lastAction.prevSenshuAka);
      if (lastAction.prevSenshuAo !== undefined) setSenshuAo(lastAction.prevSenshuAo);
      if (lastAction.prevFirstScorer !== undefined) setFirstScorer(lastAction.prevFirstScorer);
      setWinner(null);
      setWinMethod('');
    } else if (lastAction.type === 'penalty') {
      if (lastAction.side === 'aka') {
        setC1Aka(lastAction.prevPenalty || 0);
      } else {
        setC1Ao(lastAction.prevPenalty || 0);
      }
      setShowHansoku(false);
      setWinner(null);
      setWinMethod('');
    } else if (lastAction.type === 'senshu') {
      if (lastAction.prevSenshuAka !== undefined) setSenshuAka(lastAction.prevSenshuAka);
      if (lastAction.prevSenshuAo !== undefined) setSenshuAo(lastAction.prevSenshuAo);
    }
  };

  const startTimer = () => {
    if (timeLeftTenths > 0 && !winner) {
      setTimerRunning(true);
      playSound(659.25, 0.2);
    }
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    playSound(440, 0.2);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeftTenths(matchDuration * 10);
    setScoreAka(0);
    setScoreAo(0);
    setC1Aka(0);
    setC1Ao(0);
    setSenshuAka(false);
    setSenshuAo(false);
    setFirstScorer(null);
    setWinner(null);
    setWinMethod('');
    setShowHantei(false);
    setShowHansoku(false);
    setHistoryAka([]);
    setHistoryAo([]);
    setActionHistory([]);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!interactive || externalState) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setTimerRunning(r => !r);
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        undoLastAction();
      } else if (e.key === 'r' || e.key === 'R') {
        addScore('aka', 1);
      } else if (e.key === 'u' || e.key === 'U') {
        addScore('ao', 1);
      } else if (e.key === 'f' || e.key === 'F') {
        addScore('aka', 2);
      } else if (e.key === 'j' || e.key === 'J') {
        addScore('ao', 2);
      } else if (e.key === 'v' || e.key === 'V') {
        addScore('aka', 3);
      } else if (e.key === 'm' || e.key === 'M') {
        addScore('ao', 3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactive, externalState]);

  const formatMainTime = (tenths: number): string => {
    const totalSecs = Math.floor(tenths / 10);
    const m = Math.floor(totalSecs / 60);
    const sec = totalSecs % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDecsTime = (tenths: number): string => {
    return `.${tenths % 10}`;
  };

  return (
    <div className={`flex flex-col bg-[#0b0b10] text-white overflow-hidden select-none font-sans ${fullscreen ? 'fixed inset-0 z-[300]' : 'w-full rounded-2xl border border-white/10 shadow-2xl'}`}>
      
      {/* ══ TOP BRANDING NAVBAR (Matching Exact Screenshot Header) ══ */}
      <header className="bg-[#0b0b10] border-b border-white/10 px-4 py-2 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-white/5 rounded text-slate-400">
            <span className="text-base leading-none">≡</span>
          </button>
          <a href="#" className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Tv size={13} className="text-amber-400" />
            <span>T-LiveDisplay</span>
          </a>
          <a href="#" className="font-bold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
            <Globe size={13} className="text-indigo-400" />
            <span>Corporate Home</span>
          </a>
          <a href="/" className="font-bold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
            <span>Home</span>
          </a>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-extrabold uppercase text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE EVENT</span>
          </div>
          <span className="font-black text-slate-200 tracking-wide">{tournamentName}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center border border-white/20">
            AD
          </div>
        </div>
      </header>

      {/* ══ SECONDARY TITLE BAR: SCOREBOARD CONTROL ══ */}
      <div className="bg-[#0e0e14] border-b border-white/5 px-4 py-2 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            <ChevronLeft size={16} className="text-slate-400" /> SCOREBOARD CONTROL
          </h1>
          <p className="text-[10px] font-bold text-slate-500 pl-6">{tournamentName}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Spectator Connected</span>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs transition cursor-pointer">
            <Tv size={13} />
            <span>Spectator View</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs border border-white/10 transition cursor-pointer">
            <List size={13} className="text-amber-400" />
            <span>Display Playlists</span>
          </button>

          <button
            onClick={() => setFullscreen(f => !f)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={() => undoScore('aka')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold border border-white/10 transition cursor-pointer"
          >
            <Undo size={13} /> Undo
          </button>
        </div>
      </div>

      {/* ══ SCOREBOARD MAIN BODY (3 Columns: AKA | TIMER | AO) ══ */}
      <div className="p-3 grid grid-cols-12 gap-3 relative bg-[#06070a] min-h-[460px]">

        {/* HANTEI OVERLAY ANIMATION */}
        {showHantei && (
          <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="flex items-center gap-2 text-amber-400 font-black tracking-widest text-xl mb-2">
              <Flag className="h-6 w-6 animate-bounce" />
              <span>REFEREE DECISION</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-6">HANTEI</h2>
            
            <div className="flex items-center justify-center gap-12 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-red-400 mb-2">AKA (RED)</span>
                <div className="flex gap-2">
                  {Array.from({ length: hanteiVotes.aka }).map((_, i) => (
                    <div key={i} className="w-8 h-14 bg-red-600 border-2 border-white rounded-md shadow-lg shadow-red-900/80 animate-pulse" />
                  ))}
                </div>
                <span className="mt-2 font-black text-2xl text-red-500">{hanteiVotes.aka} Flags</span>
              </div>

              <div className="text-2xl font-black text-slate-600">VS</div>

              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-cyan-400 mb-2">AO (BLUE)</span>
                <div className="flex gap-2">
                  {Array.from({ length: hanteiVotes.ao }).map((_, i) => (
                    <div key={i} className="w-8 h-14 bg-blue-600 border-2 border-white rounded-md shadow-lg shadow-blue-900/80 animate-pulse" />
                  ))}
                </div>
                <span className="mt-2 font-black text-2xl text-cyan-400">{hanteiVotes.ao} Flags</span>
              </div>
            </div>
          </div>
        )}

        {/* HANSOKU OVERLAY */}
        {showHansoku && (
          <div className="absolute inset-0 z-40 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in border-4 border-red-600">
            <ShieldAlert className="h-16 w-16 text-yellow-400 animate-pulse mb-2" />
            <h2 className="text-5xl font-black text-yellow-400 tracking-widest uppercase mb-2">HANSOKU</h2>
            <p className="text-xl font-bold text-white uppercase tracking-wider mb-4">DISQUALIFICATION DUE TO EXCESSIVE PENALTIES</p>
          </div>
        )}

        {/* WINNER BANNER OVERLAY */}
        {winner && !showHantei && (
          <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 p-6 flex flex-col items-center justify-center shadow-2xl border-y-4 animate-scale-up ${
            winner === 'aka' ? 'bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-red-500 text-white' : 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-blue-500 text-white'
          }`}>
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-black uppercase tracking-widest mb-1">
              <Award className="h-5 w-5" /> MATCH VICTORY
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-widest uppercase mb-1">
              WINNER: {winner === 'aka' ? aka.name : ao.name} ({winner.toUpperCase()})
            </h2>
            <p className="text-sm font-extrabold tracking-wider text-amber-300 uppercase">
              VICTORY REASON: {winMethod}
            </p>
          </div>
        )}

        {/* ── AKA (RED / LEFT COLUMN) ── */}
        <div className="col-span-4 border border-red-900/40 rounded-2xl p-4 flex flex-col justify-between bg-gradient-to-b from-[#1c0404] via-[#0f0202] to-[#080101] shadow-2xl relative overflow-hidden">
          
          {/* Fighter Info */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xl font-black text-red-500 uppercase tracking-wider">AKA - RED</span>
              {senshuAka && (
                <span className="px-2.5 py-0.5 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                  SENSHU
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{aka.name}</h2>
            <p className="text-xs font-bold text-red-400/80 uppercase">{aka.club || aka.country}</p>
          </div>

          {/* Giant Score Number */}
          <div className="my-4 flex items-center justify-center">
            <span className="text-9xl font-black text-red-500 tracking-tighter leading-none select-none font-mono drop-shadow-[0_0_45px_rgba(239,68,68,0.7)]">
              {scoreAka}
            </span>
          </div>

          {/* Action Controls */}
          <div className="space-y-2 pt-2 border-t border-red-900/30">
            {/* 3 Grid Score Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => addScore('aka', 1)}
                disabled={!interactive || !!winner}
                className="py-3 bg-red-800/80 hover:bg-red-700 text-white rounded-xl flex flex-col items-center justify-center border border-red-600/50 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl font-black tracking-wider leading-none">+1</span>
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">YUKO</span>
              </button>
              <button
                onClick={() => addScore('aka', 2)}
                disabled={!interactive || !!winner}
                className="py-3 bg-red-800/80 hover:bg-red-700 text-white rounded-xl flex flex-col items-center justify-center border border-red-600/50 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl font-black tracking-wider leading-none">+2</span>
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">WAZA-ARI</span>
              </button>
              <button
                onClick={() => addScore('aka', 3)}
                disabled={!interactive || !!winner}
                className="py-3 bg-red-800/80 hover:bg-red-700 text-white rounded-xl flex flex-col items-center justify-center border border-red-600/50 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl font-black tracking-wider leading-none">+3</span>
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">IPPON</span>
              </button>
            </div>

            {/* Penalties Row */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase font-black tracking-widest text-red-400/80">AKA PENALTIES</span>
                <button
                  onClick={() => toggleSenshu('aka')}
                  disabled={!interactive || !!winner}
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded transition border ${
                    senshuAka ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-black/50 text-slate-500 border-slate-800'
                  }`}
                >
                  SENSHU {senshuAka ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((level) => {
                  const labels = ['', 'C1', 'C2', 'C3', 'HC', 'H'];
                  const filled = c1Aka >= level;
                  return (
                    <button
                      key={level}
                      onClick={() => addPenalty('aka', level)}
                      disabled={!interactive || !!winner}
                      className={`py-1.5 rounded-lg text-xs font-black transition border cursor-pointer ${
                        filled ? 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-black/40 text-slate-500 border-slate-800 hover:text-white'
                      }`}
                    >
                      {labels[level]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ── MATCH TIMER (MIDDLE COLUMN) ── */}
        <div className="col-span-4 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center text-center bg-[#070910]">
          <span className="text-lg font-black uppercase tracking-[0.25em] text-white/90">MATCH TIMER</span>

          {/* Time Display with Decimals */}
          <div className="my-auto py-2">
            <div className="text-7xl font-black text-white font-mono tracking-tight flex items-baseline justify-center">
              <span>{formatMainTime(timeLeftTenths)}</span>
              <span className="text-4xl text-slate-400 font-mono">{formatDecsTime(timeLeftTenths)}</span>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`w-3 h-3 rounded-full ${timerRunning ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {timerRunning ? 'RUNNING' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-4 gap-1.5">
              <div className="col-span-2">
                <button
                  onClick={timerRunning ? pauseTimer : startTimer}
                  disabled={timeLeftTenths === 0 || !!winner}
                  className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg ${
                    timerRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                  }`}
                >
                  {timerRunning ? <Square size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
                  <span>{timerRunning ? 'PAUSE TIMER' : 'START TIMER'}</span>
                </button>
              </div>

              <button
                onClick={resetTimer}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 border border-white/10 transition cursor-pointer"
              >
                <RotateCcw size={13} /> Reset
              </button>

              <div className="grid grid-rows-2 gap-0.5">
                <button
                  onClick={() => setTimeLeftTenths(t => t + 150)}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-[9px] border border-white/10"
                >
                  +15
                </button>
                <button
                  onClick={() => setTimeLeftTenths(t => Math.max(0, t - 150))}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-[9px] border border-white/10"
                >
                  -15
                </button>
              </div>
            </div>

            {/* Duration Selector & Undo Action */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="text-left">
                <label className="block text-[8px] font-black uppercase text-slate-500 mb-0.5">Match Duration</label>
                <select
                  value={matchDuration}
                  onChange={e => {
                    const d = Number(e.target.value);
                    setMatchDuration(d);
                    setTimeLeftTenths(d * 10);
                  }}
                  disabled={timerRunning}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-white cursor-pointer"
                >
                  <option value={60}>1:00 Minute</option>
                  <option value={90}>1:30 Minutes</option>
                  <option value={120}>2:00 Minutes</option>
                  <option value={180}>3.00 Minutes</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={undoLastAction}
                  disabled={!interactive || actionHistory.length === 0}
                  className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-black text-xs uppercase transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-30"
                >
                  <RotateCcw size={12} /> UNDO ACTION
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ── AO (BLUE / RIGHT COLUMN) ── */}
        <div className="col-span-4 border border-blue-900/40 rounded-2xl p-4 flex flex-col justify-between bg-gradient-to-b from-[#04101e] via-[#020914] to-[#01040a] shadow-2xl relative overflow-hidden">
          
          {/* Fighter Info */}
          <div>
            <div className="flex items-center justify-between mb-1">
              {senshuAo && (
                <span className="px-2.5 py-0.5 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                  SENSHU
                </span>
              )}
              <span className="text-xl font-black text-cyan-400 uppercase tracking-wider ml-auto">AO - BLUE</span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{ao.name}</h2>
            <p className="text-xs font-bold text-cyan-400/80 uppercase">{ao.club || ao.country}</p>
          </div>

          {/* Giant Score Number */}
          <div className="my-4 flex items-center justify-center">
            <span className="text-9xl font-black text-cyan-400 tracking-tighter leading-none select-none font-mono drop-shadow-[0_0_45px_rgba(34,211,238,0.7)]">
              {scoreAo}
            </span>
          </div>

          {/* Action Controls */}
          <div className="space-y-2 pt-2 border-t border-blue-900/30">
            {/* 3 Grid Score Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => addScore('ao', 1)}
                disabled={!interactive || !!winner}
                className="py-3 bg-blue-800/80 hover:bg-blue-700 text-white rounded-xl flex flex-col items-center justify-center border border-blue-600/50 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl font-black tracking-wider leading-none">+1</span>
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">YUKO</span>
              </button>
              <button
                onClick={() => addScore('ao', 2)}
                disabled={!interactive || !!winner}
                className="py-3 bg-blue-800/80 hover:bg-blue-700 text-white rounded-xl flex flex-col items-center justify-center border border-blue-600/50 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl font-black tracking-wider leading-none">+2</span>
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">WAZA-ARI</span>
              </button>
              <button
                onClick={() => addScore('ao', 3)}
                disabled={!interactive || !!winner}
                className="py-3 bg-blue-800/80 hover:bg-blue-700 text-white rounded-xl flex flex-col items-center justify-center border border-blue-600/50 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-30"
              >
                <span className="text-xl font-black tracking-wider leading-none">+3</span>
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">IPPON</span>
              </button>
            </div>

            {/* Penalties Row */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => toggleSenshu('ao')}
                  disabled={!interactive || !!winner}
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded transition border ${
                    senshuAo ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-black/50 text-slate-500 border-slate-800'
                  }`}
                >
                  SENSHU {senshuAo ? 'ON' : 'OFF'}
                </button>
                <span className="text-[9px] uppercase font-black tracking-widest text-cyan-400/80">AO PENALTIES</span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((level) => {
                  const labels = ['', 'C1', 'C2', 'C3', 'HC', 'H'];
                  const filled = c1Ao >= level;
                  return (
                    <button
                      key={level}
                      onClick={() => addPenalty('ao', level)}
                      disabled={!interactive || !!winner}
                      className={`py-1.5 rounded-lg text-xs font-black transition border cursor-pointer ${
                        filled ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-black/40 text-slate-500 border-slate-800 hover:text-white'
                      }`}
                    >
                      {labels[level]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ══ BOTTOM BAR: SHORTCUTS & SAVE CTA ══ */}
      <footer className="bg-[#0a0c12] border-t border-white/10 px-4 py-2 flex items-center justify-between shrink-0 text-[11px] font-bold">
        <div className="text-slate-400 flex items-center gap-3">
          <span className="text-slate-200 uppercase font-black">Shortcuts:</span>
          <span><strong className="text-white">Space</strong> Start/Stop</span>
          <span><strong className="text-white">R/U</strong> AKA/AO +1</span>
          <span><strong className="text-white">F/J</strong> AKA/AO +2</span>
          <span><strong className="text-white">V/M</strong> AKA/AO +3</span>
          <span><strong className="text-white">Backspace</strong> Undo</span>
          <span><strong className="text-white">Enter</strong> Finish</span>
        </div>

        <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5">
          <span>💾</span> SAVE BOUT RESULT
        </button>
      </footer>

    </div>
  );
}
