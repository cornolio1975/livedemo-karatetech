'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ScoreboardEngine from '@/components/ScoreboardEngine';
import AutomatedDemoEngine from '@/components/AutomatedDemoEngine';
import { 
  Trophy, Play, Monitor, Settings, Zap, ArrowLeft, CheckCircle2, 
  ExternalLink, Sparkles, Sliders, ShieldCheck, Maximize2, Minimize2 
} from 'lucide-react';
import { basePath } from '@/db/dbClient';

export default function LiveDemoPage() {
  // Mode selection: 'menu' | 'manual' | 'automated'
  const [activeMode, setActiveMode] = useState<'menu' | 'manual' | 'automated'>('menu');

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 font-sans select-none flex flex-col">
      
      {/* ══ TOP BAR HEADER ══ */}
      <header className="border-b border-white/10 bg-[#0b0f19] px-6 py-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Return to Home"
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-white/20 bg-slate-900 shrink-0">
              <img src={`${basePath}/logo.jpg`} alt="KarateTech Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white uppercase tracking-wider">
                  <span className="text-red-500">Karate</span>
                  <span className="text-cyan-400">Tech</span> Live Demo
                </span>
                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black tracking-widest uppercase rounded-full animate-pulse">
                  WKF 2026
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400">karatetech.spsportdatasolution.org</p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs & Fullscreen (Top Right) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveMode('menu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition cursor-pointer ${
                activeMode === 'menu' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Demo Menu
            </button>
            <button
              onClick={() => setActiveMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'manual' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders size={13} />
              <span>Manual Demo</span>
            </button>
            <button
              onClick={() => setActiveMode('automated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'automated' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play size={13} className="fill-current" />
              <span>Automated Demo</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-white/10 transition cursor-pointer"
            title="Toggle Full Screen"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">Full Screen</span>
          </button>
        </div>
      </header>

      {/* ══ MAIN BODY CONTENT ══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">

        {/* ── MODE 1: DEMO MENU SELECTOR SCREEN ── */}
        {activeMode === 'menu' && (
          <div className="space-y-8 animate-fade-in my-auto">
            
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-black text-indigo-400 uppercase tracking-widest">
                <Sparkles size={13} /> Official WKF Scoring Board Showcase
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase text-white">
                Interactive Live Demo
              </h1>
              <p className="text-sm font-semibold text-slate-400">
                Experience the real-time KarateTech tournament scoring board in action. Select a demonstration mode below to begin.
              </p>
            </div>

            {/* Two Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              
              {/* Option 1 – Manual Match Demo */}
              <div 
                onClick={() => setActiveMode('manual')}
                className="group relative rounded-3xl border border-red-900/50 bg-gradient-to-b from-[#180505] to-[#0b0202] p-8 hover:border-red-500 transition-all cursor-pointer shadow-2xl hover:scale-[1.02]"
              >
                <div className="h-12 w-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 transition-transform">
                  <Sliders size={24} />
                </div>
                
                <span className="text-xs font-black uppercase tracking-widest text-red-400">OPTION 1</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider mt-1 mb-2">
                  Manual Match Demo
                </h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed mb-6">
                  Take full control of the actual KarateTech scoring board with pre-populated tournament & athlete data.
                </p>

                <div className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-2 text-xs font-bold text-slate-300 mb-6">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Tournament</span>
                    <span className="text-white">KarateTech International Open 2026</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Tatami & Category</span>
                    <span className="text-white">Tatami 1 • Senior Male Kumite -75kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Athletes</span>
                    <span className="text-amber-400">Amir (MAS 🇲🇾) vs Sato (JPN 🇯🇵)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-black uppercase text-red-400 group-hover:translate-x-1 transition-transform">
                  <span>Launch Scoreboard Controls</span>
                  <ExternalLink size={14} />
                </div>
              </div>

              {/* Option 2 – Automated Demo */}
              <div 
                onClick={() => setActiveMode('automated')}
                className="group relative rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#1c1404] to-[#0a0801] p-8 hover:border-amber-400 transition-all cursor-pointer shadow-2xl hover:scale-[1.02]"
              >
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <Play size={24} className="fill-current" />
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-amber-400">OPTION 2</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider mt-1 mb-2">
                  Automated Demo
                </h3>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed mb-6">
                  Showcase 5 WKF match outcomes automatically with full playback media controls (Play, Fast Forward, Replay).
                </p>

                <div className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-1.5 text-xs font-bold text-slate-300 mb-6">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Match 1: Win by Points Advantage
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Match 2: Win by First Unopposed Score (Senshu)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Match 3: Win by Superior Points
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Match 4: Win by Referee Decision (Hantei)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Match 5: Win by Opponent Disqualification (Hansoku)
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 group-hover:translate-x-1 transition-transform">
                  <span>Start Automated Showcase</span>
                  <ExternalLink size={14} />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── MODE 2: MANUAL MATCH DEMO ── */}
        {activeMode === 'manual' && (
          <div className="space-y-4 animate-fade-in my-auto">
            <div className="flex items-center justify-between bg-slate-900/80 border border-white/10 px-5 py-3 rounded-2xl">
              <div>
                <span className="text-xs font-black uppercase text-red-400 tracking-widest">OPTION 1 – MANUAL MATCH DEMO</span>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Interactive Competition Operator View</h3>
              </div>
              <button
                onClick={() => setActiveMode('menu')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            <ScoreboardEngine
              tournamentName="KarateTech International Open 2026"
              tatamiName="Tatami 1"
              categoryName="Senior Male Kumite -75kg"
              roundName="Final"
              aka={{ name: 'Muhammad Amir', country: 'Malaysia 🇲🇾' }}
              ao={{ name: 'Kenji Sato', country: 'Japan 🇯🇵' }}
              initialDuration={180}
              interactive={true}
              soundEnabled={true}
            />
          </div>
        )}

        {/* ── MODE 3: AUTOMATED DEMO ── */}
        {activeMode === 'automated' && (
          <div className="space-y-4 animate-fade-in my-auto">
            <div className="flex items-center justify-between bg-slate-900/80 border border-white/10 px-5 py-3 rounded-2xl">
              <div>
                <span className="text-xs font-black uppercase text-amber-400 tracking-widest">OPTION 2 – AUTOMATED DEMO</span>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">5 WKF Match Outcomes Showcase</h3>
              </div>
              <button
                onClick={() => setActiveMode('menu')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            <AutomatedDemoEngine />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-3 px-6 text-center text-xs font-semibold text-slate-500 shrink-0">
        KarateTech Professional Karate Tournament Management System • SP SportData Solution
      </footer>

    </div>
  );
}
