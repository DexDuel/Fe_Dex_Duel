"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@onelabs/dapp-kit";

/* ─── Ticker items (duplicated in JSX for seamless loop) ────────── */
function TickerContent() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Total Value Locked</span>
        <span className="font-black text-xl" style={{ color: "#0df280" }}>$2,450,892.00</span>
      </div>
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#334155" }} />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Active Rounds</span>
        <span className="text-slate-100 font-black text-xl">14 Live</span>
      </div>
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#334155" }} />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">Total Yield Distributed</span>
        <span className="font-black text-xl" style={{ color: "#3b82f6" }}>450.22 ETH</span>
      </div>
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#334155" }} />
      <div className="flex items-center gap-3">
        <span className="text-slate-500 uppercase text-xs font-bold tracking-widest">OneChain Status</span>
        <span className="font-black text-xl flex items-center gap-1" style={{ color: "#0df280" }}>
          Online
          <span className="material-symbols-outlined text-sm leading-none">check_circle</span>
        </span>
      </div>
      {/* spacer so loop seam is invisible */}
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#334155" }} />
    </>
  );
}

export default function LandingPage() {
  const account = useCurrentAccount();
  const router  = useRouter();

  // Redirect to app after wallet connects
  useEffect(() => {
    if (account) router.push("/tournaments");
  }, [account, router]);

  return (
    <div style={{ backgroundColor: "#0a0a0a" }} className="text-slate-100 antialiased overflow-x-hidden min-h-screen">

      {/* ── Top Navigation ──────────────────────────────────────── */}


      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex flex-col justify-center items-center overflow-hidden">
        {/* Cyber grid */}
        <div className="absolute inset-0 cyber-grid z-0" />
        {/* Glow blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full z-0"
          style={{ backgroundColor: "rgba(13,242,128,0.1)", filter: "blur(120px)" }} />

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8"
            style={{ backgroundColor: "rgba(13,242,128,0.1)", border: "1px solid rgba(13,242,128,0.2)", color: "#0df280" }}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: "#0df280" }} />
              <span className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: "#0df280" }} />
            </span>
            <span className="text-[10px] font-bold uppercase" style={{ letterSpacing: "0.3em" }}>
              The World&apos;s First Lossless Arena
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 uppercase italic leading-none">
            Where{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-accent-blue">
              Losing
            </span>
            <br />
            Doesn&apos;t Exist
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-medium">
            Stake, Predict, and Win the Yield. Zero-risk principal, instant payouts, and powered by
            the speed of OneChain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tournaments"
              style={{ backgroundColor: "#0df280", color: "#0a0a0a" }}
              className="px-10 py-5 rounded-lg font-black text-lg uppercase italic tracking-wider glow-primary hover:scale-105 transition-transform">
              Enter Arena
            </Link>
            <Link href="/tournaments"
              className="bg-transparent border-2 border-white/20 hover:border-white/40 px-10 py-5 rounded-lg font-black text-lg uppercase italic tracking-wider transition-all">
              View Markets
            </Link>
          </div>
        </div>

        {/* Live stats ticker — seamless loop: render content twice */}
        <div className="relative z-10 w-full mt-24 py-4 overflow-hidden whitespace-nowrap"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            backgroundColor: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(4px)",
          }}>
          <div className="flex items-center gap-12 animate-marquee">
            <TickerContent />
            <TickerContent />
          </div>
        </div>
      </section>

      {/* ── Live Battles ────────────────────────────────────────── */}
      <section className="py-24 px-6 relative max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              Live <span style={{ color: "#0df280" }}>Battles</span>
            </h2>
            <p className="text-slate-500 font-medium">Predict the next 5-minute price movement</p>
          </div>
          <Link href="/tournaments"
            style={{ color: "#0df280" }}
            className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
            All Markets
            <span className="material-symbols-outlined leading-none">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* ── BTC Card ── */}
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden group"
            style={{ borderLeft: "4px solid #0df280" }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">currency_bitcoin</span>
            </div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic">BTC / USD</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Round #48,291</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">$64,281.50</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#0df280" }}>Locked Price</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all"
                  style={{ backgroundColor: "rgba(13,242,128,0.1)", border: "1px solid rgba(13,242,128,0.3)" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(13,242,128,0.2)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(13,242,128,0.1)")}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all"
                  style={{ backgroundColor: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,77,77,0.2)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,77,77,0.1)")}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span>
                  <span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#3b82f6" }}>1.42 ETH</span>
                  <span className="text-lg font-black">04:12</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── ETH Card ── */}
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden group"
            style={{ borderLeft: "4px solid #ff4d4d" }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">currency_bitcoin</span>
            </div>
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
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all"
                  style={{ backgroundColor: "rgba(13,242,128,0.1)", border: "1px solid rgba(13,242,128,0.3)" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(13,242,128,0.2)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(13,242,128,0.1)")}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all"
                  style={{ backgroundColor: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,77,77,0.2)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,77,77,0.1)")}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span>
                  <span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#3b82f6" }}>8.15 ETH</span>
                  <span className="text-lg font-black">02:45</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SOL Card ── */}
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden group"
            style={{ borderLeft: "4px solid #3b82f6" }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
            </div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic">SOL / USD</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Round #9,402</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">$145.82</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#3b82f6" }}>Locked Price</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all"
                  style={{ backgroundColor: "rgba(13,242,128,0.1)", border: "1px solid rgba(13,242,128,0.3)" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(13,242,128,0.2)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(13,242,128,0.1)")}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#0df280" }}>trending_up</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#0df280" }}>Predict UP</span>
                </button>
                <button className="flex-1 py-4 rounded-lg flex flex-col items-center transition-all"
                  style={{ backgroundColor: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,77,77,0.2)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,77,77,0.1)")}>
                  <span className="material-symbols-outlined mb-1" style={{ color: "#ff4d4d" }}>trending_down</span>
                  <span className="font-black uppercase text-xs" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                </button>
              </div>
              <div className="rounded p-3" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Prize Pool Yield</span>
                  <span>Ends In</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black" style={{ color: "#3b82f6" }}>24.5 ETH</span>
                  <span className="text-lg font-black">00:58</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="py-24 px-6 relative bg-white/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
              How The <span style={{ color: "#0df280" }}>Arena</span> Works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Our unique lossless model ensures you never lose your principal investment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow-primary"
                style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(13,242,128,0.3)" }}>
                <span className="material-symbols-outlined text-4xl" style={{ color: "#0df280" }}>cached</span>
              </div>
              <h3 className="text-xl font-black uppercase italic mb-3">1. Stake Your Assets</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Deposit tokens into our audited OneChain vaults. Your principal is cryptographically
                secured and never leaves the vault.
              </p>
            </div>
            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(59,130,246,0.3)" }}>
                <span className="material-symbols-outlined text-4xl" style={{ color: "#3b82f6" }}>query_stats</span>
              </div>
              <h3 className="text-xl font-black uppercase italic mb-3">2. Predict the Market</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Choose UP or DOWN for the next round. Your stake remains protected while it generates
                yield in the background.
              </p>
            </div>
            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,77,77,0.3)" }}>
                <span className="material-symbols-outlined text-4xl" style={{ color: "#ff4d4d" }}>military_tech</span>
              </div>
              <h3 className="text-xl font-black uppercase italic mb-3">3. Claim the Yield</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Winners split the yield generated by the pool. Losers get 100% of their principal
                back instantly. Zero risk, pure game.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Leaderboard & Social ─────────────────────────────────── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Arena Legends table */}
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: "#0df280" }}>workspace_premium</span>
              Arena Legends
            </h2>
            <div className="glass-panel rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Player</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Win Rate</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Yield Won</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: "rgba(13,242,128,0.2)" }}>01</div>
                        <span className="font-bold text-sm tracking-tight">0x7a...E921</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: "#0df280" }}>82%</td>
                    <td className="px-6 py-4 text-sm font-black text-right">12.4 ETH</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>02</div>
                        <span className="font-bold text-sm tracking-tight">0xf1...3B2a</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: "#0df280" }}>76%</td>
                    <td className="px-6 py-4 text-sm font-black text-right">8.1 ETH</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>03</div>
                        <span className="font-bold text-sm tracking-tight">0x98...C11d</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: "#0df280" }}>71%</td>
                    <td className="px-6 py-4 text-sm font-black text-right">5.9 ETH</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Join the Collective */}
          <div className="flex flex-col justify-center">
            <div className="p-8 rounded-2xl relative overflow-hidden group"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined" style={{ fontSize: "7.5rem" }}>hub</span>
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-4">Join the Collective</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Join 50,000+ players in the Arena Discord. Get real-time alerts, market insights,
                and participate in governance voting for the next OneChain features.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all text-white hover:opacity-80"
                  style={{ backgroundColor: "#3b82f6" }}>
                  Join Discord
                </button>
                <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all text-white">
                  Follow @Arena
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-2xl" style={{ color: "#0df280" }}>swords</span>
            <span className="text-sm font-black tracking-tighter uppercase italic">GameFi Arena</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-slate-500"
            style={{ letterSpacing: "0.2em" }}>
            {["Audit Report", "Privacy Policy", "Terms of Service", "OneChain Explorer"].map((l) => (
              <a key={l} href="#" className="hover:text-primary transition-colors">{l}</a>
            ))}
          </div>
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            © 2024 GameFi Prediction Arena.
          </div>
        </div>
      </footer>
    </div>
  );
}
