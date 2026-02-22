"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentAccount, ConnectButton } from "@onelabs/dapp-kit";
import { useUSDTBalance } from "@/hooks/useUSDTBalance";
import { useFaucet } from "@/hooks/useFaucet";
import { WalletMenu } from "@/components/WalletMenu";

type Status = "live" | "upcoming" | "ended";

interface Tournament {
  id: string;
  name: string;
  pair: string;
  icon: string;
  status: Status;
  entryFee: string;
  prizePool: string;
  players: number;
  maxPlayers: number;
  roundDuration: string;
  rounds: number;
  timeLeft: string;
  startTime: string;
  accent: string;
}

const TOURNAMENTS: Tournament[] = [
  {
    id: "1",
    name: "BTC Grand Championship",
    pair: "BTC / USDT",
    icon: "currency_bitcoin",
    status: "live",
    entryFee: "500 USDC",
    prizePool: "12.4 ETH",
    players: 198,
    maxPlayers: 256,
    roundDuration: "5 min",
    rounds: 10,
    timeLeft: "04:12",
    startTime: "",
    accent: "#0df280",
  },
  {
    id: "2",
    name: "ETH Speed Duel",
    pair: "ETH / USDT",
    icon: "water_drop",
    status: "live",
    entryFee: "250 USDC",
    prizePool: "8.15 ETH",
    players: 512,
    maxPlayers: 512,
    roundDuration: "1 min",
    rounds: 20,
    timeLeft: "02:45",
    startTime: "",
    accent: "#3b82f6",
  },
  {
    id: "3",
    name: "SOL Weekly GP",
    pair: "SOL / USDT",
    icon: "sunny",
    status: "live",
    entryFee: "100 USDC",
    prizePool: "3.8 ETH",
    players: 89,
    maxPlayers: 128,
    roundDuration: "15 min",
    rounds: 5,
    timeLeft: "11:38",
    startTime: "",
    accent: "#a855f7",
  },
  {
    id: "4",
    name: "BNB Blitz Series",
    pair: "BNB / USDT",
    icon: "hexagon",
    status: "upcoming",
    entryFee: "200 USDC",
    prizePool: "6.0 ETH",
    players: 42,
    maxPlayers: 256,
    roundDuration: "5 min",
    rounds: 10,
    timeLeft: "",
    startTime: "Starts in 2h 18m",
    accent: "#f59e0b",
  },
  {
    id: "5",
    name: "DOGE Mania Cup",
    pair: "DOGE / USDT",
    icon: "pets",
    status: "upcoming",
    entryFee: "50 USDC",
    prizePool: "1.2 ETH",
    players: 14,
    maxPlayers: 64,
    roundDuration: "5 min",
    rounds: 6,
    timeLeft: "",
    startTime: "Starts in 5h 40m",
    accent: "#f59e0b",
  },
  {
    id: "6",
    name: "ARB Micro Blitz",
    pair: "ARB / USDT",
    icon: "toll",
    status: "upcoming",
    entryFee: "75 USDC",
    prizePool: "2.1 ETH",
    players: 28,
    maxPlayers: 128,
    roundDuration: "1 min",
    rounds: 15,
    timeLeft: "",
    startTime: "Starts in 8h 00m",
    accent: "#3b82f6",
  },
  {
    id: "7",
    name: "ADA Classic",
    pair: "ADA / USDT",
    icon: "water",
    status: "ended",
    entryFee: "150 USDC",
    prizePool: "4.5 ETH",
    players: 256,
    maxPlayers: 256,
    roundDuration: "10 min",
    rounds: 8,
    timeLeft: "",
    startTime: "Ended 3h ago",
    accent: "#64748b",
  },
  {
    id: "8",
    name: "XRP Surge Sprint",
    pair: "XRP / USDT",
    icon: "bolt",
    status: "ended",
    entryFee: "100 USDC",
    prizePool: "2.9 ETH",
    players: 128,
    maxPlayers: 128,
    roundDuration: "5 min",
    rounds: 10,
    timeLeft: "",
    startTime: "Ended 6h ago",
    accent: "#64748b",
  },
];

const STATUS_LABEL: Record<Status, { label: string; dot: string; bg: string; text: string }> = {
  live:     { label: "LIVE",     dot: "#0df280", bg: "rgba(13,242,128,0.15)",  text: "#0df280" },
  upcoming: { label: "UPCOMING", dot: "#f59e0b", bg: "rgba(245,158,11,0.15)",  text: "#f59e0b" },
  ended:    { label: "ENDED",    dot: "#64748b", bg: "rgba(100,116,139,0.15)", text: "#64748b" },
};

