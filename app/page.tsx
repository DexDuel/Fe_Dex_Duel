"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@onelabs/dapp-kit";
import { CryptoIcon3D } from "@/components/CryptoIcon3D";
import dynamic from "next/dynamic";

const Chart3DHero = dynamic(() => import("@/components/Chart3DHero"), { ssr: false });

/* ─── Isometric Arena Graphic ─────────────────────────────────── */
function ArenaGraphic() {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(59,130,246,0.14) 0%, transparent 70%)"
      }} />
      <svg width="420" height="320" viewBox="0 0 420 320"
        style={{ filter: "drop-shadow(0 0 28px rgba(59,130,246,0.38))" }}>
        <defs>
          <linearGradient id="isoTop"   x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1e40af" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient>
          <linearGradient id="isoLeft"  x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1e3a8a" /><stop offset="100%" stopColor="#1d4ed8" /></linearGradient>
          <linearGradient id="isoRight" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#172554" /><stop offset="100%" stopColor="#1e3a8a" /></linearGradient>
        </defs>

        {/* Base platform */}
        <polygon points="210,280 60,200 210,120 360,200" fill="rgba(30,58,138,0.25)" stroke="rgba(59,130,246,0.35)" strokeWidth="1" />

        {/* Block — back left */}
        <polygon points="130,155 80,183 80,235 130,207"  fill="url(#isoLeft)"  opacity="0.75" />
        <polygon points="130,155 180,183 180,235 130,207" fill="url(#isoRight)" opacity="0.75" />
        <polygon points="80,183 130,155 180,183 130,211"  fill="url(#isoTop)"   opacity="0.75" />
        <polygon points="80,183 130,155 180,183 130,211"  fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />

        {/* Block — center (taller) */}
        <polygon points="210,130 160,158 160,220 210,192" fill="url(#isoLeft)"  opacity="0.95" />
        <polygon points="210,130 260,158 260,220 210,192" fill="url(#isoRight)" opacity="0.95" />
        <polygon points="160,158 210,130 260,158 210,186" fill="url(#isoTop)"   opacity="0.95" />
        <polygon points="160,158 210,130 260,158 210,186" fill="none" stroke="#60a5fa" strokeWidth="1.2" />

        {/* Block — back right */}
        <polygon points="290,155 240,183 240,235 290,207" fill="url(#isoLeft)"  opacity="0.75" />
        <polygon points="290,155 340,183 340,235 290,207" fill="url(#isoRight)" opacity="0.75" />
        <polygon points="240,183 290,155 340,183 290,211" fill="url(#isoTop)"   opacity="0.75" />
        <polygon points="240,183 290,155 340,183 290,211" fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />

        {/* Antenna — center */}
        <line x1="210" y1="130" x2="210" y2="88" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.7" />
        <circle cx="210" cy="83" r="6" fill="#3b82f6" opacity="0.85" />
        <circle cx="210" cy="83" r="14" fill="rgba(59,130,246,0.18)" />

        {/* Antenna — left */}
        <line x1="130" y1="155" x2="130" y2="118" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,4" opacity="0.5" />
        <circle cx="130" cy="113" r="4" fill="#60a5fa" opacity="0.7" />

        {/* Antenna — right */}
        <line x1="290" y1="155" x2="290" y2="118" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,4" opacity="0.5" />
        <circle cx="290" cy="113" r="4" fill="#60a5fa" opacity="0.7" />

        {/* Data connections */}
        <line x1="178" y1="178" x2="160" y2="188" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3,3" opacity="0.45" />
        <line x1="242" y1="178" x2="260" y2="188" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3,3" opacity="0.45" />
        <line x1="210" y1="186" x2="210" y2="220" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" opacity="0.35" />
      </svg>
    </div>
  );
}

