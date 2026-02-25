"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useCurrentAccount } from "@onelabs/dapp-kit";
import { useLeaderboardRows } from "@/hooks/useLeaderboard";
import { shortenAddress } from "@/lib/constants";

function rankColor(rank: number): string {
  if (rank === 1) return "#facc15";
  if (rank === 2) return "#cbd5e1";
  if (rank === 3) return "#c2410c";
  return "#94a3b8";
}

function rankGlowClass(rank: number): string {
  if (rank === 1) return "animate-gold-glow";
  if (rank === 2) return "animate-silver-glow";
  if (rank === 3) return "animate-bronze-glow";
  return "";
}

function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function formatLastUpdate(timestampMs: number): string {
  if (!timestampMs) return "-";
  return new Date(timestampMs).toLocaleString();
}

/* ─── Podium card ───────────────────────────────────────────────── */
function PodiumCard({
  player,
  rank,
  totalScore,
  winEvents,
  currentStreak,
  updateEvents,
  isMe,
  delay = 0,
}: {
  player: string;
  rank: number;
  totalScore: number;
  winEvents: number;
  currentStreak: number;
  updateEvents: number;
  isMe: boolean;
  delay?: number;
}) {
  const color = rankColor(rank);
  const glowClass = rankGlowClass(rank);
  const initial = player.slice(0, 2).toUpperCase();

  const heights: Record<number, string> = { 1: "h-8", 2: "h-4", 3: "h-2" };

  return (
    <div
      className={`glass-panel rounded-2xl p-6 relative overflow-hidden animate-podium ${glowClass}`}
      style={{
        animationDelay: `${delay}ms`,
        borderTop: `3px solid ${color}`,
      }}
    >
      {/* Rank ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${color}18 0%, transparent 65%)`,
        }}
      />

      {/* Rank number */}
      <div className="text-center mb-5 relative z-10">
        <div className="text-4xl mb-2" aria-label={`Rank ${rank}`}>
          {rank <= 3 ? rankLabel(rank) : `#${rank}`}
        </div>
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl mx-auto mb-3"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}10)`,
            border: `2px solid ${color}60`,
            color,
          }}
        >
          {initial}
        </div>
        <p className="font-bold text-sm text-slate-200 mb-0.5">{shortenAddress(player, 8)}</p>
        {isMe && (
          <span
            className="inline-block text-[10px] px-2 py-0.5 rounded-full font-black"
            style={{ backgroundColor: "rgba(13,242,128,0.2)", color: "#0df280" }}
          >
            YOU
          </span>
        )}
      </div>

      {/* Score */}
      <div className="text-center relative z-10 mb-4">
        <p className="text-3xl font-black" style={{ color }}>
          {totalScore.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">points</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {[
          { label: "Wins", value: winEvents },
          { label: "Streak", value: currentStreak },
          { label: "Updates", value: updateEvents },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-2 text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <p className="text-sm font-black" style={{ color }}>{s.value}</p>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom podium bar */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-b-2xl"
        style={{ height: "3px", backgroundColor: color, opacity: 0.4 }}
      />
    </div>
  );
}

