"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useMultiRoundTournaments, type TournamentGroup } from "@/hooks/useMultiRoundTournaments";
import { formatUSDT } from "@/lib/constants";

const STATUS_STYLE = {
  live: {
    label: "LIVE",
    color: "#0df280",
    bg: "rgba(13,242,128,0.12)",
    border: "rgba(13,242,128,0.35)",
  },
  upcoming: {
    label: "UPCOMING",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
  },
  completed: {
    label: "ENDED",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
  },
} as const;

function formatTimeLeft(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return "0m";
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

/* ─── Round progress dots ────────────────────────────────────────── */
function RoundDots({
  rounds,
  tournament,
}: {
  rounds: TournamentGroup["rounds"];
  tournament: TournamentGroup;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {rounds.map((r, i) => {
        const isDone = r.status === "ended" || r.isSettled;
        const isLive = r.status === "live";
        const dotColor = isDone ? "#0df280" : isLive ? "#f59e0b" : "#334155";
        return (
          <div key={r.sessionId} className="flex items-center gap-1">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLive ? "animate-live-dot" : ""}`}
              style={{ backgroundColor: dotColor }}
              title={`Round ${r.roundNumber}`}
            />
            {i < rounds.length - 1 && (
              <div
                className="w-3 h-px"
                style={{
                  backgroundColor: isDone ? "rgba(13,242,128,0.4)" : "rgba(255,255,255,0.1)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tournament Group Card ──────────────────────────────────────── */
function TournamentGroupCard({
  tournament,
  index,
}: {
  tournament: TournamentGroup;
  index: number;
}) {
  const statusStyle = STATUS_STYLE[tournament.status];
  const isLive = tournament.status === "live";
  const currentRound = tournament.currentRound;
  const completedLabel = `${tournament.completedRounds}/${tournament.totalRounds} rounds`;

  const timeInfo = useMemo(() => {
    if (tournament.status === "live" && currentRound) {
      return { label: "Ends in", value: formatTimeLeft(currentRound.endTimeMs) };
    }
    if (tournament.status === "upcoming" && currentRound) {
      return { label: "Starts in", value: formatTimeLeft(currentRound.startTimeMs) };
    }
    return { label: "Status", value: "Completed" };
  }, [tournament.status, currentRound]);

  return (
    <div
      className={`glass-panel rounded-2xl flex flex-col relative overflow-hidden tournament-card animate-card-enter ${isLive ? "tournament-card-live" : ""}`}
      style={{
        animationDelay: `${index * 80}ms`,
        borderTop: `2px solid ${statusStyle.border}`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${statusStyle.color}08 0%, transparent 60%)`,
        }}
      />

      {/* Live pulse strip */}
      {isLive && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${statusStyle.color}, transparent)`,
            animation: "gradientShift 2s ease infinite",
            backgroundSize: "200% 100%",
          }}
        />
      )}

      {/* Header */}
      <div className="px-5 pt-5 pb-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
              style={{
                background: `linear-gradient(135deg, ${statusStyle.color}22, ${statusStyle.color}08)`,
                border: `1px solid ${statusStyle.color}30`,
                color: statusStyle.color,
              }}
            >
              {tournament.coinSymbol.slice(0, 3)}
            </div>
            <div>
              <h3 className="font-black text-base uppercase italic leading-tight">
                {tournament.coinSymbol}
                <span className="text-slate-500 font-bold"> / USDT</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                Season {tournament.seasonId} · {tournament.totalRounds} rounds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isLive && (
              <div
                className="w-2 h-2 rounded-full animate-live-dot"
                style={{ backgroundColor: statusStyle.color }}
              />
            )}
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
              style={{
                color: statusStyle.color,
                backgroundColor: statusStyle.bg,
                border: `1px solid ${statusStyle.border}`,
              }}
            >
              {statusStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="relative z-10"
        style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 20px" }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-0 px-5 py-4 relative z-10">
        {[
          { label: "Entry Fee", value: `${formatUSDT(tournament.entryFeeRaw)} USDT` },
          { label: "Prize Pool", value: `${formatUSDT(tournament.totalPrizePoolRaw)} USDT` },
          { label: "Progress", value: completedLabel },
          timeInfo,
        ].map((item) => (
          <div key={item.label} className="py-1.5">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
              {item.label}
            </p>
            <p className="text-sm font-black text-slate-200 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Round progress dots */}
      <div className="px-5 pb-4 relative z-10">
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-2">
          Round Progress
        </p>
        <RoundDots rounds={tournament.rounds} tournament={tournament} />
        {currentRound && tournament.status !== "completed" && (
          <p className="text-[10px] text-slate-500 font-bold mt-1.5">
            {tournament.status === "live"
              ? `Round ${currentRound.roundNumber} live now`
              : `Round ${currentRound.roundNumber} starts ${formatTimeLeft(currentRound.startTimeMs)}`}
          </p>
        )}
      </div>

      {/* Action */}
      <div className="px-5 pb-5 relative z-10">
        <Link
          href={`/tournaments/${tournament.seasonId}`}
          className="block w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all hover:opacity-90"
          style={
            isLive
              ? {
                  backgroundColor: "#0df280",
                  color: "#0a0a0a",
                  boxShadow: "0 0 20px rgba(13,242,128,0.3)",
                }
              : tournament.status === "upcoming"
              ? {
                  backgroundColor: "rgba(245,158,11,0.15)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.35)",
                }
              : {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                }
          }
        >
          {isLive ? "Predict Now" : tournament.status === "upcoming" ? "View Details" : "View Results"}
        </Link>
      </div>
    </div>
  );
}

/* ─── Skeleton card ──────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl animate-shimmer" />
        <div className="space-y-2 flex-1">
          <div className="h-4 rounded-lg animate-shimmer w-3/4" />
          <div className="h-3 rounded-lg animate-shimmer w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded-xl animate-shimmer" />
        ))}
      </div>
      <div className="h-6 rounded-xl animate-shimmer w-2/3" />
      <div className="h-10 rounded-xl animate-shimmer" />
    </div>
  );
}

/* ─── Stats mini card ───────────────────────────────────────────── */
function StatCard({
  label,
  value,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="glass-panel rounded-2xl p-4 relative overflow-hidden animate-card-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 100%, ${color}14 0%, transparent 70%)`,
        }}
      />
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 relative z-10">
        {label}
      </p>
      <p className="text-xl font-black relative z-10" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function TournamentsPage() {
  const tournamentsQuery = useMultiRoundTournaments();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "upcoming" | "completed">("all");
  const [search, setSearch] = useState("");

  const tournaments = useMemo(() => tournamentsQuery.data ?? [], [tournamentsQuery.data]);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const statusMatch = statusFilter === "all" ? true : t.status === statusFilter;
      const searchMatch =
        t.coinSymbol.toLowerCase().includes(search.toLowerCase()) ||
        String(t.seasonId).includes(search);
      return statusMatch && searchMatch;
    });
  }, [tournaments, statusFilter, search]);

  const stats = useMemo(() => {
    const live = tournaments.filter((t) => t.status === "live").length;
    const upcoming = tournaments.filter((t) => t.status === "upcoming").length;
    const completed = tournaments.filter((t) => t.status === "completed").length;
    const totalRounds = tournaments.reduce((s, t) => s + t.totalRounds, 0);
    const totalPool = tournaments.reduce((s, t) => s + t.totalPrizePoolRaw, 0);
    return { total: tournaments.length, live, upcoming, completed, totalRounds, totalPool };
  }, [tournaments]);

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative z-10 text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="blue-cyber-grid absolute inset-0 opacity-40" />
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(13,242,128,0.06) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute top-48 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20">

        {/* Hero */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  style={{
                    backgroundColor: "rgba(13,242,128,0.12)",
                    color: "#0df280",
                    border: "1px solid rgba(13,242,128,0.25)",
                  }}
                >
                  Multi-Round Tournaments
                </div>
                {stats.live > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full animate-live-dot"
                      style={{ backgroundColor: "#0df280" }}
                    />
                    <span className="text-xs font-black text-slate-400">
                      {stats.live} live now
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic">
                On-Chain{" "}
                <span
                  className="animate-gradient-text"
                  style={{
                    background: "linear-gradient(90deg, #0df280, #3b82f6, #0df280)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "200% auto",
                  }}
                >
                  Tournaments
                </span>
              </h1>
              <p className="text-slate-500 font-medium mt-2 text-sm">
                Multi-round prediction tournaments with cumulative leaderboards.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "#64748b",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {mounted ? new Date().toLocaleTimeString() : "--:--:--"}
              </div>
              <button
                type="button"
                onClick={() => tournamentsQuery.refetch()}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{
                  backgroundColor: "rgba(13,242,128,0.1)",
                  color: "#0df280",
                  border: "1px solid rgba(13,242,128,0.25)",
                }}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          <StatCard label="Tournaments" value={stats.total} color="#0df280" delay={0} />
          <StatCard label="Live" value={stats.live} color="#22c55e" delay={60} />
          <StatCard label="Upcoming" value={stats.upcoming} color="#f59e0b" delay={120} />
          <StatCard label="Completed" value={stats.completed} color="#94a3b8" delay={180} />
          <StatCard label="Total Rounds" value={stats.totalRounds} color="#3b82f6" delay={240} />
        </div>

        {/* Filters + search */}
        <div
          className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-8 p-4 rounded-2xl"
          style={{
            backgroundColor: "rgba(22,27,34,0.5)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "live", "upcoming", "completed"] as const).map((status) => {
              const isActive = statusFilter === status;
              const activeColor =
                status === "all" ? "#0df280"
                : status === "live" ? "#22c55e"
                : status === "upcoming" ? "#f59e0b"
                : "#94a3b8";
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  style={
                    isActive
                      ? {
                          backgroundColor: `${activeColor}20`,
                          color: activeColor,
                          border: `1.5px solid ${activeColor}60`,
                          boxShadow: `0 0 12px ${activeColor}20`,
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.04)",
                          color: "#64748b",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }
                  }
                >
                  {status}
                </button>
              );
            })}
          </div>
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
              placeholder="Search coin or season..."
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

        {/* Loading */}
        {tournamentsQuery.isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {tournamentsQuery.isError && (
          <div
            className="rounded-2xl p-5 text-sm font-bold"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <span className="material-symbols-outlined text-base align-middle mr-2">error</span>
            Failed to load:{" "}
            {tournamentsQuery.error instanceof Error ? tournamentsQuery.error.message : "Unknown error"}
          </div>
        )}

        {/* Empty state */}
        {!tournamentsQuery.isLoading && !tournamentsQuery.isError && filteredTournaments.length === 0 && (
          <div
            className="glass-panel rounded-2xl p-12 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                backgroundColor: "rgba(13,242,128,0.1)",
                border: "1px solid rgba(13,242,128,0.2)",
              }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: "#0df280" }}>
                emoji_events
              </span>
            </div>
            <h3 className="text-xl font-black uppercase italic mb-2">No Tournaments Found</h3>
            <p className="text-slate-500 text-sm mb-6">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "No multi-round tournaments have been created yet."}
            </p>
            <Link
              href="/arena"
              className="inline-flex px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:opacity-90"
              style={{
                backgroundColor: "#0df280",
                color: "#0a0a0a",
                boxShadow: "0 0 20px rgba(13,242,128,0.3)",
              }}
            >
              Create Tournament
            </Link>
          </div>
        )}

        {/* Tournament cards grid */}
        {!tournamentsQuery.isLoading && !tournamentsQuery.isError && filteredTournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTournaments.map((t, i) => (
              <TournamentGroupCard key={t.seasonId} tournament={t} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