/* ─── Ticker ──────────────────────────────────────────────────── */
function TickerContent() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Total Value Locked</span>
        <span className="font-black text-xl" style={{ color: "#3b82f6" }}>$2,450,892.00</span>
      </div>
      <div className="w-1 h-1 rounded-full bg-slate-700" />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Active Rounds</span>
        <span className="text-slate-100 font-black text-xl">14 Live</span>
      </div>
      <div className="w-1 h-1 rounded-full bg-slate-700" />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Total Yield Distributed</span>
        <span className="font-black text-xl" style={{ color: "#0df280" }}>450.22 ETH</span>
      </div>
      <div className="w-1 h-1 rounded-full bg-slate-700" />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">OneChain Status</span>
        <span className="font-black text-xl flex items-center gap-1" style={{ color: "#0df280" }}>
          Online
          <span className="material-symbols-outlined text-sm leading-none">check_circle</span>
        </span>
      </div>
      <div className="w-1 h-1 rounded-full bg-slate-700" />
    </>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const account = useCurrentAccount();
  const router  = useRouter();

  useEffect(() => {
    if (account) router.push("/tournaments");
  }, [account, router]);

  return (
    <div className="relative z-10 text-slate-100 antialiased overflow-x-hidden min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center px-6 overflow-hidden">
        {/* Blue grid */}
        <div className="absolute inset-0 blue-cyber-grid z-0" />

        {/* Star dots (static positions to avoid hydration mismatch) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[
            [8,12],[22,38],[44,7],[63,22],[79,58],[14,73],[34,88],[53,48],[89,18],[4,53],
            [68,78],[46,32],[81,43],[19,63],[58,9],[37,70],[87,28],[11,36],[51,83],[77,14],
            [30,5],[55,62],[72,33],[6,45],[91,67],[42,20],[26,80],[60,55],[85,10],[17,50],
          ].map(([left, top], i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                left: `${left}%`, top: `${top}%`,
                width: i % 5 === 0 ? "2px" : "1px",
                height: i % 5 === 0 ? "2px" : "1px",
                backgroundColor: i % 7 === 0 ? "rgba(59,130,246,0.4)" : "rgba(148,163,184,0.18)",
              }}
            />
          ))}
        </div>

        {/* Ambient glows */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
          style={{ background: "rgba(59,130,246,0.07)", filter: "blur(120px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full z-0 pointer-events-none"
          style={{ background: "rgba(6,182,212,0.05)", filter: "blur(80px)" }} />

        {/* Main content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-20 pb-32">
          {/* Left — copy */}
          <div>
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.28)", color: "#60a5fa" }}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">World&apos;s First Lossless Arena</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[1.05]">
              Unleashing<br />
              the Power<br />
              of{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}>
                DexDuel
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-lg mb-10 leading-relaxed">
              Transforming trading with secure, lossless, and transparent prediction markets. Stake, predict, and win the yield — powered by OneChain.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/tournaments"
                className="px-8 py-4 rounded-lg font-black text-sm uppercase tracking-wider transition-all text-center hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)", color: "#fff", boxShadow: "0 0 24px rgba(59,130,246,0.35)" }}>
                Enter Arena
              </Link>
              <Link href="/tournaments"
                className="px-8 py-4 rounded-lg font-black text-sm uppercase tracking-wider transition-all text-center hover:bg-white/10 active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.18)", color: "#cbd5e1" }}>
                Discover How It Works
              </Link>
            </div>
          </div>

          {/* Right — stat cards float over the WebGL background arm */}
          <div className="hidden lg:block relative h-[580px]">
            {/* 3D candlestick chart in the empty center */}
            <div className="absolute inset-x-0 top-[80px] bottom-[160px] z-10"
              style={{ filter: "drop-shadow(0 0 24px rgba(59,130,246,0.18))" }}>
              <Chart3DHero />
            </div>

            {/* BTC card with 3D coin */}
            <div className="absolute top-10 right-4 z-20 px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: "rgba(0,180,255,0.10)", border: "1px solid rgba(0,180,255,0.25)", backdropFilter: "blur(12px)" }}>
              <CryptoIcon3D symbol="BTC" size={48} />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">BTC / USD</div>
                <div className="text-white font-black text-lg leading-tight">$64,281.50</div>
                <div className="text-green-400 text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>trending_up</span>+2.48%
                </div>
              </div>
            </div>

            {/* Prize Pool card with ETH icon */}
            <div className="absolute bottom-24 left-4 z-20 px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", backdropFilter: "blur(12px)" }}>
              <CryptoIcon3D symbol="ETH" size={48} />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Prize Pool</div>
                <div className="text-cyan-400 font-black text-lg leading-tight">1.42 ETH</div>
                <div className="text-slate-500 text-[10px]">Yield only · Safe</div>
              </div>
            </div>

            <div className="absolute bottom-32 right-4 z-20 px-3 py-2 rounded-xl"
              style={{ background: "rgba(13,242,128,0.07)", border: "1px solid rgba(13,242,128,0.18)", backdropFilter: "blur(12px)" }}>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Win Rate</div>
              <div className="font-black text-lg leading-tight" style={{ color: "#0df280" }}>68%</div>
            </div>
          </div>
        </div>

        {/* Live ticker */}
        <div className="absolute bottom-0 left-0 right-0 z-10 py-4 overflow-hidden whitespace-nowrap"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(2,8,23,0.85)", backdropFilter: "blur(6px)" }}>
          <div className="flex items-center gap-12 animate-marquee">
            <TickerContent />
            <TickerContent />
          </div>
        </div>
      </section>

      {/* ── Why DexDuel? ──────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "rgba(59,130,246,0.05)", filter: "blur(100px)" }} />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Why{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                DexDuel?
              </span>
            </h2>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
              DexDuel is redefining yield in the digital world. Here&apos;s why it matters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "security",  title: "Zero Risk",        desc: "Your principal is always protected. Losers get 100% of their stake back instantly." },
              { icon: "bolt",      title: "Instant Payouts",  desc: "Yield distributed the moment each round closes. No waiting, no delays." },
              { icon: "bar_chart", title: "Transparency",     desc: "Every round, stake, and outcome is fully verifiable on-chain. No black boxes." },
              { icon: "speed",     title: "Efficiency",       desc: "5-minute rounds on OneChain. The fastest prediction market alive." },
            ].map(({ icon, title, desc }) => (
              <div key={title}
                className="p-6 rounded-xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(59,130,246,0.15)",
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)" }}>
                  <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>{icon}</span>
                </div>
                <h3 className="font-black text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How DexDuel Works / Matters ───────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {/* Plus decorators */}
        <span className="absolute left-12 top-16 select-none pointer-events-none"
          style={{ color: "rgba(59,130,246,0.2)", fontSize: "2rem", fontWeight: 100 }}>+</span>
        <span className="absolute right-16 bottom-12 select-none pointer-events-none"
          style={{ color: "rgba(59,130,246,0.2)", fontSize: "2rem", fontWeight: 100 }}>+</span>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left — copy */}
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              Why DexDuel{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                Matters
              </span>
            </h2>
            <p className="text-slate-400 mb-10 leading-relaxed max-w-md">
              DexDuel is revolutionizing how we handle trading and yield. By eliminating principal loss and creating secure, transparent systems, we&apos;re laying the foundation for a fairer financial future.
            </p>
            <Link href="/tournaments"
              className="inline-block px-8 py-4 rounded-lg font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)", color: "#fff", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>
              Enter Arena
            </Link>
          </div>

          {/* Right — isometric graphic */}
          <div className="hidden lg:flex items-center justify-center">
            <ArenaGraphic />
          </div>
        </div>
      </section>

      {/* ── Live Battles ──────────────────────────────────────────── */}
      <section className="py-28 px-6 relative max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              Live{" "}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                Battles
              </span>
            </h2>
            <p className="text-slate-500 font-medium mt-1">Predict the next 5-minute price movement</p>
          </div>
          <Link href="/tournaments"
            className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
            style={{ color: "#3b82f6" }}>
            All Markets
            <span className="material-symbols-outlined leading-none">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* ── BTC ── */}
          <div className="p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(59,130,246,0.2)", borderLeft: "4px solid #3b82f6" }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic">BTC / USD</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Round #48,291</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">$64,281.50</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#3b82f6" }}>Locked Price</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(13,242,128,0.08)", border: "1px solid rgba(13,242,128,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span><span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#3b82f6" }}>1.42 ETH</span>
                  <span className="text-lg font-black">04:12</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── ETH ── */}
          <div className="p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,77,77,0.2)", borderLeft: "4px solid #ff4d4d" }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic">ETH / USD</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Round #12,834</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">$3,421.12</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#ff4d4d" }}>Locked Price</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(13,242,128,0.08)", border: "1px solid rgba(13,242,128,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span><span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#3b82f6" }}>8.15 ETH</span>
                  <span className="text-lg font-black">02:45</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SOL ── */}
          <div className="p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(6,182,212,0.2)", borderLeft: "4px solid #06b6d4" }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic">SOL / USD</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Round #9,402</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">$145.82</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#06b6d4" }}>Locked Price</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(13,242,128,0.08)", border: "1px solid rgba(13,242,128,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.3)" }}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span><span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#06b6d4" }}>24.5 ETH</span>
                  <span className="text-lg font-black">00:58</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Arena Legends & Community ─────────────────────────────── */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Leaderboard */}
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>workspace_premium</span>
              Arena Legends
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <table className="w-full text-left">
                <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <tr style={{ backgroundColor: "rgba(59,130,246,0.06)" }}>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Player</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Win Rate</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Yield Won</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "none" }}>
                  {[
                    { rank: "01", addr: "0x7a...E921", rate: "82%", yield: "12.4 ETH", gold: true },
                    { rank: "02", addr: "0xf1...3B2a", rate: "76%", yield: "8.1 ETH",  gold: false },
                    { rank: "03", addr: "0x98...C11d", rate: "71%", yield: "5.9 ETH",  gold: false },
                  ].map(({ rank, addr, rate, yield: y, gold }) => (
                    <tr key={rank}
                      className="transition-colors"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ backgroundColor: gold ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.08)" }}>
                            {rank}
                          </div>
                          <span className="font-bold text-sm tracking-tight">{addr}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: "#3b82f6" }}>{rate}</td>
                      <td className="px-6 py-4 text-sm font-black text-right">{y}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Community CTA */}
          <div className="flex flex-col justify-center">
            <div className="p-8 rounded-2xl relative overflow-hidden group"
              style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: "7.5rem", color: "#3b82f6" }}>hub</span>
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-4">Join the Collective</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Join 50,000+ players in the Arena Discord. Get real-time alerts, market insights,
                and participate in governance voting for the next OneChain features.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all text-white hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)", boxShadow: "0 0 16px rgba(59,130,246,0.3)" }}>
                  Join Discord
                </button>
                <button className="px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all text-white hover:bg-white/20"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Follow @DexDuel
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
            <span className="material-symbols-outlined text-2xl" style={{ color: "#3b82f6" }}>swords</span>
            <span className="text-sm font-black tracking-tighter uppercase italic">DexDuel</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-slate-500"
            style={{ letterSpacing: "0.2em" }}>
            {["Audit Report", "Privacy Policy", "Terms of Service", "OneChain Explorer"].map((l) => (
              <a key={l} href="#" className="hover:text-blue-400 transition-colors">{l}</a>
            ))}
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            © 2025 DexDuel. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
