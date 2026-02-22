"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentAccount, ConnectButton } from "@onelabs/dapp-kit";

const ACTIVE_CARDS = [
  {
    coin: "BTC / USDT", icon: "currency_bitcoin", timer: "04:12", staked: "100 USDC",
    startPrice: "$64,231.50", direction: "UP" as const, points: "+120 pts",
  },
  {
    coin: "ETH / USDT", icon: "eco", timer: "12:45", staked: "250 USDC",
    startPrice: "$3,412.18", direction: "DOWN" as const, points: "+350 pts",
  },
];

const HISTORY = [
  { symbol: "BTC", name: "Bitcoin",   round: "#8842", startPrice: "$63,112.40", endPrice: "$64,021.15", dir: "UP"   as const, result: "Win"  as const, points: "+420 pts" },
  { symbol: "SOL", name: "Solana",    round: "#8841", startPrice: "$142.15",    endPrice: "$138.90",    dir: "UP"   as const, result: "Loss" as const, points: "0 pts"    },
  { symbol: "ETH", name: "Ethereum",  round: "#8839", startPrice: "$3,240.55",  endPrice: "$3,190.20",  dir: "DOWN" as const, result: "Win"  as const, points: "+280 pts" },
];

export default function ProfilePage() {
  const account = useCurrentAccount();
  const [tab, setTab] = useState<"active" | "settled">("active");

  return (
    <div className="relative flex flex-col w-full min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#102219", color: "#f1f5f9" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full"
        style={{ borderBottom: "1px solid rgba(13,242,128,0.1)", backgroundColor: "rgba(16,34,25,0.8)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontSize: "30px", color: "#0df280" }}>query_stats</span>
              <h1 className="text-xl font-bold tracking-tight text-white">GameFi Prediction Arena</h1>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/arena" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">Arena</Link>
              <span className="text-sm font-bold pt-1" style={{ color: "#0df280", borderBottom: "2px solid #0df280" }}>My Arena</span>
              <Link href="/leaderboard" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">Leaderboard</Link>
              <a href="#" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">Docs</a>
            </nav>
            <div className="flex items-center gap-4">
              {account ? (
                <>
                  <button className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:opacity-80"
                    style={{ backgroundColor: "#0df280", color: "#102219" }}>
                    <span className="material-symbols-outlined leading-none" style={{ fontSize: "18px" }}>account_balance_wallet</span>
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </button>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ border: "2px solid rgba(13,242,128,0.3)", backgroundColor: "#1e293b" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#0df280" }}>person</span>
                  </div>
                </>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-4xl font-black tracking-tight text-white">My Arena</h2>
              <p className="max-w-lg" style={{ color: "rgba(13,242,128,0.6)" }}>
                Manage your lossless predictions and track your climbing performance on OneChain.
              </p>
            </div>
            <button className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all self-start hover:opacity-80"
              style={{ backgroundColor: "rgba(13,242,128,0.1)", color: "#0df280", border: "1px solid rgba(13,242,128,0.3)" }}>
              <span className="material-symbols-outlined leading-none">payments</span>
              Withdraw Principal
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Staked Principal */}
          <div className="glass-panel-light p-6 rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform" style={{ color: "#0df280" }}>
              <span className="material-symbols-outlined leading-none" style={{ fontSize: "60px" }}>lock</span>
            </div>
            <p className="text-sm font-medium text-slate-400">Staked Principal</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">1,250.00</span>
              <span className="font-bold" style={{ color: "#0df280" }}>USDC</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs w-fit px-2 py-1 rounded" style={{ color: "#0df280", backgroundColor: "rgba(13,242,128,0.1)" }}>
              <span className="material-symbols-outlined leading-none" style={{ fontSize: "14px" }}>verified_user</span>
              100% Lossless Guarantee
            </div>
          </div>

          {/* Total Points */}
          <div className="glass-panel-light p-6 rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform" style={{ color: "#0df280" }}>
              <span className="material-symbols-outlined leading-none" style={{ fontSize: "60px" }}>military_tech</span>
            </div>
            <p className="text-sm font-medium text-slate-400">Total Points</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">4,850</span>
              <span className="font-bold" style={{ color: "#0df280" }}>PTS</span>
            </div>
            <div className="mt-4 text-xs text-slate-400">Ranked #412 in World Arena</div>
          </div>

          {/* Win Rate */}
          <div className="glass-panel-light p-6 rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform" style={{ color: "#0df280" }}>
              <span className="material-symbols-outlined leading-none" style={{ fontSize: "60px" }}>show_chart</span>
            </div>
            <p className="text-sm font-medium text-slate-400">Win Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">68%</span>
            </div>
            <div className="mt-4 w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
              <div className="h-full rounded-full" style={{ width: "68%", backgroundColor: "#0df280", boxShadow: "0 0 10px rgba(13,242,128,0.5)" }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex gap-8" style={{ borderBottom: "1px solid rgba(13,242,128,0.1)" }}>
            <button onClick={() => setTab("active")}
              className="pb-4 font-bold text-sm tracking-wide flex items-center gap-2 transition-colors"
              style={{ borderBottom: tab === "active" ? "2px solid #0df280" : "2px solid transparent", color: tab === "active" ? "#0df280" : "#64748b" }}>
              <span className="material-symbols-outlined leading-none text-lg">bolt</span>
              Active Predictions
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black" style={{ backgroundColor: "#0df280", color: "#102219" }}>3</span>
            </button>
            <button onClick={() => setTab("settled")}
              className="pb-4 font-bold text-sm tracking-wide flex items-center gap-2 transition-colors"
              style={{ borderBottom: tab === "settled" ? "2px solid #0df280" : "2px solid transparent", color: tab === "settled" ? "#0df280" : "#64748b" }}>
              <span className="material-symbols-outlined leading-none text-lg">history</span>
              Settled Rounds
            </button>
          </div>

          {/* Active Prediction Cards */}
          {tab === "active" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ACTIVE_CARDS.map((card) => (
                <div key={card.coin} className="glass-panel-light rounded-xl p-5 flex flex-col gap-4"
                  style={{ borderLeft: "4px solid #0df280" }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#1e293b", border: "1px solid rgba(13,242,128,0.2)" }}>
                        <span className="material-symbols-outlined leading-none" style={{ color: "#0df280", fontSize: "20px" }}>{card.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold">{card.coin}</h4>
                        <p className="text-xs text-slate-500">Starts in: {card.timer}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-black px-2 py-1 rounded"
                        style={{ backgroundColor: "rgba(13,242,128,0.2)", color: "#0df280" }}>Live Round</span>
                      <span className="text-sm font-medium mt-1">Staked: {card.staked}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2" style={{ borderTop: "1px solid rgba(13,242,128,0.05)" }}>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Start Price</p>
                      <p className="text-sm font-mono">{card.startPrice}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Prediction</p>
                      <p className="text-sm font-bold flex items-center gap-1"
                        style={{ color: card.direction === "UP" ? "#0df280" : "#f87171" }}>
                        <span className="material-symbols-outlined leading-none" style={{ fontSize: "14px", transform: card.direction === "DOWN" ? "rotate(180deg)" : undefined }}>
                          trending_up
                        </span>
                        {card.direction}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Est. Points</p>
                      <p className="text-sm font-bold">{card.points}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent History */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Recent History</h3>
              <button className="text-xs font-bold hover:underline" style={{ color: "#0df280" }}>View All History</button>
            </div>
            <div className="overflow-x-auto rounded-xl glass-panel-light">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(13,242,128,0.1)" }}>
                    {["Coin/Round", "Start Price", "End Price", "Prediction", "Result", "Points"].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-[10px] uppercase font-black text-slate-500 ${i === 5 ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORY.map((row, idx) => (
                    <tr key={row.round}
                      className="transition-colors"
                      style={{ borderBottom: idx < HISTORY.length - 1 ? "1px solid rgba(13,242,128,0.05)" : "none" }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(13,242,128,0.05)")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: "#1e293b", color: "#0df280" }}>{row.symbol}</div>
                          <div>
                            <p className="font-bold text-sm">{row.name}</p>
                            <p className="text-[10px] text-slate-500">Round {row.round}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">{row.startPrice}</td>
                      <td className="px-6 py-4 font-mono text-sm">{row.endPrice}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1"
                          style={row.dir === "UP"
                            ? { color: "#0df280", backgroundColor: "rgba(13,242,128,0.1)" }
                            : { color: "#f87171", backgroundColor: "rgba(248,113,113,0.1)" }}>
                          <span className="material-symbols-outlined leading-none" style={{ fontSize: "14px", transform: row.dir === "DOWN" ? "rotate(180deg)" : undefined }}>
                            trending_up
                          </span>
                          {row.dir}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {row.result === "Win"
                          ? <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded" style={{ backgroundColor: "#0df280", color: "#102219" }}>Win</span>
                          : <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded" style={{ backgroundColor: "#334155", color: "#cbd5e1" }}>Loss</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-bold"
                        style={{ color: row.result === "Win" ? "#0df280" : "#64748b" }}>
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8" style={{ borderTop: "1px solid rgba(13,242,128,0.05)", backgroundColor: "rgba(0,0,0,0.2)" }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined leading-none" style={{ fontSize: "14px" }}>security</span>
            Secured by OneChain Protocol
          </p>
        </div>
      </footer>
    </div>
  );
}
