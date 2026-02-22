"use client";

import { useState } from "react";
import Link from "next/link";

const NAV = [
  { icon: "grid_view",       label: "Dashboard",    href: "/" },
  { icon: "swords",          label: "Battles",       href: "/arena" },
  { icon: "leaderboard",     label: "Leaderboard",   href: "/leaderboard", active: true },
  { icon: "redeem",          label: "Rewards",       href: "#" },
  { icon: "account_circle",  label: "Profile",       href: "/profile" },
];

const TABLE_ROWS = [
  { rank: 1,  rankStyle: { color: "#facc15" },   name: "player.one",     wins: 214, streak: 14, points: 12450 },
  { rank: 2,  rankStyle: { color: "#cbd5e1" },   name: "cryptoking.one", wins: 128, streak: 8,  points: 8920  },
  { rank: 3,  rankStyle: { color: "#c2410c" },   name: "victory.one",    wins: 104, streak: 5,  points: 7810  },
  { rank: 4,  rankStyle: { color: "#64748b" },   name: "degen_samurai",  wins: 92,  streak: 0,  points: 6550  },
  { rank: 5,  rankStyle: { color: "#64748b" },   name: "moonshot_alice", wins: 88,  streak: 11, points: 6420  },
  { rank: 6,  rankStyle: { color: "#64748b" },   name: "zero_loss.one",  wins: 81,  streak: 0,  points: 5900  },
  { rank: 7,  rankStyle: { color: "#64748b" },   name: "chain_rebel",    wins: 76,  streak: 4,  points: 5100  },
];

