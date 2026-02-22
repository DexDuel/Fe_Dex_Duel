"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton, useCurrentAccount } from "@onelabs/dapp-kit";

const CHART_BARS = [
  { up: true,  h: "40%" },
  { up: false, h: "35%" },
  { up: true,  h: "50%" },
  { up: true,  h: "65%" },
  { up: false, h: "55%" },
  { up: true,  h: "70%" },
  { up: true,  h: "85%" },
];

const TIMEFRAMES = ["1M", "5M", "15M", "1H"];

export default function ArenaPage() {
  const account = useCurrentAccount();
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [timeframe, setTimeframe] = useState("1M");
  const [stake, setStake] = useState("");

  const balance = 1240.50;
  const payout = stake && parseFloat(stake) > 0
    ? (parseFloat(stake) * (direction === "up" ? 1.84 : 2.12)).toFixed(2)
    : "0.00";

  return (
    <div style={{ backgroundColor: "#102219" }}
      className="flex flex-col h-screen text-slate-100 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0 sticky top-0 z-50"
        style={{ backgroundColor: "#102219", borderBottom: "1px solid rgba(13,242,128,0.1)" }}>
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: "#0df280" }}>
              <span className="material-symbols-outlined font-bold text-lg leading-none"
                style={{ color: "#102219", fontSize: "20px" }}>query_stats</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">GameFi Prediction Arena</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <span className="text-sm font-medium pb-1"
              style={{ color: "#0df280", borderBottom: "2px solid #0df280" }}>Arena</span>
            <Link href="/leaderboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/profile" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">History</Link>
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Docs</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(13,242,128,0.1)", border: "1px solid rgba(13,242,128,0.2)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#0df280" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0df280" }}>OneChain Mainnet</span>
          </div>
          {account ? (
            <div className="flex items-center gap-2 p-1 rounded-lg"
              style={{ backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid #334155" }}>
              <span className="px-3 text-sm font-bold text-slate-100">1,240.50 USDC</span>
              <div className="px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all"
                style={{ backgroundColor: "#0df280", color: "#102219" }}>
                <span className="material-symbols-outlined leading-none" style={{ fontSize: "16px" }}>account_balance_wallet</span>
                {account.address.slice(0, 4)}...{account.address.slice(-4)}
              </div>
            </div>
          ) : (
            <ConnectButton />
          )}
        </div>
      </header>

      {/* ── Main 2-pane ─────────────────────────────────────────── */}
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* Left: Chart pane */}
        <div className="flex-1 flex flex-col relative"
          style={{ borderRight: "1px solid #1e293b", backgroundColor: "rgba(16,34,25,0.5)" }}>

          {/* Market header */}
          <div className="p-4 flex items-center justify-between shrink-0"
            style={{ borderBottom: "1px solid #1e293b" }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white leading-none" style={{ fontSize: "18px" }}>currency_bitcoin</span>
                </div>
                <div>
                  <div className="text-sm font-bold">BTC / USDC</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Bitcoin Price Arena</div>
                </div>
              </div>
              <div className="h-8 w-px mx-2" style={{ backgroundColor: "#1e293b" }} />
              <div>
                <div className="text-lg font-bold" style={{ color: "#0df280" }}>$64,231.42</div>
                <div className="text-xs flex items-center gap-1" style={{ color: "#0df280" }}>
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: "12px" }}>trending_up</span>
                  +2.41%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg p-1" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
                {TIMEFRAMES.map((tf) => (
                  <button key={tf} onClick={() => setTimeframe(tf)}
                    className="px-3 py-1 text-xs font-bold rounded transition-colors"
                    style={timeframe === tf
                      ? { backgroundColor: "#1e293b", color: "#ffffff" }
                      : { color: "#64748b" }}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart area */}
          <div className="flex-1 relative chart-grid overflow-hidden">
            {/* Abstract bars */}
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <div className="w-full h-2/3 flex items-end gap-1 opacity-40">
                {CHART_BARS.map((bar, i) => (
                  <div key={i} className="flex-1"
                    style={{
                      height: bar.h,
                      backgroundColor: bar.up ? "rgba(13,242,128,0.2)" : "rgba(255,77,77,0.2)",
                      borderTop: `2px solid ${bar.up ? "#0df280" : "#ff4d4d"}`,
                    }} />
                ))}
              </div>
            </div>

            {/* Floating timer */}
            <div className="absolute top-6 right-6 p-4 rounded-xl shadow-2xl z-10"
              style={{ backgroundColor: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(13,242,128,0.3)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#0df280" }}>Next Round In</div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-white">04</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Min</span>
                </div>
                <span className="text-3xl font-black animate-pulse" style={{ color: "#0df280" }}>:</span>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-white">59</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Sec</span>
                </div>
              </div>
            </div>

            {/* Whale alert */}
            <div className="absolute left-6 bottom-6 p-3 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: "rgba(15,23,42,0.8)", border: "1px solid #334155" }}>
              <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: "#0df280" }} />
              <span className="text-xs font-medium">
                New whale entry: <span style={{ color: "#0df280" }}>24,000 USDC</span> on UP
              </span>
            </div>
          </div>

          {/* Active Positions footer */}
          <div className="p-4 shrink-0" style={{ backgroundColor: "rgba(15,23,42,0.8)", borderTop: "1px solid #1e293b" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined leading-none" style={{ color: "#0df280", fontSize: "16px" }}>history</span>
                Active Positions
              </h3>
              <span className="text-[10px] text-slate-500">Auto-refreshing...</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Side",        value: "UP",           valueStyle: { color: "#0df280" }, icon: "arrow_upward" },
                { label: "Staked",      value: "100.00 USDC",  valueStyle: { color: "#ffffff" }, icon: null },
                { label: "Entry Price", value: "$64,192.10",   valueStyle: { color: "#ffffff" }, icon: null },
                { label: "Est. Payout", value: "184.20 USDC",  valueStyle: { color: "#0df280" }, icon: null },
              ].map((col) => (
                <div key={col.label} className="p-3 rounded-lg flex flex-col"
                  style={{ backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid #334155" }}>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{col.label}</span>
                  <span className="font-bold flex items-center gap-1" style={col.valueStyle}>
                    {col.icon && <span className="material-symbols-outlined leading-none" style={{ fontSize: "14px" }}>{col.icon}</span>}
                    {col.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Prediction panel */}
        <aside className="w-full lg:w-[400px] flex flex-col overflow-y-auto"
          style={{ backgroundColor: "rgba(15,23,42,0.3)" }}>
          <div className="p-6 flex-1">
            <div className="mb-8">
              <h2 className="text-xl font-black text-white mb-2">Predict &amp; Earn</h2>
              <p className="text-sm text-slate-400">
                Join the battle. If BTC price ends higher or lower in 5 minutes, you share the pool.
              </p>
            </div>

            {/* UP / DOWN toggles */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* UP */}
              <button onClick={() => setDirection("up")} className="relative p-4 rounded-xl text-left transition-all"
                style={direction === "up"
                  ? { border: "2px solid #0df280", backgroundColor: "rgba(13,242,128,0.05)" }
                  : { border: "2px solid #1e293b", backgroundColor: "rgba(30,41,59,0.2)" }}>
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: "2rem", color: "#0df280" }}>trending_up</span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ backgroundColor: "rgba(13,242,128,0.2)", color: "#0df280" }}>1.84x</span>
                </div>
                <div className="text-lg font-black text-white">UP</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Pool: 45.2K USDC</div>
                {direction === "up" && (
                  <div className="absolute -top-2 -right-2">
                    <span className="material-symbols-outlined fill-1" style={{ color: "#0df280", fontSize: "20px" }}>check_circle</span>
                  </div>
                )}
              </button>

              {/* DOWN */}
              <button onClick={() => setDirection("down")} className="p-4 rounded-xl text-left transition-all"
                style={direction === "down"
                  ? { border: "2px solid #ff4d4d", backgroundColor: "rgba(255,77,77,0.05)" }
                  : { border: "2px solid #1e293b", backgroundColor: "rgba(30,41,59,0.2)" }}>
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: "2rem", color: "#ff4d4d" }}>trending_down</span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ backgroundColor: "rgba(255,77,77,0.2)", color: "#ff4d4d" }}>2.12x</span>
                </div>
                <div className="text-lg font-black text-white">DOWN</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Pool: 38.1K USDC</div>
              </button>
            </div>

            {/* Stake input */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stake Amount</label>
                  <span className="text-xs text-slate-500">Balance: {balance.toLocaleString()} USDC</span>
                </div>
                <div className="relative">
                  <input type="number" placeholder="0.00" value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className="w-full py-4 px-4 text-white text-xl font-bold rounded-lg focus:outline-none transition-all"
                    style={{ backgroundColor: "rgba(30,41,59,0.5)", border: "1px solid #334155" }} />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">USDC</div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[25, 50, 75].map((pct) => (
                    <button key={pct}
                      onClick={() => setStake(((balance * pct) / 100).toFixed(2))}
                      className="py-2 rounded text-[10px] font-bold uppercase text-slate-400 transition-colors hover:text-white"
                      style={{ backgroundColor: "#1e293b" }}>
                      {pct}%
                    </button>
                  ))}
                  <button onClick={() => setStake(balance.toFixed(2))}
                    className="py-2 rounded text-[10px] font-bold uppercase transition-colors"
                    style={{ backgroundColor: "rgba(13,242,128,0.1)", color: "#0df280", border: "1px solid rgba(13,242,128,0.3)" }}>
                    Max
                  </button>
                </div>
              </div>

              {/* Pool stats */}
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "rgba(30,41,59,0.3)", border: "1px solid #1e293b" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Pool Size</span>
                  <span className="text-white font-bold">83,300 USDC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Protocol Fee (Lossless)</span>
                  <span className="font-bold" style={{ color: "#0df280" }}>0.00%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Network Fee</span>
                  <span className="text-white font-bold">~0.02 USDC</span>
                </div>
                <div className="pt-2 flex justify-between" style={{ borderTop: "1px solid #1e293b" }}>
                  <span className="text-sm font-bold">Your Win Payout</span>
                  <span className="text-lg font-black" style={{ color: "#0df280" }}>{payout} USDC</span>
                </div>
              </div>

              {/* Confirm button */}
              <button
                disabled={!stake || parseFloat(stake) <= 0}
                className="w-full py-5 rounded-xl text-lg font-black tracking-tight transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: "#0df280", color: "#102219", boxShadow: "0 0 20px rgba(13,242,128,0.3)" }}>
                <span className="material-symbols-outlined leading-none">bolt</span>
                CONFIRM PREDICTION
              </button>

              {/* Lossless info */}
              <div className="flex items-start gap-3 p-4 rounded-lg"
                style={{ backgroundColor: "rgba(13,242,128,0.05)", border: "1px solid rgba(13,242,128,0.1)" }}>
                <span className="material-symbols-outlined mt-0.5 leading-none text-lg" style={{ color: "#0df280" }}>verified_user</span>
                <div>
                  <p className="text-[11px] font-bold uppercase mb-1" style={{ color: "#0df280" }}>Lossless Mechanic Enabled</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Your principal is protected by OneChain yield generation. Only yield is used for the prediction pool.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 shrink-0" style={{ borderTop: "1px solid #1e293b", backgroundColor: "#102219" }}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
              <span>24H Volume</span>
              <span className="text-white">2.4M USDC</span>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 px-6 py-4 flex justify-around z-50"
        style={{ backgroundColor: "#102219", borderTop: "1px solid #1e293b" }}>
        {[
          { icon: "query_stats", label: "Arena",     href: "/arena",       active: true },
          { icon: "leaderboard", label: "Rank",      href: "/leaderboard", active: false },
          { icon: "history",     label: "History",   href: "/profile",     active: false },
          { icon: "settings",    label: "Set",       href: "#",            active: false },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            className="flex flex-col items-center gap-1"
            style={{ color: item.active ? "#0df280" : "#64748b" }}>
            <span className="material-symbols-outlined leading-none" style={{ fontSize: "24px" }}>{item.icon}</span>
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
