"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
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
    bg: "rgba(13,242,128,0.15)",
  },
  upcoming: {
    label: "UPCOMING",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  ended: {
    label: "ENDED",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.15)",
  },
  cancelled: {
    label: "CANCELLED",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
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

  const tournaments = useMemo(
    () => tournamentsQuery.data ?? [],
    [tournamentsQuery.data],
  );
  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      const statusMatch = statusFilter === "all" || tournament.status === statusFilter;
      const searchMatch =
        tournament.coinSymbol.toLowerCase().includes(search.toLowerCase()) ||
        String(tournament.roundNumber).includes(search);
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

    return {
      total: tournaments.length,
      live,
      upcoming,
      ended,
      cancelled,
      participants,
      totalPoolRaw,
    };
  }, [tournaments]);

  function getSelectedDirection(sessionId: string): PickDirection {
    return selectedDirectionBySession[sessionId] ?? DIRECTION.UP;
  }

  function setDirection(sessionId: string, direction: PickDirection) {
    setSelectedDirectionBySession((previous) => ({
      ...previous,
      [sessionId]: direction,
    }));
  }

  async function handleQuickJoin(tournament: OnChainTournament) {
    const sessionId = tournament.sessionId;

    if (!account) {
      setJoinErrorBySession((previous) => ({
        ...previous,
        [sessionId]: "Connect wallet first.",
      }));
      return;
    }

    if (tournament.status !== "live") {
      setJoinErrorBySession((previous) => ({
        ...previous,
        [sessionId]: "Tournament is not live yet.",
      }));
      return;
    }

    if (!balance?.largestCoin) {
      setJoinErrorBySession((previous) => ({
        ...previous,
        [sessionId]: "No USDT coin found. Claim faucet first.",
      }));
      return;
    }

    if (balance.raw < BigInt(tournament.entryFeeRaw)) {
      setJoinErrorBySession((previous) => ({
        ...previous,
        [sessionId]: "Insufficient USDT balance.",
      }));
      return;
    }

    const direction = getSelectedDirection(sessionId);
    setJoiningSessionId(sessionId);
    setJoinErrorBySession((previous) => ({ ...previous, [sessionId]: "" }));

    try {
      const result = await joinGame({
        sessionId,
        roundId: tournament.roundObjectId,
        registryId: tournament.registryId,
        direction,
        usdtCoinObjectId: balance.largestCoin.coinObjectId,
        entryFeeRaw: tournament.entryFeeRaw,
      });

      setJoinTxBySession((previous) => ({
        ...previous,
        [sessionId]: result.digest ?? "",
      }));

      await Promise.all([refetchBalance(), tournamentsQuery.refetch()]);
    } catch (error) {
      setJoinErrorBySession((previous) => ({
        ...previous,
        [sessionId]:
          error instanceof Error ? error.message : "Failed to submit join transaction.",
      }));
    } finally {
      setJoiningSessionId(null);
    }
  }

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >


      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic mb-2">
              On-Chain <span style={{ color: "#0df280" }}>Tournaments</span>
            </h2>
            <p className="text-slate-500 font-medium">
              Data below is loaded from live OneChain objects, not static mock data.
            </p>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Last refresh: {mounted ? new Date().toLocaleTimeString() : "--:--:--"}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Total", value: stats.total, color: "#0df280" },
            { label: "Live", value: stats.live, color: "#22c55e" },
            { label: "Upcoming", value: stats.upcoming, color: "#f59e0b" },
            { label: "Ended", value: stats.ended, color: "#94a3b8" },
            { label: "Cancelled", value: stats.cancelled, color: "#ef4444" },
            { label: "Pool", value: `${formatUSDT(stats.totalPoolRaw)} USDT`, color: "#3b82f6" },
          ].map((item) => (
            <div key={item.label} className="glass-panel rounded-xl p-3">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.label}</p>
              <p className="text-lg font-black" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "live", "upcoming", "ended", "cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors"
                style={
                  statusFilter === status
                    ? { backgroundColor: "#0df280", color: "#0a0a0a" }
                    : { backgroundColor: "rgba(255,255,255,0.06)", color: "#94a3b8" }
                }
              >
                {status}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by coin or round number"
            className="w-full md:w-72 px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
          />
        </div>

        {tournamentsQuery.isLoading && (
          <div className="glass-panel rounded-2xl p-6 text-center text-slate-400">
            Loading tournaments from chain...
          </div>
        )}

        {tournamentsQuery.isError && (
          <div
            className="rounded-xl p-4 text-sm font-bold"
            style={{
              backgroundColor: "rgba(255,77,77,0.1)",
              color: "#ff9a9a",
              border: "1px solid rgba(255,77,77,0.2)",
            }}
          >
            Failed to load tournaments:{" "}
            {tournamentsQuery.error instanceof Error ? tournamentsQuery.error.message : "Unknown error"}
          </div>
        )}

        {!tournamentsQuery.isLoading && !tournamentsQuery.isError && filteredTournaments.length === 0 && (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-3">No on-chain tournaments found yet.</p>
            <Link
              href="/arena"
              className="inline-flex px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider"
              style={{ backgroundColor: "#0df280", color: "#0a0a0a" }}
            >
              Create First Tournament
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTournaments.map((tournament) => {
            const statusStyle = STATUS_STYLE[tournament.status];
            const selectedDirection = getSelectedDirection(tournament.sessionId);
            const isJoining = joiningSessionId === tournament.sessionId;
            const joinTx = joinTxBySession[tournament.sessionId];
            const joinError = joinErrorBySession[tournament.sessionId];
            const isLive = tournament.status === "live";
            return (
              <div
                key={tournament.sessionId}
                className="glass-panel rounded-2xl p-5 flex flex-col gap-4"
                style={{ borderLeft: `4px solid ${statusStyle.color}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg uppercase italic">
                      {tournament.coinSymbol} / USDT
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      Season {tournament.seasonId || "-"} • Round #{tournament.roundNumber || "-"}
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
                  >
                    {statusStyle.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Entry Fee</p>
                    <p className="font-black">{formatUSDT(tournament.entryFeeRaw)} USDT</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Participants</p>
                    <p className="font-black">{tournament.totalParticipants}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Starts</p>
                    <p className="font-bold text-xs text-slate-300">{formatDateTime(tournament.startTimeMs)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ends</p>
                    <p className="font-bold text-xs text-slate-300">{formatDateTime(tournament.endTimeMs)}</p>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-400">
                  {tournament.status === "upcoming" && (
                    <span>Starts in {formatTimeLeft(tournament.startTimeMs)}</span>
                  )}
                  {tournament.status === "live" && (
                    <span>Ends in {formatTimeLeft(tournament.endTimeMs)}</span>
                  )}
                  {tournament.status === "ended" && <span>Tournament ended</span>}
                  {tournament.status === "cancelled" && <span>Tournament cancelled</span>}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDirection(tournament.sessionId, DIRECTION.UP)}
                    disabled={!isLive}
                    className="rounded-lg p-2 text-center"
                    style={
                      selectedDirection === DIRECTION.UP
                        ? {
                            backgroundColor: "rgba(34,197,94,0.2)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.7)",
                          }
                        : {
                            backgroundColor: "rgba(34,197,94,0.1)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.3)",
                          }
                    }
                  >
                    UP: {tournament.upCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection(tournament.sessionId, DIRECTION.DOWN)}
                    disabled={!isLive}
                    className="rounded-lg p-2 text-center"
                    style={
                      selectedDirection === DIRECTION.DOWN
                        ? {
                            backgroundColor: "rgba(239,68,68,0.2)",
                            color: "#ef4444",
                            border: "1px solid rgba(239,68,68,0.7)",
                          }
                        : {
                            backgroundColor: "rgba(239,68,68,0.1)",
                            color: "#ef4444",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }
                    }
                  >
                    DOWN: {tournament.downCount}
                  </button>
                </div>

                <div className="mt-1 grid grid-cols-2 gap-3">
                  <Link
                    href={`/tournaments/${tournament.sessionId}`}
                    className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "#e2e8f0",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    View Tournament
                  </Link>

                  {isLive ? (
                    <button
                      type="button"
                      onClick={() => handleQuickJoin(tournament)}
                      disabled={isJoining}
                      className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center"
                      style={{
                        backgroundColor: "#0df280",
                        color: "#0a0a0a",
                        opacity: isJoining ? 0.6 : 1,
                      }}
                    >
                      {isJoining
                        ? "Paying Fee..."
                        : `Join + Pay ${formatUSDT(tournament.entryFeeRaw)} USDT`}
                    </button>
                  ) : tournament.status === "upcoming" ? (
                    <Link
                      href={`/tournaments/${tournament.sessionId}#join-tournament`}
                      className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center"
                      style={{ backgroundColor: "#0df280", color: "#0a0a0a" }}
                    >
                      Join Tournament
                    </Link>
                  ) : tournament.status === "cancelled" ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center opacity-60 cursor-not-allowed"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.12)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      Cancelled
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center opacity-60 cursor-not-allowed"
                      style={{
                        backgroundColor: "rgba(148,163,184,0.12)",
                        color: "#94a3b8",
                        border: "1px solid rgba(148,163,184,0.3)",
                      }}
                    >
                      Tournament Ended
                    </button>
                  )}
                </div>

                {joinError && (
                  <p className="text-xs font-bold text-red-400 leading-snug">{joinError}</p>
                )}

                {joinTx && (
                  <a
                    href={`${EXPLORER_BASE}/txblock/${joinTx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-sky-300 hover:text-sky-200"
                  >
                    Transaction: {joinTx.slice(0, 12)}...
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