function FaucetButton({ address, onSuccess }: { address: string; onSuccess?: () => void }) {
  const { claimFaucet, isPending, isSuccess } = useFaucet();
  async function handleClaim() {
    try { await claimFaucet(address); onSuccess?.(); } catch { /* noop */ }
  }
  if (isSuccess) {
    return (
      <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
        style={{ backgroundColor: "rgba(13,242,128,0.15)", color: "#0df280" }}>
        <span className="material-symbols-outlined text-sm leading-none">check_circle</span>
        +100 USDT sent!
      </span>
    );
  }
  return (
    <button onClick={handleClaim} disabled={isPending}
      className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all hover:opacity-80 disabled:opacity-50"
      style={{ backgroundColor: "rgba(13,242,128,0.12)", color: "#0df280", border: "1px solid rgba(13,242,128,0.25)" }}>
      <span className="material-symbols-outlined text-sm leading-none">water_drop</span>
      {isPending ? "Claiming…" : "Get 100 USDT"}
    </button>
  );
}

export default function TournamentsPage() {
  const account = useCurrentAccount();
  const { balance, refetch: refetchBalance } = useUSDTBalance(account?.address);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");

  const filtered = TOURNAMENTS.filter((t) => {
    const matchStatus = filter === "all" || t.status === filter;
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.pair.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: TOURNAMENTS.length,
    live: TOURNAMENTS.filter((t) => t.status === "live").length,
    upcoming: TOURNAMENTS.filter((t) => t.status === "upcoming").length,
    ended: TOURNAMENTS.filter((t) => t.status === "ended").length,
  };

  return (
    <div style={{ backgroundColor: "#0a0a0a" }} className="text-slate-100 antialiased min-h-screen overflow-x-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 glass-panel">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl" style={{ color: "#0df280" }}>swords</span>
              <h1 className="text-lg font-black tracking-tighter uppercase italic">
                GameFi <span style={{ color: "#0df280" }}>Arena</span>
              </h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0df280", borderBottom: "2px solid #0df280", paddingBottom: "2px" }}>Tournaments</span>
              <Link href="/arena" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Arena</Link>
              <Link href="/leaderboard" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Leaderboard</Link>
              <Link href="/profile" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">My Arena</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {account ? (
              <>
                {/* USDT balance chip */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="material-symbols-outlined text-sm leading-none" style={{ color: "#0df280" }}>toll</span>
                  <span>{balance ? `${balance.formatted} USDT` : "…"}</span>
                </div>

                {/* Faucet button */}
                <FaucetButton address={account.address} onSuccess={refetchBalance} />

                {/* Wallet chip + disconnect dropdown */}
                <WalletMenu />

                <Link href="/profile"
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ border: "2px solid rgba(13,242,128,0.3)", backgroundColor: "#161b22" }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: "#0df280" }}>person</span>
                </Link>
              </>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">

        {/* ── Page Title ───────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-5xl font-black tracking-tighter uppercase italic mb-2">
                Tournaments <span style={{ color: "#0df280" }}>Arena</span>
              </h2>
              <p className="text-slate-500 font-medium max-w-xl">
                Stake your principal, compete in prediction rounds, and claim the yield.
                Your principal is always 100% protected.
              </p>
            </div>
            {/* Live indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#0df280" }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "#0df280" }} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0df280" }}>
                {counts.live} Live Now
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats bar ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Prize Pool", value: "28.3 ETH", icon: "military_tech", color: "#0df280" },
            { label: "Active Players",   value: "799",      icon: "group",         color: "#3b82f6" },
            { label: "Tournaments Today",value: "8",        icon: "emoji_events",  color: "#f59e0b" },
            { label: "Yield Paid Out",   value: "450 ETH",  icon: "payments",      color: "#a855f7" },
          ].map((s) => (
            <div key={s.label} className="glass-panel rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${s.color}15` }}>
                <span className="material-symbols-outlined text-xl" style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters + Search ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            {(["all", "live", "upcoming", "ended"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                style={filter === f
                  ? { backgroundColor: "#0df280", color: "#0a0a0a" }
                  : { color: "#64748b" }}>
                {f === "live" && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: filter === "live" ? "#0a0a0a" : "#0df280" }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: filter === "live" ? "#0a0a0a" : "#0df280" }} />
                  </span>
                )}
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                  style={filter === f
                    ? { backgroundColor: "rgba(0,0,0,0.3)", color: "#0a0a0a" }
                    : { backgroundColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
            <input
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 outline-none focus:border-white/30 transition-colors w-64"
            />
          </div>
        </div>

        {/* ── Tournament Grid ───────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-600">
            <span className="material-symbols-outlined text-6xl block mb-4">search_off</span>
            <p className="font-bold uppercase tracking-widest">No tournaments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((t) => {
              const sl = STATUS_LABEL[t.status];
              const fillPct = Math.round((t.players / t.maxPlayers) * 100);
              return (
                <div key={t.id}
                  className="glass-panel rounded-2xl overflow-hidden group transition-all hover:scale-[1.01] hover:border-white/20 flex flex-col"
                  style={{ borderLeft: `4px solid ${t.accent}` }}>

                  {/* Card top */}
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${t.accent}18`, border: `1px solid ${t.accent}30` }}>
                          <span className="material-symbols-outlined text-2xl" style={{ color: t.accent }}>{t.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-black text-sm uppercase italic leading-tight">{t.name}</h3>
                          <p className="text-xs text-slate-500 font-bold">{t.pair}</p>
                        </div>
                      </div>
                      {/* Status badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: sl.bg }}>
                        {t.status === "live" && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: sl.dot }} />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sl.dot }} />
                          </span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: sl.text }}>{sl.label}</span>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Prize Pool</p>
                        <p className="text-lg font-black" style={{ color: "#3b82f6" }}>{t.prizePool}</p>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Entry Fee</p>
                        <p className="text-lg font-black" style={{ color: t.accent }}>{t.entryFee}</p>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Round Time</p>
                        <p className="text-base font-black text-white">{t.roundDuration}</p>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Format</p>
                        <p className="text-base font-black" style={{ color: t.accent }}>{t.rounds}× Predict</p>
                      </div>
                    </div>

                    {/* Players fill bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                        <span className="text-slate-500">Players</span>
                        <span style={{ color: fillPct >= 100 ? "#ff4d4d" : "#94a3b8" }}>
                          {t.players} / {t.maxPlayers}
                          {fillPct >= 100 && " · FULL"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${fillPct}%`,
                            backgroundColor: fillPct >= 100 ? "#ff4d4d" : t.accent,
                            boxShadow: `0 0 8px ${t.accent}60`,
                          }} />
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm leading-none text-slate-500">
                        {t.status === "live" ? "timer" : t.status === "upcoming" ? "schedule" : "event_available"}
                      </span>
                      {t.status === "live" ? (
                        <span>Round ends in <span className="font-black text-sm" style={{ color: "#0df280" }}>{t.timeLeft}</span></span>
                      ) : (
                        <span style={{ color: t.status === "upcoming" ? "#f59e0b" : "#64748b" }}>{t.startTime}</span>
                      )}
                    </div>
                  </div>

                  {/* Card CTA */}
                  <div className="px-5 pb-5 flex flex-col gap-2">
                    {t.status === "ended" ? (
                      <Link href={`/tournaments/${t.id}`}
                        className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:opacity-80"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <span className="material-symbols-outlined text-base leading-none">history</span>
                        View Results
                      </Link>
                    ) : fillPct >= 100 ? (
                      <Link href={`/tournaments/${t.id}`}
                        className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:opacity-80"
                        style={{ backgroundColor: "rgba(255,77,77,0.1)", color: "#ff4d4d", border: "1px solid rgba(255,77,77,0.2)" }}>
                        <span className="material-symbols-outlined text-base leading-none">visibility</span>
                        Full — View Live
                      </Link>
                    ) : (
                      <Link href={`/tournaments/${t.id}`}
                        className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:opacity-80 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: t.accent, color: "#0a0a0a", boxShadow: `0 0 20px ${t.accent}40` }}>
                        <span className="material-symbols-outlined text-base leading-none">
                          {t.status === "live" ? "play_arrow" : "schedule_send"}
                        </span>
                        {t.status === "live" ? `Join · ${t.rounds}× Predict` : `Register · ${t.rounds}× Predict`}
                      </Link>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-all">
            <span className="material-symbols-outlined text-xl" style={{ color: "#0df280" }}>swords</span>
            <span className="text-xs font-black tracking-tighter uppercase italic">GameFi Arena</span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            © 2024 GameFi Prediction Arena · Secured by OneChain Protocol
          </p>
        </div>
      </footer>
    </div>
  );
}