export default function LeaderboardPage() {
  const [filter, setFilter] = useState<"Global" | "Friends" | "My Guild">("Global");
  const [search, setSearch] = useState("");

  const filtered = search
    ? TABLE_ROWS.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : TABLE_ROWS;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0a0d0c", color: "#f1f5f9" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col"
        style={{ backgroundColor: "#121a16", borderRight: "1px solid #1a2e24" }}>
        <div className="p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#0df280" }}>
              <span className="material-symbols-outlined font-bold leading-none"
                style={{ color: "#0a0d0c", fontSize: "22px" }}>query_stats</span>
            </div>
            <div>
              <h1 className="text-white text-base font-bold leading-none">GameFi Arena</h1>
              <p className="text-[10px] font-bold uppercase mt-1" style={{ color: "#0df280", letterSpacing: "0.1em" }}>
                OneChain Edition
              </p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                style={item.active
                  ? { backgroundColor: "rgba(13,242,128,0.1)", color: "#0df280", border: "1px solid rgba(13,242,128,0.2)" }
                  : { color: "#94a3b8" }}
                onMouseOver={(e) => { if (!item.active) { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.backgroundColor = "#1a2e24"; } }}
                onMouseOut={(e) => { if (!item.active) { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.backgroundColor = "transparent"; } }}>
                <span className="material-symbols-outlined leading-none" style={{ fontSize: "22px" }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Rank progress + Join Battle */}
        <div className="mt-auto p-6">
          <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(26,46,36,0.5)", border: "1px solid #1a2e24" }}>
            <p className="text-slate-400 text-xs mb-1">Your Rank</p>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-2xl font-bold text-white">#1,242</span>
              <span className="text-xs font-medium mb-1" style={{ color: "#0df280" }}>Top 15%</span>
            </div>
            <div className="w-full rounded-full h-1.5 mb-2" style={{ backgroundColor: "#0a0d0c" }}>
              <div className="h-1.5 rounded-full" style={{ width: "65%", backgroundColor: "#0df280" }} />
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">240 PTS to next rank</p>
          </div>
          <Link href="/arena"
            className="w-full mt-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: "#0df280", color: "#0a0d0c", display: "flex" }}>
            <span className="material-symbols-outlined leading-none text-lg">bolt</span>
            Join Battle
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto"
        style={{ backgroundColor: "#0a0d0c", scrollbarWidth: "thin", scrollbarColor: "#1a2e24 transparent" }}>

        {/* Header */}
        <header className="p-8 pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Seasonal Leaderboard</h2>
              <p className="text-slate-400 mt-1">Compete for the lossless yield prize pool of Season 4.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none p-4 rounded-xl flex flex-col justify-center"
                style={{ backgroundColor: "#121a16", border: "1px solid #1a2e24" }}>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 leading-none">Yield Prize Pool</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white">15,400.00</span>
                  <span className="text-sm font-bold" style={{ color: "#0df280" }}>USDC</span>
                </div>
              </div>
              <div className="flex-1 md:flex-none p-4 rounded-xl flex flex-col justify-center"
                style={{ backgroundColor: "#121a16", border: "1px solid #1a2e24" }}>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 leading-none">Season Ends In</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white">04d : 12h : 30m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

            {/* 2nd place — Silver */}
            <div className="relative order-2 md:order-1 rounded-2xl p-6 flex flex-col items-center silver-glow"
              style={{ backgroundColor: "#121a16", border: "1px solid #1a2e24" }}>
              <div className="absolute -top-4 text-[#0a0d0c] text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest"
                style={{ backgroundColor: "#94a3b8" }}>Silver</div>
              <div className="w-20 h-20 rounded-full p-1 mb-4 flex items-center justify-center"
                style={{ border: "4px solid rgba(148,163,184,0.3)", backgroundColor: "#1a2e24" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#0df280" }}>account_circle</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <h3 className="text-white font-bold text-lg">cryptoking.one</h3>
                <span className="material-symbols-outlined leading-none" style={{ color: "#0df280", fontSize: "16px" }}>verified</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">Rank 2</p>
              <div className="grid grid-cols-2 w-full gap-2 pt-4" style={{ borderTop: "1px solid #1a2e24" }}>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Wins</p>
                  <p className="text-white font-bold">128</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Points</p>
                  <p className="font-bold" style={{ color: "#0df280" }}>8,920</p>
                </div>
              </div>
            </div>

            {/* 1st place — Gold */}
            <div className="relative order-1 md:order-2 rounded-2xl p-8 flex flex-col items-center scale-105 gold-glow z-10"
              style={{ backgroundColor: "#121a16", border: "2px solid rgba(13,242,128,0.3)" }}>
              <div className="absolute -top-5 text-[#0a0d0c] text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2"
                style={{ backgroundColor: "#facc15" }}>
                <span className="material-symbols-outlined leading-none text-lg">emoji_events</span>
                Gold
              </div>
              <div className="w-24 h-24 rounded-full p-1 mb-4 flex items-center justify-center"
                style={{ border: "4px solid rgba(250,204,21,0.3)", backgroundColor: "#1a2e24" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "50px", color: "#0df280" }}>account_circle</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <h3 className="text-white font-black text-2xl tracking-tight">player.one</h3>
                <span className="material-symbols-outlined leading-none" style={{ color: "#0df280", fontSize: "20px" }}>verified</span>
              </div>
              <p className="text-sm font-bold mb-6" style={{ color: "#0df280" }}>Current Champion</p>
              <div className="grid grid-cols-2 w-full gap-4 pt-6" style={{ borderTop: "1px solid #1a2e24" }}>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Wins</p>
                  <p className="text-white text-xl font-black">214</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Arena Pts</p>
                  <p className="text-xl font-black" style={{ color: "#0df280" }}>12,450</p>
                </div>
              </div>
            </div>

            {/* 3rd place — Bronze */}
            <div className="relative order-3 rounded-2xl p-6 flex flex-col items-center bronze-glow"
              style={{ backgroundColor: "#121a16", border: "1px solid #1a2e24" }}>
              <div className="absolute -top-4 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest"
                style={{ backgroundColor: "#c2410c" }}>Bronze</div>
              <div className="w-20 h-20 rounded-full p-1 mb-4 flex items-center justify-center"
                style={{ border: "4px solid rgba(194,65,12,0.3)", backgroundColor: "#1a2e24" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#0df280" }}>account_circle</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <h3 className="text-white font-bold text-lg">victory.one</h3>
                <span className="material-symbols-outlined leading-none" style={{ color: "#0df280", fontSize: "16px" }}>verified</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">Rank 3</p>
              <div className="grid grid-cols-2 w-full gap-2 pt-4" style={{ borderTop: "1px solid #1a2e24" }}>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Wins</p>
                  <p className="text-white font-bold">104</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Points</p>
                  <p className="font-bold" style={{ color: "#0df280" }}>7,810</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="px-8 mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex rounded-lg p-1" style={{ backgroundColor: "#121a16", border: "1px solid #1a2e24" }}>
            {(["Global", "Friends", "My Guild"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-6 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                style={filter === f
                  ? { backgroundColor: "#1a2e24", color: "#ffffff" }
                  : { color: "#64748b" }}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 leading-none" style={{ fontSize: "20px" }}>search</span>
            <input type="text" placeholder="Search OneID..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-white text-sm rounded-lg pl-10 py-2 focus:outline-none transition-colors"
              style={{ backgroundColor: "#121a16", border: "1px solid #1a2e24" }} />
          </div>
        </div>

        {/* Table */}
        <div className="px-8 pb-12">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#121a16", border: "1px solid #1a2e24" }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid #1a2e24", backgroundColor: "rgba(26,46,36,0.2)" }}>
                  {["Rank", "Player ID", "Total Wins", "Win Streak", "Points"].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 ${i === 4 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={row.rank} className="group transition-colors"
                    style={{ borderBottom: idx < filtered.length - 1 ? "1px solid rgba(26,46,36,0.5)" : "none" }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(26,46,36,0.3)")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                    <td className="px-6 py-4">
                      <span className="font-black" style={row.rankStyle}>#{row.rank}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: "#1a2e24" }}>
                          <span className="material-symbols-outlined text-slate-400 leading-none" style={{ fontSize: "18px" }}>person</span>
                        </div>
                        <span className="text-white font-bold group-hover:text-primary transition-colors">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{row.wins}</td>
                    <td className="px-6 py-4">
                      {row.streak > 0 ? (
                        <span className="flex items-center gap-1 font-bold" style={{ color: "#0df280" }}>
                          <span className="material-symbols-outlined leading-none" style={{ fontSize: "14px" }}>local_fire_department</span>
                          {row.streak}
                        </span>
                      ) : (
                        <span className="text-slate-500">{row.streak}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-white font-bold">{row.points.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-4 flex justify-between items-center" style={{ backgroundColor: "rgba(26,46,36,0.1)" }}>
              <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined leading-none" style={{ fontSize: "16px" }}>chevron_left</span> Previous
              </button>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <span key={n}
                    className="w-8 h-8 flex items-center justify-center font-bold rounded text-xs cursor-pointer transition-colors"
                    style={n === 1
                      ? { backgroundColor: "#0df280", color: "#0a0d0c" }
                      : { color: "#94a3b8" }}>
                    {n}
                  </span>
                ))}
                <span className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold rounded text-xs">...</span>
                <span className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold rounded text-xs cursor-pointer hover:bg-accent-dark transition-colors">42</span>
              </div>
              <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                Next <span className="material-symbols-outlined leading-none" style={{ fontSize: "16px" }}>chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
