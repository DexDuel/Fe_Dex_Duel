"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ConnectButton, useCurrentAccount } from "@onelabs/dapp-kit";
import { useJoinGame } from "@/hooks/useJoinGame";
import { useClaimRefund } from "@/hooks/useClaimRefund";
import {
  toFinnhubSymbol,
  useMarketCandles,
  useMarketQuote,
} from "@/hooks/useMarketData";
import {
  useOnChainTournaments,
  useRoundJoinEvents,
} from "@/hooks/useOnChainTournaments";
import { useUSDTBalance } from "@/hooks/useUSDTBalance";
import {
  DIRECTION,
  EXPLORER_BASE,
  formatUSDT,
  shortenAddress,
} from "@/lib/constants";
import { FaucetButton } from "@/components/FaucetButton";
import { CandlestickChart } from "@/components/CandlestickChart";
import { CryptoIcon3D } from "@/components/CryptoIcon3D";

type PickDirection = 1 | 2;

function formatDateTime(timestampMs: number): string {
  if (!timestampMs) return "-";
  return new Date(timestampMs).toLocaleString();
}

function formatTimeLeft(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return "0m";
  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDirection(direction: number): "UP" | "DOWN" {
  return direction === DIRECTION.DOWN ? "DOWN" : "UP";
}

/* ─── Countdown ring ────────────────────────────────────────────── */
function CountdownDisplay({ targetMs, label }: { targetMs: number; label: string }) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(targetMs));

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(formatTimeLeft(targetMs)), 1000);
    return () => clearInterval(t);
  }, [targetMs]);

  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{label}</p>
      <p
        className="text-2xl font-black animate-timer tabular-nums"
        style={{ color: "#0df280", fontVariantNumeric: "tabular-nums" }}
      >
        {timeLeft}
      </p>
    </div>
  );
}

