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
      tournaments.find(
        (item) => item.sessionId.toLowerCase() === sessionId.toLowerCase(),
      ) ?? null
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
    if (liveStatus !== "live") {
      setSubmitError("Tournament is not live.");
      return;
    }
    if (!balance?.largestCoin) {
      setSubmitError("No USDT coin object found. Claim faucet first.");
      return;
    }

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
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Failed to submit prediction transaction.");
      }
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
      setRefundMessage(
        error instanceof Error ? error.message : "Failed to claim refund.",
      );
    }
  }

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >


      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-6">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-sm leading-none">arrow_back</span>
            Back to tournaments
          </Link>
        </div>

        {tournamentsQuery.isLoading && (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
            Loading tournament from on-chain data...
          </div>
        )}

        {!tournamentsQuery.isLoading && !tournament && (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <h2 className="text-xl font-black mb-2">Tournament not found</h2>
            <p className="text-slate-400 text-sm mb-5">
              Session ID <span className="font-mono">{sessionId ?? "-"}</span> is not available.
            </p>
            <Link
              href="/tournaments"
              className="inline-flex px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider"
              style={{ backgroundColor: "#0df280", color: "#0a0a0a" }}
            >
              Return to list
            </Link>
          </div>
        )}

        {tournament && (
          <>
            <div className="glass-panel rounded-2xl p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                      {tournament.coinSymbol} / USDT
                    </h2>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={
                        liveStatus === "live"
                          ? { color: "#0df280", backgroundColor: "rgba(13,242,128,0.12)" }
                          : liveStatus === "cancelled"
                            ? { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.12)" }
                          : liveStatus === "upcoming"
                            ? { color: "#f59e0b", backgroundColor: "rgba(245,158,11,0.12)" }
                            : { color: "#94a3b8", backgroundColor: "rgba(148,163,184,0.12)" }
                      }
                    >
                      {liveStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Season {tournament.seasonId || "-"} - Round {tournament.roundNumber || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="glass-panel-light rounded-xl px-3 py-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Entry
                    </p>
                    <p className="font-black">{formatUSDT(tournament.entryFeeRaw)} USDT</p>
                  </div>
                  <div className="glass-panel-light rounded-xl px-3 py-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Pool
                    </p>
                    <p className="font-black">{formatUSDT(tournament.totalPoolRaw)} USDT</p>
                  </div>
                  <div className="glass-panel-light rounded-xl px-3 py-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Participants
                    </p>
                    <p className="font-black">{tournament.totalParticipants}</p>
                  </div>
                  <div className="glass-panel-light rounded-xl px-3 py-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Time Left
                    </p>
                    <p className="font-black">
                      {liveStatus === "upcoming"
                        ? `Starts in ${formatTimeLeft(tournament.startTimeMs)}`
                        : liveStatus === "cancelled"
                          ? "Cancelled"
                        : formatTimeLeft(tournament.endTimeMs)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 flex flex-col gap-6">
                <div className="glass-panel rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                        Live Market ({finnhubSymbol})
                      </p>
                      <p className="text-3xl font-black" style={{ color: "#0df280" }}>
                        {quoteQuery.data ? `$${quoteQuery.data.c.toLocaleString()}` : "-"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {quoteQuery.data
                          ? `24h high $${quoteQuery.data.h.toLocaleString()} - 24h low $${quoteQuery.data.l.toLocaleString()}`
                          : "Waiting for quote feed"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                        24h Change
                      </p>
                      <p
                        className="text-2xl font-black"
                        style={{
                          color:
                            typeof quoteQuery.data?.dp === "number" && quoteQuery.data.dp < 0
                              ? "#ef4444"
                              : "#0df280",
                        }}
                      >
                        {typeof quoteQuery.data?.dp === "number"
                          ? `${quoteQuery.data.dp.toFixed(2)}%`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="w-full rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
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

                <div
                  id="join-tournament"
                  className="glass-panel rounded-2xl p-6 scroll-mt-28 transition-all duration-700"
                  style={
                    isJoinHighlighted
                      ? {
                          border: "1px solid rgba(13,242,128,0.85)",
                          boxShadow:
                            "0 0 0 2px rgba(13,242,128,0.28), 0 0 28px rgba(13,242,128,0.3)",
                          backgroundColor: "rgba(13,242,128,0.06)",
                        }
                      : undefined
                  }
                >
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4">
                    Join Tournament Round
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => {
                        setSelectedDirection(DIRECTION.UP);
                        resetJoin();
                        setSubmitError(null);
                      }}
                      className="py-4 rounded-xl font-black text-sm uppercase transition-all"
                      style={
                        selectedDirection === DIRECTION.UP
                          ? {
                              backgroundColor: "rgba(13,242,128,0.2)",
                              border: "2px solid #0df280",
                              color: "#0df280",
                            }
                          : {
                              backgroundColor: "rgba(13,242,128,0.07)",
                              border: "2px solid rgba(13,242,128,0.2)",
                              color: "#0df280",
                            }
                      }
                    >
                      Predict UP
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDirection(DIRECTION.DOWN);
                        resetJoin();
                        setSubmitError(null);
                      }}
                      className="py-4 rounded-xl font-black text-sm uppercase transition-all"
                      style={
                        selectedDirection === DIRECTION.DOWN
                          ? {
                              backgroundColor: "rgba(239,68,68,0.2)",
                              border: "2px solid #ef4444",
                              color: "#ef4444",
                            }
                          : {
                              backgroundColor: "rgba(239,68,68,0.07)",
                              border: "2px solid rgba(239,68,68,0.2)",
                              color: "#ef4444",
                            }
                      }
                    >
                      Predict DOWN
                    </button>
                  </div>

                  <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Entry Fee</span>
                      <span className="font-black">{formatUSDT(entryFeeRaw)} USDT</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-400">Wallet Balance</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-black"
                          style={{ color: hasEnoughBalance ? "#0df280" : "#ef4444" }}
                        >
                          {balance ? `${balance.formatted} USDT` : account ? "..." : "-"}
                        </span>
                        {account && !hasEnoughBalance && (
                          <FaucetButton address={account.address} onSuccess={refetchBalance} />
                        )}
                      </div>
                    </div>
                  </div>

                  {!account ? (
                    <div className="flex justify-center py-2">
                      <ConnectButton />
                    </div>
                  ) : (
                    <button
                      onClick={handleSubmitPrediction}
                      disabled={!canSubmit}
                      className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "#0df280",
                        color: "#0a0a0a",
                      }}
                    >
                      {isJoinPending
                        ? "Submitting transaction..."
                        : liveStatus === "cancelled"
                          ? "Tournament cancelled"
                        : liveStatus !== "live"
                          ? "Tournament not live"
                          : !hasEnoughBalance
                            ? "Insufficient USDT"
                            : selectedDirection
                              ? `Join + Pay ${formatUSDT(entryFeeRaw)} USDT (${formatDirection(selectedDirection)})`
                              : "Choose direction"}
                    </button>
                  )}

                  {(submitError || isJoinError) && (
                    <p className="text-xs text-red-400 font-bold mt-3">
                      {submitError ??
                        (joinError instanceof Error
                          ? joinError.message
                          : "Failed to submit prediction.")}
                    </p>
                  )}

                  {liveStatus !== "live" &&
                    liveStatus !== "cancelled" &&
                    nowMs >= (tournament?.startTimeMs ?? 0) && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-amber-300 font-bold">
                        Round not active on-chain yet. {isCreator ? "You (the creator)" : "Creator"} must run start round first.
                      </p>
                      {isCreator && (
                        <Link
                          href="/arena"
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#0df280] hover:underline"
                        >
                          Go to Control Board
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                      )}
                    </div>
                  )}

                  {liveStatus === "cancelled" && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-red-300 font-bold">
                        Tournament cancelled. Participants can claim refund.
                      </p>
                      {account && (
                        <button
                          type="button"
                          onClick={handleClaimRefund}
                          disabled={isClaimRefundPending}
                          className="w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: "rgba(239,68,68,0.18)",
                            color: "#fca5a5",
                            border: "1px solid rgba(239,68,68,0.35)",
                          }}
                        >
                          {isClaimRefundPending ? "Claiming refund..." : "Claim Refund"}
                        </button>
                      )}
                      {refundMessage && (
                        <p className="text-xs font-bold text-slate-200">{refundMessage}</p>
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
                          Refund tx: {refundTxDigest.slice(0, 12)}...
                        </a>
                      )}
                    </div>
                  )}

                  {isJoinSuccess && txDigest && (
                    <a
                      href={`${EXPLORER_BASE}/txblock/${txDigest}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-sky-300 hover:text-sky-200"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">
                        open_in_new
                      </span>
                      Transaction: {txDigest.slice(0, 12)}...
                    </a>
                  )}
                </div>
              </div>

              <div className="xl:col-span-1 flex flex-col gap-6">
                <div className="glass-panel rounded-2xl p-5">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4">
                    Round Stats
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Start</span>
                      <span className="font-bold text-right">{formatDateTime(tournament.startTimeMs)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">End</span>
                      <span className="font-bold text-right">{formatDateTime(tournament.endTimeMs)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Up Votes</span>
                      <span className="font-black" style={{ color: "#22c55e" }}>
                        {tournament.upCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Down Votes</span>
                      <span className="font-black" style={{ color: "#ef4444" }}>
                        {tournament.downCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Yield Pool</span>
                      <span className="font-black" style={{ color: "#3b82f6" }}>
                        {formatUSDT(tournament.yieldPoolRaw)} USDT
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest">Recent Joins</h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Round {tournament.roundNumber}
                    </span>
                  </div>

                  {joinEventsQuery.isLoading && (
                    <p className="text-sm text-slate-400">Loading join events...</p>
                  )}

                  {!joinEventsQuery.isLoading && joinEvents.length === 0 && (
                    <p className="text-sm text-slate-400">No join transactions yet.</p>
                  )}

                  <div className="space-y-2">
                    {joinEvents.map((event) => (
                      <div
                        key={`${event.txDigest}-${event.player}`}
                        className="rounded-xl px-3 py-2 text-xs"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-200">
                            {shortenAddress(event.player)}
                          </span>
                          <span
                            className="font-black"
                            style={{
                              color: event.direction === DIRECTION.UP ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {formatDirection(event.direction)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-slate-500">
                          <span>{formatUSDT(event.amountRaw)} USDT</span>
                          <a
                            href={`${EXPLORER_BASE}/txblock/${event.txDigest}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-white"
                          >
                            {event.txDigest.slice(0, 8)}...
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