/* ─── Score bar component ────────────────────────────────────────── */
function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="font-black text-sm" style={{ color: "#0df280" }}>
        {score.toLocaleString()}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full animate-score-bar"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #0df280, #3b82f6)",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function LeaderboardPage() {
  const account = useCurrentAccount();
  const [search, setSearch] = useState("");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const leaderboardQuery = useLeaderboardRows();
  const rows = useMemo(() => leaderboardQuery.data ?? [], [leaderboardQuery.data]);
  const normalizedAccount = account?.address.toLowerCase() ?? "";

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => row.player.toLowerCase().includes(keyword));
  }, [rows, search]);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const maxScore = useMemo(() => rows[0]?.totalScore ?? 0, [rows]);
  const totalScore = useMemo(() => rows.reduce((sum, r) => sum + r.totalScore, 0), [rows]);
  const lastUpdated = useMemo(() => rows.reduce((max, r) => Math.max(max, r.lastUpdateMs), 0), [rows]);

  if (!mounted) return null;

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative z-10 text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >
      {/* ── Background decorations ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="blue-cyber-grid absolute inset-0 opacity-35" />
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(250,204,21,0.05) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20">

        {/* ── Page hero ── */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-2xl" style={{ color: "#facc15" }}>
                  emoji_events
                </span>
                <div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  style={{
                    backgroundColor: "rgba(250,204,21,0.1)",
                    color: "#facc15",
                    border: "1px solid rgba(250,204,21,0.2)",
                  }}
                >
                  Live Rankings
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic">
                On-Chain{" "}
                <span
                  className="animate-gradient-text"
                  style={{
                    background: "linear-gradient(90deg, #facc15, #f59e0b, #0df280, #facc15)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "200% auto",
                  }}
                >
                  Leaderboard
                </span>
              </h1>
              <p className="text-slate-500 font-medium mt-2 text-sm">
                Aggregated from live <code className="text-slate-400">ScoreUpdated</code> events on-chain.
              </p>
            </div>
            <div
              className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                color: "#64748b",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              Last event: {mounted ? formatLastUpdate(lastUpdated) : "..."}
            </div>
          </div>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Players", value: rows.length, color: "#0df280", icon: "group" },
            { label: "Total Score", value: totalScore.toLocaleString(), color: "#3b82f6", icon: "bar_chart" },
            { label: "Top Score", value: (rows[0]?.totalScore ?? 0).toLocaleString(), color: "#facc15", icon: "military_tech" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="glass-panel rounded-2xl p-5 flex items-center gap-4 animate-card-enter"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${stat.color}18`,
                  border: `1px solid ${stat.color}30`,
                }}
              >
                <span className="material-symbols-outlined text-xl" style={{ color: stat.color }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-black" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Podium top 3 ── */}
        {podium.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                Hall of Fame
              </h2>
              <div
                className="flex-1 h-px"
                style={{ background: "linear-gradient(90deg, rgba(250,204,21,0.3), transparent)" }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Show rank 2, 1, 3 for podium visual (2 left, 1 center, 3 right on desktop) */}
              {[
                podium[1],
                podium[0],
                podium[2],
              ].filter(Boolean).map((row, idx) => {
                if (!row) return null;
                const isMe = row.player.toLowerCase() === normalizedAccount;
                const delayMap: Record<number, number> = { 0: 150, 1: 0, 2: 300 };
                return (
                  <div
                    key={row.player}
                    className={idx === 1 ? "md:-mt-4" : "md:mt-4"}
                  >
                    <PodiumCard
                      player={row.player}
                      rank={row.rank}
                      totalScore={row.totalScore}
                      winEvents={row.winEvents}
                      currentStreak={row.currentStreak}
                      updateEvents={row.updateEvents}
                      isMe={isMe}
                      delay={delayMap[idx] ?? 0}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Search + table ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
            All Players — {filteredRows.length}
          </h2>
          <div className="relative">
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-base"
              style={{ color: "#64748b" }}
            >
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wallet address..."
              className="w-full md:w-72 pl-9 pr-4 py-2.5 rounded-xl text-sm form-field-glow"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f1f5f9",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* ── Loading state ── */}
        {leaderboardQuery.isLoading && (
          <div className="glass-panel rounded-2xl p-8">
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-10 h-6 rounded-lg animate-shimmer" />
                  <div className="flex-1 h-6 rounded-lg animate-shimmer" />
                  <div className="w-24 h-6 rounded-lg animate-shimmer" />
                  <div className="w-16 h-6 rounded-lg animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {leaderboardQuery.isError && (
          <div
            className="rounded-2xl p-5 text-sm font-bold"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            Failed to load leaderboard:{" "}
            {leaderboardQuery.error instanceof Error ? leaderboardQuery.error.message : "Unknown error"}
          </div>
        )}

        {/* ── Empty state ── */}
        {!leaderboardQuery.isLoading && !leaderboardQuery.isError && filteredRows.length === 0 && (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-500 block mb-4">
              leaderboard
            </span>
            <p className="text-slate-400 text-sm">No leaderboard events found yet.</p>
          </div>
        )}

        {/* ── Leaderboard table ── */}
        {!leaderboardQuery.isLoading && !leaderboardQuery.isError && filteredRows.length > 0 && (
          <div
            className="glass-panel rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Table header */}
            <div
              className="grid gap-4 px-5 py-3"
              style={{
                gridTemplateColumns: "56px 1fr 180px 80px 80px 140px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              {["Rank", "Player", "Score", "Wins", "Streak", "Updated"].map((h) => (
                <p key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {h}
                </p>
              ))}
            </div>

            {/* Table rows */}
            <div>
              {filteredRows.map((row, i) => {
                const isMe = row.player.toLowerCase() === normalizedAccount;
                const color = rankColor(row.rank);
                return (
                  <div
                    key={row.player}
                    className="grid gap-4 px-5 py-3.5 animate-row-enter transition-colors"
                    style={{
                      gridTemplateColumns: "56px 1fr 180px 80px 80px 140px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      backgroundColor: isMe ? "rgba(13,242,128,0.05)" : "transparent",
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    {/* Rank */}
                    <div className="flex items-center">
                      <span
                        className={`text-sm font-black ${row.rank <= 3 ? "text-lg" : ""}`}
                        style={{ color }}
                      >
                        {row.rank <= 3 ? rankLabel(row.rank) : `#${row.rank}`}
                      </span>
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                        style={{
                          backgroundColor: `${color}18`,
                          border: `1px solid ${color}30`,
                          color,
                        }}
                      >
                        {row.player.slice(2, 4).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm truncate text-slate-200">
                        {shortenAddress(row.player, 6)}
                      </span>
                      {isMe && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-black shrink-0"
                          style={{ backgroundColor: "rgba(13,242,128,0.2)", color: "#0df280" }}
                        >
                          YOU
                        </span>
                      )}
                    </div>

                    {/* Score bar */}
                    <div className="flex items-center">
                      <ScoreBar score={row.totalScore} maxScore={maxScore} />
                    </div>

                    {/* Win events */}
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-slate-300">{row.winEvents}</span>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-1">
                      {row.currentStreak > 0 && (
                        <span className="text-xs" style={{ color: "#f59e0b" }}>🔥</span>
                      )}
                      <span className="text-sm font-bold text-slate-300">{row.currentStreak}</span>
                    </div>

                    {/* Last update */}
                    <div className="flex items-center">
                      <span className="text-xs text-slate-500">
                        {mounted ? formatLastUpdate(row.lastUpdateMs) : "..."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
