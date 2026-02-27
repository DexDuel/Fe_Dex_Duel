"use client";

import { useEffect, useRef, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useCurrentAccount } from "@onelabs/dapp-kit";
import { useJoinGame } from "@/hooks/useJoinGame";
import {
  type OnChainTournament,
  useOnChainTournaments,
} from "@/hooks/useOnChainTournaments";
import { useUSDTBalance } from "@/hooks/useUSDTBalance";
import {
  DIRECTION,
  EXPLORER_BASE,
  formatUSDT,
} from "@/lib/constants";

type PickDirection = 1 | 2;

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
  ended: {
    label: "ENDED",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.2)",
  },
  cancelled: {
    label: "CANCELLED",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
  },
} as const;

function formatDateTime(timestampMs: number): string {
  if (!timestampMs) return "-";
  return new Date(timestampMs).toLocaleString();
}

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

/* ─── Animated stat card ─────────────────────────────────────────── */
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
      {/* ambient glow */}
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

/* ─── Tournament Card ───────────────────────────────────────────── */
function TournamentCard({
  tournament,
  selectedDirection,
  onSetDirection,
  onJoin,
  isJoining,
  joinTx,
  joinError,
  index,
}: {
  tournament: OnChainTournament;
  selectedDirection: PickDirection;
  onSetDirection: (dir: PickDirection) => void;
  onJoin: () => void;
  isJoining: boolean;
  joinTx?: string;
  joinError?: string;
  index: number;
}) {
  const statusStyle = STATUS_STYLE[tournament.status];
  const isLive = tournament.status === "live";
  const total = tournament.upCount + tournament.downCount;
  const upPct = total > 0 ? Math.round((tournament.upCount / total) * 100) : 50;
  const downPct = 100 - upPct;

  return (
    <div
      className={`glass-panel rounded-2xl flex flex-col gap-0 relative overflow-hidden tournament-card animate-card-enter ${isLive ? "tournament-card-live" : ""}`}
      style={{
        animationDelay: `${index * 80}ms`,
        borderTop: `2px solid ${statusStyle.border}`,
      }}
    >
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

      {/* Card header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Coin icon placeholder */}
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
                S{tournament.seasonId || "-"} · Round #{tournament.roundNumber || "-"}
              </p>
            </div>
          </div>

          {/* Status badge */}
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
      <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 20px" }} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-0 px-5 py-4">
        {[
          { label: "Entry Fee", value: `${formatUSDT(tournament.entryFeeRaw)} USDT` },
          { label: "Total Pool", value: `${formatUSDT(tournament.totalPoolRaw)} USDT` },
          { label: "Participants", value: tournament.totalParticipants },
          {
            label: tournament.status === "upcoming" ? "Starts in" : tournament.status === "live" ? "Ends in" : "Status",
            value:
              tournament.status === "upcoming"
                ? formatTimeLeft(tournament.startTimeMs)
                : tournament.status === "live"
                ? formatTimeLeft(tournament.endTimeMs)
                : tournament.status === "ended"
                ? "Ended"
                : "Cancelled",
          },
        ].map((item) => (
          <div key={item.label} className="py-1.5">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
              {item.label}
            </p>
            <p className="text-sm font-black text-slate-200 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Vote distribution bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
          <span style={{ color: "#22c55e" }}>UP {upPct}%</span>
          <span style={{ color: "#ef4444" }}>DOWN {downPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(239,68,68,0.25)" }}>
          <div
            className="h-full rounded-full animate-vote-bar"
            style={{
              width: `${upPct}%`,
              background: "linear-gradient(90deg, #16a34a, #22c55e)",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mt-1">
          <span>{tournament.upCount} players</span>
          <span>{tournament.downCount} players</span>
        </div>
      </div>

      {/* Direction buttons */}
      <div className="grid grid-cols-2 gap-2 px-5 pb-4">
        <button
          type="button"
          onClick={() => onSetDirection(DIRECTION.UP)}
          disabled={!isLive}
          className="rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all"
          style={
            selectedDirection === DIRECTION.UP
              ? {
                  backgroundColor: "rgba(34,197,94,0.22)",
                  color: "#22c55e",
                  border: "1.5px solid rgba(34,197,94,0.7)",
                  boxShadow: "0 0 12px rgba(34,197,94,0.2)",
                }
              : {
                  backgroundColor: "rgba(34,197,94,0.08)",
                  color: "#22c55e",
                  border: "1.5px solid rgba(34,197,94,0.25)",
                }
          }
        >
          ▲ UP ({tournament.upCount})
        </button>
        <button
          type="button"
          onClick={() => onSetDirection(DIRECTION.DOWN)}
          disabled={!isLive}
          className="rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all"
          style={
            selectedDirection === DIRECTION.DOWN
              ? {
                  backgroundColor: "rgba(239,68,68,0.22)",
                  color: "#ef4444",
                  border: "1.5px solid rgba(239,68,68,0.7)",
                  boxShadow: "0 0 12px rgba(239,68,68,0.2)",
                }
              : {
                  backgroundColor: "rgba(239,68,68,0.08)",
                  color: "#ef4444",
                  border: "1.5px solid rgba(239,68,68,0.25)",
                }
          }
        >
          ▼ DOWN ({tournament.downCount})
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 px-5 pb-5">
        <Link
          href={`/tournaments/${tournament.sessionId}`}
          className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all hover:opacity-80"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            color: "#cbd5e1",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          View Details
        </Link>

        {isLive ? (
          <button
            type="button"
            onClick={onJoin}
            disabled={isJoining}
            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all"
            style={{
              backgroundColor: isJoining ? "rgba(13,242,128,0.4)" : "#0df280",
              color: "#0a0a0a",
              opacity: isJoining ? 0.7 : 1,
              boxShadow: isJoining ? "none" : "0 0 20px rgba(13,242,128,0.3)",
            }}
          >
            {isJoining ? "Joining..." : `Join ${formatUSDT(tournament.entryFeeRaw)} USDT`}
          </button>
        ) : tournament.status === "upcoming" ? (
          <Link
            href={`/tournaments/${tournament.sessionId}#join-tournament`}
            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all hover:opacity-90"
            style={{
              backgroundColor: "#0df280",
              color: "#0a0a0a",
              boxShadow: "0 0 16px rgba(13,242,128,0.25)",
            }}
          >
            Join Tournament
          </Link>
        ) : tournament.status === "cancelled" ? (
          <div
            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center opacity-50 cursor-not-allowed"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            Cancelled
          </div>
        ) : (
          <div
            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center opacity-40 cursor-not-allowed"
            style={{
              backgroundColor: "rgba(148,163,184,0.08)",
              color: "#94a3b8",
              border: "1px solid rgba(148,163,184,0.2)",
            }}
          >
            Ended
          </div>
        )}
      </div>

      {joinError && (
        <p className="px-5 pb-4 text-[11px] font-bold text-red-400">{joinError}</p>
      )}
      {joinTx && (
        <a
          href={`${EXPLORER_BASE}/txblock/${joinTx}`}
          target="_blank"
          rel="noreferrer"
          className="px-5 pb-4 text-[11px] font-bold text-sky-300 hover:text-sky-200 block"
        >
          Tx: {joinTx.slice(0, 16)}...
        </a>
      )}
    </div>
  );
}

/* ─── Skeleton card ─────────────────────────────────────────────── */
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
      <div className="h-8 rounded-xl animate-shimmer" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 rounded-xl animate-shimmer" />
        <div className="h-10 rounded-xl animate-shimmer" />
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function TournamentsPage() {
  const account = useCurrentAccount();
  const { balance, refetch: refetchBalance } = useUSDTBalance(account?.address);
  const tournamentsQuery = useOnChainTournaments();
  const { joinGame } = useJoinGame();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [statusFilter, setStatusFilter] = useState<
    "all" | "live" | "upcoming" | "ended" | "cancelled"
  >("all");
  const [search, setSearch] = useState("");
  const [selectedDirectionBySession, setSelectedDirectionBySession] = useState<
    Record<string, PickDirection>
  >({});
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [joinTxBySession, setJoinTxBySession] = useState<Record<string, string>>({});
  const [joinErrorBySession, setJoinErrorBySession] = useState<Record<string, string>>({});

  const tournaments = useMemo(() => tournamentsQuery.data ?? [], [tournamentsQuery.data]);
  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const statusMatch =
        statusFilter === "all" ? t.status !== "cancelled" : t.status === statusFilter;
      const searchMatch =
        t.coinSymbol.toLowerCase().includes(search.toLowerCase()) ||
        String(t.roundNumber).includes(search);
      return statusMatch && searchMatch;
    });
  }, [tournaments, statusFilter, search]);

  const stats = useMemo(() => {
    const live = tournaments.filter((t) => t.status === "live").length;
    const upcoming = tournaments.filter((t) => t.status === "upcoming").length;
    const ended = tournaments.filter((t) => t.status === "ended").length;
    const cancelled = tournaments.filter((t) => t.status === "cancelled").length;
    const participants = tournaments.reduce((sum, t) => sum + t.totalParticipants, 0);
    const totalPoolRaw = tournaments.reduce((sum, t) => sum + t.totalPoolRaw, 0);
    return { total: tournaments.length, live, upcoming, ended, cancelled, participants, totalPoolRaw };
  }, [tournaments]);

  function getSelectedDirection(sessionId: string): PickDirection {
    return selectedDirectionBySession[sessionId] ?? DIRECTION.UP;
  }

  function setDirection(sessionId: string, direction: PickDirection) {
    setSelectedDirectionBySession((prev) => ({ ...prev, [sessionId]: direction }));
  }

  async function handleQuickJoin(tournament: OnChainTournament) {
    const sessionId = tournament.sessionId;
    if (!account) {
      setJoinErrorBySession((prev) => ({ ...prev, [sessionId]: "Connect wallet first." }));
      return;
    }
    if (tournament.status !== "live") {
      setJoinErrorBySession((prev) => ({ ...prev, [sessionId]: "Tournament is not live yet." }));
      return;
    }
    if (!balance?.largestCoin) {
      setJoinErrorBySession((prev) => ({ ...prev, [sessionId]: "No USDT coin found. Claim faucet first." }));
      return;
    }
    if (balance.raw < BigInt(tournament.entryFeeRaw)) {
      setJoinErrorBySession((prev) => ({ ...prev, [sessionId]: "Insufficient USDT balance." }));
      return;
    }
    const direction = getSelectedDirection(sessionId);
    setJoiningSessionId(sessionId);
    setJoinErrorBySession((prev) => ({ ...prev, [sessionId]: "" }));
    try {
      const result = await joinGame({
        sessionId,
        roundId: tournament.roundObjectId,
        registryId: tournament.registryId,
        direction,
        usdtCoinObjectId: balance.largestCoin.coinObjectId,
        entryFeeRaw: tournament.entryFeeRaw,
      });
      setJoinTxBySession((prev) => ({ ...prev, [sessionId]: result.digest ?? "" }));
      await Promise.all([refetchBalance(), tournamentsQuery.refetch()]);
    } catch (error) {
      setJoinErrorBySession((prev) => ({
        ...prev,
        [sessionId]: error instanceof Error ? error.message : "Failed to submit join transaction.",
      }));
    } finally {
      setJoiningSessionId(null);
    }
  }

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative z-10 text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >
      {/* ── Background decorations ── */}
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

        {/* ── Page hero ── */}
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
                  Live On-Chain
                </div>
                {stats.live > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full animate-live-dot"
                      style={{ backgroundColor: "#0df280" }}
                    />
                    <span className="text-xs font-black text-slate-400">
                      {stats.live} active now
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
                Real-time data loaded from live OneChain objects.
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
                Refreshed: {mounted ? new Date().toLocaleTimeString() : "--:--:--"}
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

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} color="#0df280" delay={0} />
          <StatCard label="Live" value={stats.live} color="#22c55e" delay={60} />
          <StatCard label="Upcoming" value={stats.upcoming} color="#f59e0b" delay={120} />
          <StatCard label="Ended" value={stats.ended} color="#94a3b8" delay={180} />
          <StatCard label="Cancelled" value={stats.cancelled} color="#ef4444" delay={240} />
          <StatCard
            label="Pool"
            value={`${formatUSDT(stats.totalPoolRaw)} USDT`}
            color="#3b82f6"
            delay={300}
          />
        </div>

        {/* ── Filters + Search ── */}
        <div
          className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-8 p-4 rounded-2xl"
          style={{
            backgroundColor: "rgba(22,27,34,0.5)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "live", "upcoming", "ended", "cancelled"] as const).map((status) => {
              const isActive = statusFilter === status;
              const activeColor =
                status === "all" ? "#0df280"
                : status === "live" ? "#22c55e"
                : status === "upcoming" ? "#f59e0b"
                : status === "ended" ? "#94a3b8"
                : "#ef4444";
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
              placeholder="Search coin or round..."
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

        {/* ── Loading skeletons ── */}
        {tournamentsQuery.isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Error state ── */}
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

        {/* ── Empty state ── */}
        {!tournamentsQuery.isLoading && !tournamentsQuery.isError && filteredTournaments.length === 0 && (
          <div
            className="glass-panel rounded-2xl p-12 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "rgba(13,242,128,0.1)", border: "1px solid rgba(13,242,128,0.2)" }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: "#0df280" }}>
                emoji_events
              </span>
            </div>
            <h3 className="text-xl font-black uppercase italic mb-2">No Tournaments Found</h3>
            <p className="text-slate-500 text-sm mb-6">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "No on-chain tournaments exist yet."}
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
              Create First Tournament
            </Link>
          </div>
        )}

        {/* ── Tournament cards grid ── */}
        {!tournamentsQuery.isLoading && !tournamentsQuery.isError && filteredTournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTournaments.map((tournament, i) => (
              <TournamentCard
                key={tournament.sessionId}
                tournament={tournament}
                index={i}
                selectedDirection={getSelectedDirection(tournament.sessionId)}
                onSetDirection={(dir) => setDirection(tournament.sessionId, dir)}
                onJoin={() => handleQuickJoin(tournament)}
                isJoining={joiningSessionId === tournament.sessionId}
                joinTx={joinTxBySession[tournament.sessionId]}
                joinError={joinErrorBySession[tournament.sessionId]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
