"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ConnectButton, useCurrentAccount } from "@onelabs/dapp-kit";
import { useLeaderboardRows } from "@/hooks/useLeaderboard";
import {
  useOnChainTournaments,
  usePlayerJoinEvents,
  usePlayerClaimEvents,
  type OnChainTournament,
  type JoinGameEvent,
} from "@/hooks/useOnChainTournaments";
import { useMultiRoundTournaments, type TournamentGroup } from "@/hooks/useMultiRoundTournaments";
import { useUSDTBalance } from "@/hooks/useUSDTBalance";
import { useClaimReward } from "@/hooks/useClaimReward";
import {
  DIRECTION,
  EXPLORER_BASE,
  formatUSDT,
} from "@/lib/constants";
import { FaucetButton } from "@/components/FaucetButton";

/* ─── Types ──────────────────────────────────────────────────────── */
type ClaimStates = Record<
  string,
  { status: "pending" | "done" | "error"; digest?: string; error?: string }
>;

type EnrichedEvent = JoinGameEvent & {
  tournament: OnChainTournament | undefined;
  outcome: "won" | "lost" | "pending";
};

type PlayerGroup = {
  group: TournamentGroup;
  playerRounds: EnrichedEvent[];
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function formatDate(timestampMs: number): string {
  if (!timestampMs) return "-";
  return new Date(timestampMs).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rankColor(rank: number): string {
  if (rank === 1) return "#facc15";
  if (rank === 2) return "#cbd5e1";
  if (rank === 3) return "#c2410c";
  return "#94a3b8";
}

function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

/* ─── Stat card ─────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="glass-panel rounded-xl px-4 py-4 animate-card-enter relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${color}08 0%, transparent 60%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="material-symbols-outlined text-[15px]" style={{ color }}>
            {icon}
          </span>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            {label}
          </p>
        </div>
        <p className="text-2xl font-black" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Tournament Group History Card ─────────────────────────────── */
function TournamentGroupCard({
  group,
  playerRounds,
  claimStates,
  claimedRoundIds,
  onClaim,
  mounted,
}: {
  group: TournamentGroup;
  playerRounds: EnrichedEvent[];
  claimStates: ClaimStates;
  claimedRoundIds: Set<string>;
  onClaim: (sessionId: string, roundObjectId: string) => void;
  mounted: boolean;
}) {
  const wins = playerRounds.filter((r) => r.outcome === "won").length;
  const finished = playerRounds.filter((r) => r.outcome !== "pending").length;
  const claimableRounds = playerRounds.filter((r) => {
    const t = r.tournament;
    if (!t) return false;
    const cs = claimStates[t.sessionId];
    const isAlreadyClaimed = claimedRoundIds.has(t.roundObjectId.toLowerCase()) || claimedRoundIds.has(String(t.roundNumber));
    return (
      t.status === "ended" &&
      t.isSettled &&
      !isAlreadyClaimed &&
      (!cs || cs.status === "error")
    );
  });
  const hasClaimable = claimableRounds.length > 0;

  const statusColor =
    group.status === "live"
      ? "#0df280"
      : group.status === "upcoming"
        ? "#f59e0b"
        : "#64748b";
  const statusBg =
    group.status === "live"
      ? "rgba(13,242,128,0.1)"
      : group.status === "upcoming"
        ? "rgba(245,158,11,0.1)"
        : "rgba(255,255,255,0.05)";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: hasClaimable
          ? "1px solid rgba(13,242,128,0.3)"
          : "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.02)",
      }}
    >
      {/* ── Card header ── */}
      <div
        className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          backgroundColor: "rgba(255,255,255,0.025)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Coin + season info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-slate-100">
                {group.coinSymbol} / USDT
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider"
                style={{ color: statusColor, backgroundColor: statusBg }}
              >
                {group.status}
              </span>
              {hasClaimable && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1"
                  style={{
                    color: "#0df280",
                    backgroundColor: "rgba(13,242,128,0.12)",
                    border: "1px solid rgba(13,242,128,0.2)",
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full animate-live-dot"
                    style={{ backgroundColor: "#0df280" }}
                  />
                  {claimableRounds.length} claimable
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Season {group.seasonId} · {group.totalRounds} total rounds ·{" "}
              {playerRounds.length} played ·{" "}
              {wins}/{finished} won
            </p>
          </div>
        </div>

        {/* Overall outcome badge */}
        {finished > 0 && (
          <span
            className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0"
            style={{
              color: wins === finished ? "#0df280" : wins > 0 ? "#f59e0b" : "#ef4444",
              backgroundColor:
                wins === finished
                  ? "rgba(13,242,128,0.1)"
                  : wins > 0
                    ? "rgba(245,158,11,0.1)"
                    : "rgba(239,68,68,0.1)",
            }}
          >
            {wins === finished
              ? "✓ All Won"
              : wins > 0
                ? `${wins}/${finished} Won`
                : "✗ All Lost"}
          </span>
        )}
      </div>

      {/* ── Round rows ── */}
      <div>
        {playerRounds.map((event, i) => {
          const t = event.tournament;
          const isUp = event.direction === DIRECTION.UP;
          const cs = t ? claimStates[t.sessionId] : undefined;
          const isAlreadyClaimed = t ? (claimedRoundIds.has(t.roundObjectId.toLowerCase()) || claimedRoundIds.has(String(t.roundNumber))) : false;
          
          const isClaimable =
            t &&
            t.status === "ended" &&
            t.isSettled &&
            !isAlreadyClaimed &&
            (!cs || cs.status === "error");
          const isDone = cs?.status === "done" || isAlreadyClaimed;
          const isPending = cs?.status === "pending";

          return (
            <div
              key={`${event.txDigest}-${i}`}
              className="px-5 py-3 flex items-center gap-3 flex-wrap"
              style={{
                borderBottom:
                  i < playerRounds.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : undefined,
                backgroundColor:
                  event.outcome === "won"
                    ? "rgba(13,242,128,0.02)"
                    : event.outcome === "lost"
                      ? "rgba(239,68,68,0.02)"
                      : "transparent",
              }}
            >
              {/* Round number */}
              <span className="text-[10px] font-black text-slate-600 w-10 shrink-0">
                R#{t?.roundNumber ?? event.roundNumber}
              </span>

              {/* Direction */}
              <span
                className="text-[11px] font-black px-2 py-0.5 rounded shrink-0"
                style={
                  isUp
                    ? { color: "#22c55e", backgroundColor: "rgba(34,197,94,0.1)" }
                    : { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }
                }
              >
                {isUp ? "▲ UP" : "▼ DOWN"}
              </span>

              {/* Stake */}
              <span className="text-xs text-slate-500 shrink-0">
                {formatUSDT(event.amountRaw)} USDT
              </span>

              {/* Time */}
              <span className="text-[10px] text-slate-700 shrink-0 hidden sm:inline">
                {mounted ? formatDate(event.timestampMs) : "…"}
              </span>

              {/* Right side */}
              <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
                {/* Outcome */}
                {event.outcome === "pending" ? (
                  <span className="text-[10px] text-slate-600 font-bold">Pending</span>
                ) : event.outcome === "won" ? (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ color: "#0df280", backgroundColor: "rgba(13,242,128,0.1)" }}
                  >
                    ✓ Won
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }}
                  >
                    ✗ Lost
                  </span>
                )}

                {/* Claim tx link if done */}
                {isDone && cs?.digest && (
                  <a
                    href={`${EXPLORER_BASE}/txblock/${cs.digest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-xs leading-none">
                      open_in_new
                    </span>
                    Claimed
                  </a>
                )}

                {/* Error */}
                {cs?.status === "error" && (
                  <span className="text-[10px] text-red-400 font-bold" title={cs.error}>
                    Error
                  </span>
                )}

                {/* Claim button */}
                {isClaimable && t && (
                  <button
                    type="button"
                    onClick={() => onClaim(t.sessionId, t.roundObjectId)}
                    disabled={isPending || isDone}
                    className="px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isDone ? "rgba(13,242,128,0.1)" : "#0df280",
                      color: isDone ? "#0df280" : "#0a0a0a",
                      border: isDone ? "1px solid rgba(13,242,128,0.3)" : "none",
                      boxShadow: isDone ? "none" : "0 0 14px rgba(13,242,128,0.28)",
                    }}
                  >
                    {isPending ? "…" : isDone ? "✓" : "Claim"}
                  </button>
                )}

                {/* Tx link */}
                <a
                  href={`${EXPLORER_BASE}/txblock/${event.txDigest}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-bold text-slate-600 hover:text-sky-400 flex items-center gap-0.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs leading-none">
                    open_in_new
                  </span>
                  {event.txDigest.slice(0, 8)}…
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function ProfilePage() {
  const account = useCurrentAccount();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { balance, refetch: refetchBalance } = useUSDTBalance(account?.address);
  const leaderboardQuery = useLeaderboardRows();
  const joinedEventsQuery = usePlayerJoinEvents(account?.address);
  const claimedEventsQuery = usePlayerClaimEvents(account?.address);
  const tournamentsQuery = useOnChainTournaments();
  const groupsQuery = useMultiRoundTournaments();
  const { claimReward } = useClaimReward();

  const [claimStates, setClaimStates] = useState<ClaimStates>({});

  /* ── derived data ── */
  // Build a Set containing both object-address and numeric-string identifiers
  // because the on-chain RewardClaimed event may emit either round_address (0x...)
  // or round_id (number) depending on the contract version.
  const claimedRoundIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of claimedEventsQuery.data ?? []) {
      if (e.roundObjectId) ids.add(e.roundObjectId.toLowerCase());
      if (e.roundNumber) ids.add(String(e.roundNumber));
    }
    return ids;
  }, [claimedEventsQuery.data]);
  const leaderboardRows = useMemo(() => leaderboardQuery.data ?? [], [leaderboardQuery.data]);
  const joinedEvents = useMemo(
    () => [...(joinedEventsQuery.data ?? [])].sort((a, b) => b.timestampMs - a.timestampMs),
    [joinedEventsQuery.data],
  );
  const tournaments = useMemo(() => tournamentsQuery.data ?? [], [tournamentsQuery.data]);
  const tournamentGroups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);

  /* round number → OnChainTournament lookup */
  const tournamentByRoundNumber = useMemo(() => {
    const map = new Map<number, OnChainTournament>();
    for (const t of tournaments) {
      if (!map.has(t.roundNumber)) map.set(t.roundNumber, t);
    }
    return map;
  }, [tournaments]);

  /* enrich each join event with tournament + outcome */
  const enrichedEvents = useMemo<EnrichedEvent[]>(
    () =>
      joinedEvents.map((event) => {
        const t = tournamentByRoundNumber.get(event.roundNumber);
        let outcome: "won" | "lost" | "pending" = "pending";
        if (t && t.winnerDirection !== 0) {
          outcome = event.direction === t.winnerDirection ? "won" : "lost";
        }
        return { ...event, tournament: t, outcome };
      }),
    [joinedEvents, tournamentByRoundNumber],
  );

  /* group enriched events by seasonId → TournamentGroup */
  const playerGroups = useMemo<PlayerGroup[]>(() => {
    const bySeasonId = new Map<number, EnrichedEvent[]>();
    for (const e of enrichedEvents) {
      const sid = e.tournament?.seasonId;
      if (sid === undefined) continue;
      const list = bySeasonId.get(sid) ?? [];
      list.push(e);
      bySeasonId.set(sid, list);
    }

    const result: PlayerGroup[] = [];
    for (const [sid, events] of bySeasonId.entries()) {
      const group = tournamentGroups.find((g) => g.seasonId === sid);
      if (!group) continue;
      result.push({
        group,
        playerRounds: [...events].sort(
          (a, b) => (a.tournament?.roundNumber ?? 0) - (b.tournament?.roundNumber ?? 0),
        ),
      });
    }
    return result.sort(
      (a, b) => b.group.prizeRound.startTimeMs - a.group.prizeRound.startTimeMs,
    );
  }, [enrichedEvents, tournamentGroups]);

  /* stats */
  const myRow = useMemo(
    () =>
      leaderboardRows.find(
        (row) => row.player.toLowerCase() === (account?.address ?? "").toLowerCase(),
      ) ?? null,
    [leaderboardRows, account?.address],
  );
  const wins = useMemo(
    () => enrichedEvents.filter((r) => r.outcome === "won").length,
    [enrichedEvents],
  );
  const totalFinished = useMemo(
    () => enrichedEvents.filter((r) => r.outcome !== "pending").length,
    [enrichedEvents],
  );
  const winRate = totalFinished > 0 ? Math.round((wins / totalFinished) * 100) : 0;
  const upPredictions = useMemo(
    () => joinedEvents.filter((e) => e.direction === DIRECTION.UP).length,
    [joinedEvents],
  );
  const downPredictions = joinedEvents.length - upPredictions;
  const upPct =
    joinedEvents.length > 0 ? Math.round((upPredictions / joinedEvents.length) * 100) : 50;

  /* total claimable count */
  const totalClaimable = useMemo(() => {
    let count = 0;
    for (const t of tournaments) {
      const cs = claimStates[t.sessionId];
      const isAlreadyClaimed = claimedRoundIds.has(t.roundObjectId.toLowerCase()) || claimedRoundIds.has(String(t.roundNumber));
      if (
        t.status === "ended" &&
        t.isSettled &&
        !isAlreadyClaimed &&
        joinedEvents.some((e) => e.roundNumber === t.roundNumber) &&
        (!cs || cs.status === "error")
      ) {
        count++;
      }
    }
    return count;
  }, [tournaments, joinedEvents, claimStates, claimedRoundIds]);

  const initial = account?.address ? account.address.slice(2, 4).toUpperCase() : "?";

  /* ── handlers ── */
  async function handleClaim(sessionId: string, roundObjectId: string) {
    setClaimStates((prev) => ({ ...prev, [sessionId]: { status: "pending" } }));
    try {
      const result = await claimReward(sessionId, roundObjectId);
      setClaimStates((prev) => ({
        ...prev,
        [sessionId]: { status: "done", digest: result.digest ?? "" },
      }));
      refetchBalance();
      claimedEventsQuery.refetch();
    } catch (err) {
      setClaimStates((prev) => ({
        ...prev,
        [sessionId]: {
          status: "error",
          error: err instanceof Error ? err.message : "Claim failed",
        },
      }));
    }
  }

  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="blue-cyber-grid absolute inset-0 opacity-30" />
        <div
          className="absolute top-0 left-1/2 w-[700px] h-[500px] rounded-full -translate-x-1/2 -translate-y-1/4"
          style={{
            background: "radial-gradient(circle, rgba(13,242,128,0.05) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-1/3 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">

        {/* ─────────────────────────────── NOT CONNECTED ── */}
        {!account && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center animate-ring-glow"
              style={{
                background:
                  "radial-gradient(circle, rgba(13,242,128,0.12), rgba(13,242,128,0.03))",
                border: "2px solid rgba(13,242,128,0.25)",
              }}
            >
              <span className="material-symbols-outlined text-6xl" style={{ color: "#0df280" }}>
                account_circle
              </span>
            </div>
            <div className="text-center max-w-sm">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic mb-3">
                My <span style={{ color: "#0df280" }}>Arena</span>
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Connect your wallet to view your stats, prediction history, and claim rewards.
              </p>
              <ConnectButton />
            </div>
            <div className="flex gap-4 opacity-30 pointer-events-none select-none mt-4">
              {["Win Rate", "Score", "Rank"].map((label, i) => (
                <div
                  key={label}
                  className="glass-panel rounded-xl px-6 py-4 text-center"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                    {label}
                  </p>
                  <p className="text-2xl font-black text-slate-600">??</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────── CONNECTED ── */}
        {account && (
          <>
            {/* ── Hero profile card ── */}
            <div
              className="glass-panel rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden animate-card-enter"
              style={{ borderTop: "2px solid rgba(13,242,128,0.35)" }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 100% at 0% 50%, rgba(13,242,128,0.05) 0%, transparent 60%)",
                }}
              />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(13,242,128,0.25), rgba(13,242,128,0.05))",
                      border: "2px solid rgba(13,242,128,0.4)",
                      color: "#0df280",
                      boxShadow: "0 0 30px rgba(13,242,128,0.15)",
                    }}
                  >
                    {initial}
                  </div>
                  {myRow && myRow.rank <= 3 && (
                    <div
                      className="absolute -top-2.5 -right-2.5 text-xl leading-none"
                      title={`Rank ${myRow.rank}`}
                    >
                      {rankLabel(myRow.rank)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">
                      My{" "}
                      <span
                        style={{
                          background: "linear-gradient(90deg, #0df280, #3b82f6)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Arena
                      </span>
                    </h1>
                    {myRow && (
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                        style={{
                          color: rankColor(myRow.rank),
                          backgroundColor: `${rankColor(myRow.rank)}18`,
                          border: `1px solid ${rankColor(myRow.rank)}30`,
                        }}
                      >
                        Global #{myRow.rank}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono text-slate-400 mb-1 truncate">
                    {account.address}
                  </p>
                  <p className="text-xs text-slate-600">
                    {playerGroups.length} tournament{playerGroups.length !== 1 ? "s" : ""} ·{" "}
                    {joinedEvents.length} rounds · {wins} wins · {winRate}% win rate
                    {(myRow?.currentStreak ?? 0) > 0 && (
                      <span style={{ color: "#f59e0b" }}>
                        {" "}
                        · 🔥 {myRow?.currentStreak} streak
                      </span>
                    )}
                  </p>
                </div>

                {/* Balance */}
                <div
                  className="rounded-2xl px-5 py-4 shrink-0"
                  style={{
                    backgroundColor: "rgba(13,242,128,0.06)",
                    border: "1px solid rgba(13,242,128,0.15)",
                  }}
                >
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                    USDT Balance
                  </p>
                  <p className="text-3xl font-black" style={{ color: "#0df280" }}>
                    {balance?.formatted ?? "0.00"}
                  </p>
                  <p className="text-[10px] text-slate-600 mb-2">USDT</p>
                  <FaucetButton address={account.address} onSuccess={refetchBalance} />
                </div>
              </div>
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <StatCard
                label="Tournaments"
                value={playerGroups.length}
                icon="sports_esports"
                color="#3b82f6"
                delay={0}
              />
              <StatCard
                label="Wins"
                value={wins}
                icon="trophy"
                color="#0df280"
                delay={50}
              />
              <StatCard
                label="Win Rate"
                value={`${winRate}%`}
                icon="percent"
                color={winRate >= 50 ? "#0df280" : "#ef4444"}
                delay={100}
              />
              <StatCard
                label="Score"
                value={(myRow?.totalScore ?? 0).toLocaleString()}
                icon="stars"
                color="#a855f7"
                delay={150}
              />
              <StatCard
                label="Streak"
                value={`${myRow?.currentStreak ?? 0}${(myRow?.currentStreak ?? 0) > 0 ? " 🔥" : ""}`}
                icon="local_fire_department"
                color="#f59e0b"
                delay={200}
              />
              <StatCard
                label="Global Rank"
                value={myRow ? rankLabel(myRow.rank) : "-"}
                icon="leaderboard"
                color={myRow ? rankColor(myRow.rank) : "#64748b"}
                delay={250}
              />
            </div>

            {/* ── Prediction distribution ── */}
            {joinedEvents.length > 0 && (
              <div
                className="glass-panel rounded-2xl p-5 mb-6 animate-card-enter"
                style={{ animationDelay: "300ms" }}
              >
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                  Prediction Split
                </h3>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-black mb-2">
                      <span style={{ color: "#0df280" }}>
                        ▲ UP — {upPredictions} ({upPct}%)
                      </span>
                      <span style={{ color: "#ef4444" }}>
                        ▼ DOWN — {downPredictions} ({100 - upPct}%)
                      </span>
                    </div>
                    <div
                      className="h-3 rounded-full overflow-hidden"
                      style={{ background: "rgba(239,68,68,0.2)" }}
                    >
                      <div
                        className="h-full rounded-full animate-vote-bar"
                        style={{
                          width: `${upPct}%`,
                          background: "linear-gradient(90deg, #16a34a, #0df280)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-slate-600 font-bold uppercase mb-0.5">
                      Win rate
                    </p>
                    <p
                      className="text-4xl font-black"
                      style={{ color: winRate >= 50 ? "#0df280" : "#ef4444" }}
                    >
                      {winRate}%
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {wins}/{totalFinished} finished
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Claimable banner ── */}
            {totalClaimable > 0 && (
              <div
                className="rounded-2xl px-5 py-3.5 mb-6 flex items-center gap-3 animate-card-enter"
                style={{
                  animationDelay: "340ms",
                  backgroundColor: "rgba(13,242,128,0.06)",
                  border: "1px solid rgba(13,242,128,0.25)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-live-dot shrink-0"
                  style={{ backgroundColor: "#0df280" }}
                />
                <p className="text-xs font-black text-slate-200 flex-1">
                  You have{" "}
                  <span style={{ color: "#0df280" }}>{totalClaimable} reward{totalClaimable !== 1 ? "s" : ""}</span>{" "}
                  ready to claim — see below
                </p>
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ color: "#0df280" }}
                >
                  arrow_downward
                </span>
              </div>
            )}

            {/* ── Tournament history ── */}
            <div
              className="glass-panel rounded-2xl overflow-hidden animate-card-enter mb-6"
              style={{ animationDelay: "400ms" }}
            >
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: "#3b82f6" }}
                  >
                    history
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Tournament History
                  </h3>
                  {playerGroups.length > 0 && (
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-black"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#64748b" }}
                    >
                      {playerGroups.length}
                    </span>
                  )}
                </div>
                <Link
                  href="/tournaments"
                  className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: "#0df280" }}
                >
                  Join New
                  <span className="material-symbols-outlined text-sm leading-none">
                    arrow_forward
                  </span>
                </Link>
              </div>

              {/* Loading */}
              {(joinedEventsQuery.isLoading || tournamentsQuery.isLoading) && (
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 rounded-xl animate-shimmer" />
                  ))}
                </div>
              )}

              {/* Empty */}
              {!joinedEventsQuery.isLoading &&
                !tournamentsQuery.isLoading &&
                playerGroups.length === 0 && (
                  <div className="text-center py-16">
                    <span className="material-symbols-outlined text-5xl text-slate-700 block mb-4">
                      casino
                    </span>
                    <p className="text-slate-400 font-bold">No tournaments yet</p>
                    <p className="text-slate-600 text-xs mt-1 mb-6">
                      Join a tournament to start earning
                    </p>
                    <Link
                      href="/tournaments"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest"
                      style={{
                        backgroundColor: "#0df280",
                        color: "#0a0a0a",
                        boxShadow: "0 0 20px rgba(13,242,128,0.3)",
                      }}
                    >
                      <span className="material-symbols-outlined text-sm leading-none">
                        sports_esports
                      </span>
                      Browse Tournaments
                    </Link>
                  </div>
                )}

              {/* Tournament group cards */}
              {!joinedEventsQuery.isLoading && !tournamentsQuery.isLoading && playerGroups.length > 0 && (
                <div className="p-4 space-y-3">
                  {playerGroups.map(({ group, playerRounds }) => (
                    <TournamentGroupCard
                      key={group.seasonId}
                      group={group}
                      playerRounds={playerRounds}
                      claimStates={claimStates}
                      claimedRoundIds={claimedRoundIds}
                      onClaim={handleClaim}
                      mounted={mounted}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Quick links ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/leaderboard"
                className="glass-panel rounded-2xl p-5 flex items-center gap-4 group transition-all hover:border-yellow-500/20 animate-card-enter"
                style={{ animationDelay: "500ms", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(250,204,21,0.1)",
                    border: "1px solid rgba(250,204,21,0.2)",
                  }}
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ color: "#facc15" }}
                  >
                    emoji_events
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-200 group-hover:text-white transition-colors">
                    Global Leaderboard
                  </p>
                  <p className="text-xs text-slate-500">
                    {myRow
                      ? `You're ranked #${myRow.rank} globally`
                      : "See how you rank globally"}
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-600 group-hover:text-slate-400 transition-colors shrink-0">
                  arrow_forward
                </span>
              </Link>

              <Link
                href="/tournaments"
                className="glass-panel rounded-2xl p-5 flex items-center gap-4 group transition-all hover:border-green-500/20 animate-card-enter"
                style={{ animationDelay: "550ms", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(13,242,128,0.1)",
                    border: "1px solid rgba(13,242,128,0.2)",
                  }}
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ color: "#0df280" }}
                  >
                    sports_esports
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-200 group-hover:text-white transition-colors">
                    Browse Tournaments
                  </p>
                  <p className="text-xs text-slate-500">
                    Join live rounds and earn USDT prizes
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-600 group-hover:text-slate-400 transition-colors shrink-0">
                  arrow_forward
                </span>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