/* ─── Stat mini card ─────────────────────────────────────────────── */
function MiniStat({
  label,
  value,
  color = "#f1f5f9",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 relative overflow-hidden"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="font-black text-sm" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

/* ─── Join event row ─────────────────────────────────────────────── */
function JoinEventRow({
  player,
  direction,
  amountRaw,
  txDigest,
  delay = 0,
}: {
  player: string;
  direction: number;
  amountRaw: number;
  txDigest: string;
  delay?: number;
}) {
  const isUp = direction !== DIRECTION.DOWN;
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 animate-row-enter"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
          style={{
            backgroundColor: isUp ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            color: isUp ? "#22c55e" : "#ef4444",
          }}
        >
          {isUp ? "▲" : "▼"}
        </div>
        <span className="font-bold text-xs text-slate-300 truncate">{shortenAddress(player)}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-black" style={{ color: isUp ? "#22c55e" : "#ef4444" }}>
          {formatDirection(direction)}
        </span>
        <span className="text-[10px] text-slate-500">{formatUSDT(amountRaw)} USDT</span>
        <a
          href={`${EXPLORER_BASE}/txblock/${txDigest}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-sky-400 hover:text-sky-300 font-bold"
        >
          {txDigest.slice(0, 6)}…
        </a>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function TournamentDetailPage() {
  const params = useParams();
  const account = useCurrentAccount();
  const routeId = params?.id;
  const sessionId = Array.isArray(routeId) ? (routeId[0] as string) : (routeId as string);

  const tournamentsQuery = useOnChainTournaments();
  const tournaments = useMemo(() => tournamentsQuery.data ?? [], [tournamentsQuery.data]);

  const tournament = useMemo(() => {
    if (!sessionId) return null;
    return (
      tournaments.find((item) => item.sessionId.toLowerCase() === sessionId.toLowerCase()) ?? null
    );
  }, [sessionId, tournaments]);

  const isCreator = useMemo(() => {
    if (!account?.address || !tournament) return false;
    return tournament.creatorAddress.toLowerCase() === account.address.toLowerCase();
  }, [account, tournament]);

  const { balance, refetch: refetchBalance } = useUSDTBalance(account?.address);
  const {
    joinGame,
    isPending: isJoinPending,
    isSuccess: isJoinSuccess,
    isError: isJoinError,
    error: joinError,
    reset: resetJoin,
  } = useJoinGame();
  const {
    claimRefund,
    isPending: isClaimRefundPending,
    isError: isClaimRefundError,
    error: claimRefundError,
    reset: resetClaimRefund,
  } = useClaimRefund();

  const joinEventsQuery = useRoundJoinEvents(tournament?.roundNumber);
  const joinEvents = useMemo(
    () => (joinEventsQuery.data ?? []).slice(0, 12),
    [joinEventsQuery.data],
  );

  const finnhubSymbol = tournament ? toFinnhubSymbol(tournament.coinSymbol) : undefined;
  const quoteQuery = useMarketQuote(finnhubSymbol);
  const candlesQuery = useMarketCandles(finnhubSymbol, "5", 6);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [selectedDirection, setSelectedDirection] = useState<PickDirection | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refundTxDigest, setRefundTxDigest] = useState<string | null>(null);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);
  const [isJoinHighlighted, setIsJoinHighlighted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const runJoinHighlight = () => {
      if (window.location.hash !== "#join-tournament") return;
      setIsJoinHighlighted(true);
      timer = setTimeout(() => setIsJoinHighlighted(false), 2200);
    };
    runJoinHighlight();
    window.addEventListener("hashchange", runJoinHighlight);
    return () => {
      window.removeEventListener("hashchange", runJoinHighlight);
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  const entryFeeRaw = tournament?.entryFeeRaw ?? 0;
  const liveStatus = useMemo(() => {
    if (!tournament) return "upcoming" as const;
    if (tournament.status === "cancelled") return "cancelled" as const;
    if (tournament.status === "ended") return "ended" as const;
    if (tournament.isActive) return "live" as const;
    if (nowMs >= tournament.endTimeMs) return "ended" as const;
    return "upcoming" as const;
  }, [tournament, nowMs]);

  const hasEnoughBalance =
    tournament && balance ? balance.raw >= BigInt(tournament.entryFeeRaw) : false;

  const canSubmit =
    Boolean(account) &&
    Boolean(tournament) &&
    liveStatus === "live" &&
    Boolean(selectedDirection) &&
    Boolean(balance?.largestCoin) &&
    hasEnoughBalance &&
    !isJoinPending;

  async function handleSubmitPrediction() {
    if (!account || !tournament || !selectedDirection) return;
    if (liveStatus !== "live") { setSubmitError("Tournament is not live."); return; }
    if (!balance?.largestCoin) { setSubmitError("No USDT coin object found. Claim faucet first."); return; }
    setSubmitError(null);
    try {
      const result = await joinGame({
        sessionId: tournament.sessionId,
        roundId: tournament.roundObjectId,
        registryId: tournament.registryId,
        direction: selectedDirection,
        usdtCoinObjectId: balance.largestCoin.coinObjectId,
        entryFeeRaw: tournament.entryFeeRaw,
      });
      setTxDigest(result.digest ?? null);
      refetchBalance();
      await joinEventsQuery.refetch();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit prediction transaction.",
      );
    }
  }

  async function handleClaimRefund() {
    if (!account || !tournament) return;
    resetClaimRefund();
    setRefundMessage(null);
    setRefundTxDigest(null);
    try {
      const result = await claimRefund(tournament.roundObjectId);
      setRefundTxDigest(result.digest ?? null);
      setRefundMessage("Refund transaction submitted.");
      await Promise.all([refetchBalance(), tournamentsQuery.refetch(), joinEventsQuery.refetch()]);
    } catch (error) {
      setRefundMessage(error instanceof Error ? error.message : "Failed to claim refund.");
    }
  }

  const statusConfig = {
    live:      { color: "#0df280", bg: "rgba(13,242,128,0.12)", border: "rgba(13,242,128,0.35)" },
    upcoming:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
    ended:     { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)" },
  };
  const sc = statusConfig[liveStatus];

  const total = (tournament?.upCount ?? 0) + (tournament?.downCount ?? 0);
  const upPct = total > 0 ? Math.round(((tournament?.upCount ?? 0) / total) * 100) : 50;

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative z-10 text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="blue-cyber-grid absolute inset-0 opacity-30" />
        {liveStatus === "live" && (
          <div
            className="absolute top-0 left-1/2 w-[600px] h-[400px] rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              background: "radial-gradient(circle, rgba(13,242,128,0.07) 0%, transparent 65%)",
              filter: "blur(60px)",
            }}
          />
        )}
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">

        {/* ── Back nav ── */}
        <div className="mb-6">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
            All Tournaments
          </Link>
        </div>

        {/* ── Loading ── */}
        {tournamentsQuery.isLoading && (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-slate-600 animate-spin">refresh</span>
              <p className="text-slate-400 font-bold">Loading tournament from chain...</p>
            </div>
          </div>
        )}

        {/* ── Not found ── */}
        {!tournamentsQuery.isLoading && !tournament && (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 block mb-4">
              search_off
            </span>
            <h2 className="text-xl font-black mb-2">Tournament Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">
              Session <code className="text-slate-400 font-mono">{sessionId ?? "-"}</code> not found.
            </p>
            <Link
              href="/tournaments"
              className="inline-flex px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0df280", color: "#0a0a0a", boxShadow: "0 0 20px rgba(13,242,128,0.25)" }}
            >
              Back to List
            </Link>
          </div>
        )}

        {/* ── Tournament content ── */}
        {tournament && (
          <>
            {/* ── Tournament hero banner ── */}
            <div
              className="glass-panel rounded-2xl p-6 mb-6 relative overflow-hidden animate-card-enter"
              style={{ borderTop: `2px solid ${sc.border}` }}
            >
              {/* Glow bg */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 60% 80% at 0% 50%, ${sc.color}0a 0%, transparent 60%)`,
                }}
              />

              {/* Live strip */}
              {liveStatus === "live" && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${sc.color}, transparent)`,
                    animation: "gradientShift 2s ease infinite",
                    backgroundSize: "200% 100%",
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: coin + title */}
                <div className="flex items-center gap-5">
                  {tournament.coinSymbol && (
                    <CryptoIcon3D symbol={tournament.coinSymbol} size={72} />
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
                        {tournament.coinSymbol}
                        <span className="text-slate-500"> / USDT</span>
                      </h1>
                      <div className="flex items-center gap-1.5">
                        {liveStatus === "live" && (
                          <div
                            className="w-2.5 h-2.5 rounded-full animate-live-dot"
                            style={{ backgroundColor: sc.color }}
                          />
                        )}
                        <span
                          className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                          style={{ color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}
                        >
                          {liveStatus}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Season {tournament.seasonId || "-"} · Round #{tournament.roundNumber || "-"}
                    </p>
                    <p className="text-[10px] text-slate-600 font-bold mt-1 truncate max-w-xs">
                      Session: {tournament.sessionId.slice(0, 20)}...
                    </p>
                  </div>
                </div>

                {/* Right: stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                  <MiniStat label="Entry Fee" value={`${formatUSDT(tournament.entryFeeRaw)} USDT`} color="#0df280" />
                  <MiniStat label="Total Pool" value={`${formatUSDT(tournament.totalPoolRaw)} USDT`} color="#3b82f6" />
                  <MiniStat label="Participants" value={tournament.totalParticipants} color="#f59e0b" />
                  <div
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {liveStatus === "upcoming" ? (
                      <CountdownDisplay targetMs={tournament.startTimeMs} label="Starts In" />
                    ) : liveStatus === "live" ? (
                      <CountdownDisplay targetMs={tournament.endTimeMs} label="Ends In" />
                    ) : (
                      <>
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">
                          Status
                        </p>
                        <p className="font-black text-sm" style={{ color: sc.color }}>
                          {liveStatus === "cancelled" ? "Cancelled" : "Ended"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main content grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* ── LEFT: Chart + Join ── */}
              <div className="xl:col-span-2 flex flex-col gap-6">

                {/* Chart panel */}
                <div
                  className="glass-panel rounded-2xl p-6 animate-card-enter"
                  style={{ animationDelay: "80ms" }}
                >
                  {/* Live price header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                          Live Market · {finnhubSymbol}
                        </p>
                        <p
                          className="text-4xl font-black"
                          style={{
                            color: "#0df280",
                            animation: "priceFlicker 8s step-end infinite",
                          }}
                        >
                          {quoteQuery.data ? `$${quoteQuery.data.c.toLocaleString()}` : "—"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {quoteQuery.data
                            ? `24h H: $${quoteQuery.data.h.toLocaleString()} · L: $${quoteQuery.data.l.toLocaleString()}`
                            : "Waiting for market feed…"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                        24h Change
                      </p>
                      <p
                        className="text-3xl font-black"
                        style={{
                          color:
                            typeof quoteQuery.data?.dp === "number" && quoteQuery.data.dp < 0
                              ? "#ef4444"
                              : "#0df280",
                        }}
                      >
                        {typeof quoteQuery.data?.dp === "number"
                          ? `${quoteQuery.data.dp > 0 ? "+" : ""}${quoteQuery.data.dp.toFixed(2)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Candlestick chart */}
                  <div
                    className="w-full rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(13,242,128,0.1)" }}
                  >
                    <CandlestickChart
                      candles={candlesQuery.data}
                      quote={quoteQuery.data}
                      symbol={finnhubSymbol ?? tournament.coinSymbol}
                      isLoading={candlesQuery.isLoading || quoteQuery.isLoading}
                    />
                  </div>

                  {quoteQuery.isError && (
                    <p className="text-xs text-red-400 font-bold mt-3">
                      Quote error:{" "}
                      {quoteQuery.error instanceof Error ? quoteQuery.error.message : "Unknown"}
                    </p>
                  )}
                </div>

                {/* ── Join Tournament Panel ── */}
                <div
                  id="join-tournament"
                  className="glass-panel rounded-2xl p-6 scroll-mt-28 transition-all duration-700 animate-card-enter"
                  style={{
                    animationDelay: "160ms",
                    ...(isJoinHighlighted
                      ? {
                          border: "1.5px solid rgba(13,242,128,0.8)",
                          boxShadow: "0 0 0 3px rgba(13,242,128,0.2), 0 0 40px rgba(13,242,128,0.25)",
                          backgroundColor: "rgba(13,242,128,0.04)",
                        }
                      : {}),
                  }}
                >
                  <h2 className="text-sm font-black uppercase tracking-widest mb-5">
                    Join Tournament Round
                  </h2>

                  {/* Direction buttons */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <button
                      onClick={() => {
                        setSelectedDirection(DIRECTION.UP);
                        resetJoin();
                        setSubmitError(null);
                      }}
                      className="py-6 rounded-2xl font-black text-base uppercase tracking-wider transition-all relative overflow-hidden"
                      style={
                        selectedDirection === DIRECTION.UP
                          ? {
                              backgroundColor: "rgba(13,242,128,0.15)",
                              border: "2px solid #0df280",
                              color: "#0df280",
                              boxShadow: "0 0 30px rgba(13,242,128,0.25)",
                            }
                          : {
                              backgroundColor: "rgba(13,242,128,0.05)",
                              border: "2px solid rgba(13,242,128,0.2)",
                              color: "rgba(13,242,128,0.7)",
                            }
                      }
                    >
                      {selectedDirection === DIRECTION.UP && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(13,242,128,0.1) 0%, transparent 70%)",
                          }}
                        />
                      )}
                      <span className="relative z-10 flex flex-col items-center gap-1">
                        <span className="text-2xl">▲</span>
                        <span>Predict UP</span>
                        <span
                          className="text-xs font-bold opacity-60"
                          style={{ color: "inherit" }}
                        >
                          {tournament.upCount} votes · {upPct}%
                        </span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedDirection(DIRECTION.DOWN);
                        resetJoin();
                        setSubmitError(null);
                      }}
                      className="py-6 rounded-2xl font-black text-base uppercase tracking-wider transition-all relative overflow-hidden"
                      style={
                        selectedDirection === DIRECTION.DOWN
                          ? {
                              backgroundColor: "rgba(239,68,68,0.15)",
                              border: "2px solid #ef4444",
                              color: "#ef4444",
                              boxShadow: "0 0 30px rgba(239,68,68,0.25)",
                            }
                          : {
                              backgroundColor: "rgba(239,68,68,0.05)",
                              border: "2px solid rgba(239,68,68,0.2)",
                              color: "rgba(239,68,68,0.7)",
                            }
                      }
                    >
                      {selectedDirection === DIRECTION.DOWN && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(239,68,68,0.1) 0%, transparent 70%)",
                          }}
                        />
                      )}
                      <span className="relative z-10 flex flex-col items-center gap-1">
                        <span className="text-2xl">▼</span>
                        <span>Predict DOWN</span>
                        <span
                          className="text-xs font-bold opacity-60"
                          style={{ color: "inherit" }}
                        >
                          {tournament.downCount} votes · {100 - upPct}%
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* Vote distribution bar */}
                  <div className="mb-5">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(239,68,68,0.2)" }}>
                      <div
                        className="h-full rounded-full animate-vote-bar"
                        style={{
                          width: `${upPct}%`,
                          background: "linear-gradient(90deg, #16a34a, #0df280)",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1">
                      <span>UP {upPct}%</span>
                      <span>DOWN {100 - upPct}%</span>
                    </div>
                  </div>

                  {/* Fee summary */}
                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">Entry Fee</span>
                      <span className="font-black text-slate-100">{formatUSDT(entryFeeRaw)} USDT</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Your Balance</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-black"
                          style={{ color: hasEnoughBalance ? "#0df280" : "#ef4444" }}
                        >
                          {balance ? `${balance.formatted} USDT` : account ? "..." : "—"}
                        </span>
                        {account && !hasEnoughBalance && (
                          <FaucetButton address={account.address} onSuccess={refetchBalance} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  {!account ? (
                    <div className="flex justify-center py-2">
                      <ConnectButton />
                    </div>
                  ) : (
                    <button
                      onClick={handleSubmitPrediction}
                      disabled={!canSubmit}
                      className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: canSubmit ? "#0df280" : "rgba(255,255,255,0.06)",
                        color: canSubmit ? "#0a0a0a" : "#64748b",
                        boxShadow: canSubmit ? "0 0 24px rgba(13,242,128,0.3)" : "none",
                      }}
                    >
                      {isJoinPending
                        ? "Submitting transaction…"
                        : liveStatus === "cancelled"
                        ? "Tournament cancelled"
                        : liveStatus !== "live"
                        ? "Tournament not live"
                        : !hasEnoughBalance
                        ? "Insufficient USDT balance"
                        : selectedDirection
                        ? `Confirm — Join ${formatDirection(selectedDirection)} · ${formatUSDT(entryFeeRaw)} USDT`
                        : "Select a direction above"}
                    </button>
                  )}

                  {/* Errors */}
                  {(submitError || isJoinError) && (
                    <div
                      className="rounded-xl p-3 mt-3 text-xs font-bold flex items-center gap-2"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.08)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <span className="material-symbols-outlined text-base">error</span>
                      {submitError ?? (joinError instanceof Error ? joinError.message : "Failed.")}
                    </div>
                  )}

                  {/* Creator not started warning */}
                  {liveStatus !== "live" && liveStatus !== "cancelled" && nowMs >= (tournament?.startTimeMs ?? 0) && (
                    <div
                      className="rounded-xl p-3 mt-3 text-xs font-bold"
                      style={{
                        backgroundColor: "rgba(245,158,11,0.08)",
                        color: "#fcd34d",
                        border: "1px solid rgba(245,158,11,0.2)",
                      }}
                    >
                      <span className="material-symbols-outlined text-base align-middle mr-1">schedule</span>
                      Round not active on-chain yet.{" "}
                      {isCreator ? "You (creator)" : "The creator"} must run start round.
                      {isCreator && (
                        <Link
                          href="/arena"
                          className="ml-2 underline font-black"
                          style={{ color: "#0df280" }}
                        >
                          Go to Control Board →
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Cancelled refund section */}
                  {liveStatus === "cancelled" && (
                    <div className="mt-4 space-y-3">
                      <div
                        className="rounded-xl p-3 text-xs font-bold"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.08)",
                          color: "#fca5a5",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        Tournament cancelled. Claim your refund below.
                      </div>
                      {account && (
                        <button
                          type="button"
                          onClick={handleClaimRefund}
                          disabled={isClaimRefundPending}
                          className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: "rgba(239,68,68,0.15)",
                            color: "#fca5a5",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }}
                        >
                          {isClaimRefundPending ? "Claiming…" : "Claim Refund"}
                        </button>
                      )}
                      {refundMessage && (
                        <p className="text-xs font-bold text-slate-300">{refundMessage}</p>
                      )}
                      {isClaimRefundError && claimRefundError && (
                        <p className="text-xs font-bold text-red-400">{claimRefundError.message}</p>
                      )}
                      {refundTxDigest && (
                        <a
                          href={`${EXPLORER_BASE}/txblock/${refundTxDigest}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold text-sky-300 hover:text-sky-200"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Refund tx: {refundTxDigest.slice(0, 16)}…
                        </a>
                      )}
                    </div>
                  )}

                  {/* Success tx */}
                  {isJoinSuccess && txDigest && (
                    <a
                      href={`${EXPLORER_BASE}/txblock/${txDigest}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 text-xs font-bold text-sky-300 hover:text-sky-200"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Transaction: {txDigest.slice(0, 20)}…
                    </a>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Stats + Recent Joins ── */}
              <div className="xl:col-span-1 flex flex-col gap-6">

                {/* Round stats */}
                <div
                  className="glass-panel rounded-2xl p-5 animate-card-enter"
                  style={{ animationDelay: "120ms" }}
                >
                  <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-slate-400">
                    Round Stats
                  </h3>

                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Start Time", value: formatDateTime(tournament.startTimeMs) },
                      { label: "End Time", value: formatDateTime(tournament.endTimeMs) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-3">
                        <span className="text-slate-500 shrink-0">{item.label}</span>
                        <span className="font-bold text-right text-xs text-slate-300">{item.value}</span>
                      </div>
                    ))}

                    <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Up Votes</span>
                      <span className="font-black" style={{ color: "#22c55e" }}>
                        ▲ {tournament.upCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Down Votes</span>
                      <span className="font-black" style={{ color: "#ef4444" }}>
                        ▼ {tournament.downCount}
                      </span>
                    </div>

                    {/* Vote bar */}
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(239,68,68,0.2)" }}>
                      <div
                        className="h-full rounded-full animate-vote-bar"
                        style={{
                          width: `${upPct}%`,
                          background: "linear-gradient(90deg, #16a34a, #0df280)",
                        }}
                      />
                    </div>

                    <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Yield Pool</span>
                      <span className="font-black" style={{ color: "#3b82f6" }}>
                        {formatUSDT(tournament.yieldPoolRaw)} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Min Players</span>
                      <span className="font-bold text-slate-300">{tournament.minParticipants}</span>
                    </div>
                  </div>
                </div>

                {/* Recent joins */}
                <div
                  className="glass-panel rounded-2xl p-5 animate-card-enter"
                  style={{ animationDelay: "200ms" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Recent Joins
                    </h3>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-black"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#64748b" }}
                    >
                      Round {tournament.roundNumber}
                    </span>
                  </div>

                  {joinEventsQuery.isLoading && (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-10 rounded-xl animate-shimmer" />
                      ))}
                    </div>
                  )}

                  {!joinEventsQuery.isLoading && joinEvents.length === 0 && (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-3xl text-slate-700 block mb-2">
                        group
                      </span>
                      <p className="text-sm text-slate-500">No join transactions yet.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {joinEvents.map((event, i) => (
                      <JoinEventRow
                        key={`${event.txDigest}-${event.player}`}
                        player={event.player}
                        direction={event.direction}
                        amountRaw={event.amountRaw}
                        txDigest={event.txDigest}
                        delay={i * 50}
                      />
                    ))}
                  </div>
                </div>

                {/* Creator info */}
                <div
                  className="glass-panel rounded-2xl p-4 animate-card-enter"
                  style={{ animationDelay: "280ms" }}
                >
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-2">
                    Created by
                  </p>
                  <p className="text-xs font-mono text-slate-400 truncate">
                    {tournament.creatorAddress}
                  </p>
                  {isCreator && (
                    <div className="mt-2">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-black"
                        style={{ backgroundColor: "rgba(13,242,128,0.15)", color: "#0df280" }}
                      >
                        You created this
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
