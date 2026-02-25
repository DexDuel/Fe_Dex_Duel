"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { ConnectButton, useCurrentAccount } from "@onelabs/dapp-kit";
import { useCreateTournament } from "@/hooks/useCreateTournament";
import { toFinnhubSymbol, useMarketSymbols } from "@/hooks/useMarketData";
import { useOnChainTournaments } from "@/hooks/useOnChainTournaments";
import { useCancelTournament } from "@/hooks/useCancelTournament";
import { useStartRound } from "@/hooks/useStartRound";
import { EXPLORER_BASE, isCreateTournamentAdmin } from "@/lib/constants";

type FormState = {
  roundId: string;
  seasonId: string;
  coinSymbol: string;
  entryFeeRaw: string;
  minParticipants: string;
  startTime: string;
  endTime: string;
  earlyWindowMinutes: string;
};

function toInputDate(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function initialFormState(): FormState {
  const now = new Date();
  const start = new Date(now.getTime() + 10 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    roundId: "1",
    seasonId: "1",
    coinSymbol: "BTC",
    entryFeeRaw: "100000000",
    minParticipants: "1",
    startTime: toInputDate(start),
    endTime: toInputDate(end),
    earlyWindowMinutes: "5",
  };
}

function parseDateInput(value: string): number {
  return new Date(value).getTime();
}

function formatDateTime(timestampMs: number): string {
  if (!timestampMs) return "-";
  return new Date(timestampMs).toLocaleString();
}

export default function CreateTournamentPage() {
  const account = useCurrentAccount();
  const isAdmin = isCreateTournamentAdmin(account?.address);
  const [form, setForm] = useState<FormState>(() => initialFormState());
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [startTxDigest, setStartTxDigest] = useState<string | null>(null);
  const [startMessage, setStartMessage] = useState<string | null>(null);
  const [cancelTxDigest, setCancelTxDigest] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const { createTournament, isPending, isSuccess, isError, error } =
    useCreateTournament();
  const {
    startRound,
    isPending: isStartPending,
    isError: isStartError,
    error: startError,
    reset: resetStartRound,
  } = useStartRound();
  const {
    cancelTournament,
    isPending: isCancelPending,
    isError: isCancelError,
    error: cancelError,
    reset: resetCancelTournament,
  } = useCancelTournament();

  const symbolsQuery = useMarketSymbols("BINANCE", "USDT");
  const availableSymbols = useMemo(
    () => symbolsQuery.data ?? [],
    [symbolsQuery.data],
  );
  const tournamentsQuery = useOnChainTournaments();
  const tournaments = useMemo(() => tournamentsQuery.data ?? [], [tournamentsQuery.data]);
  const selectedCoinSymbol = useMemo(() => {
    const current = form.coinSymbol.toUpperCase();
    if (availableSymbols.includes(current)) return current;
    return availableSymbols[0] ?? current;
  }, [availableSymbols, form.coinSymbol]);
  
  const myTournaments = useMemo(() => {
    if (!account?.address) return [];
    const normalized = account.address.toLowerCase();
    return tournaments.filter((t) => t.creatorAddress.toLowerCase() === normalized);
  }, [tournaments, account]);

  const validation = useMemo(() => {
    const roundId = Number(form.roundId);
    const seasonId = Number(form.seasonId);
    const entryFeeRaw = Number(form.entryFeeRaw);
    const minParticipants = Number(form.minParticipants);
    const earlyWindowMinutes = Number(form.earlyWindowMinutes);
    const startTimeMs = parseDateInput(form.startTime);
    const endTimeMs = parseDateInput(form.endTime);

    if (!Number.isFinite(roundId) || roundId <= 0) {
      return "Round ID must be greater than 0";
    }
    if (!Number.isFinite(seasonId) || seasonId <= 0) {
      return "Season ID must be greater than 0";
    }
    if (!form.coinSymbol.trim()) return "Coin symbol is required";
    if (!Number.isFinite(entryFeeRaw) || entryFeeRaw <= 0) {
      return "Entry fee must be greater than 0";
    }
    if (!Number.isFinite(minParticipants) || minParticipants <= 0) {
      return "Min participants must be greater than 0";
    }
    if (!Number.isFinite(earlyWindowMinutes) || earlyWindowMinutes < 0) {
      return "Early window must be 0 or greater";
    }
    if (!Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs)) {
      return "Start and end time are required";
    }
    if (endTimeMs <= startTimeMs) return "End time must be after start time";

    return null;
  }, [form]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !isAdmin || validation) return;

    const result = await createTournament({
      roundId: Number(form.roundId),
      seasonId: Number(form.seasonId),
      coinSymbol: selectedCoinSymbol,
      startTimeMs: parseDateInput(form.startTime),
      endTimeMs: parseDateInput(form.endTime),
      entryFeeRaw: Number(form.entryFeeRaw),
      minParticipants: Number(form.minParticipants),
      earlyWindowMinutes: Number(form.earlyWindowMinutes),
    });

    setTxDigest(result.digest ?? null);
  }

  async function getLiveStartPriceRaw(symbol: string): Promise<number> {
    const marketSymbol = toFinnhubSymbol(symbol);
    const response = await fetch(
      `/api/market/quote?symbol=${encodeURIComponent(marketSymbol)}`,
      { cache: "no-store" },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        typeof payload?.error === "string"
          ? payload.error
          : "Failed to fetch live price.",
      );
    }

    const currentPrice = Number(payload?.c);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      throw new Error("Invalid live price from market feed.");
    }

    return Math.floor(currentPrice * 100_000_000);
  }

  async function handleStartTournament(roundObjectId: string, coinSymbol: string) {
    if (!account || !isAdmin) return;

    resetStartRound();
    setStartMessage(null);
    setStartTxDigest(null);

    try {
      const priceStartRaw = await getLiveStartPriceRaw(coinSymbol);
      const result = await startRound({
        roundId: roundObjectId,
        priceStartRaw,
      });
      setStartTxDigest(result.digest ?? null);
      setStartMessage(
        `Round started for ${coinSymbol}/USDT with start price raw ${priceStartRaw}.`,
      );
      await tournamentsQuery.refetch();
    } catch (executionError) {
      setStartMessage(
        executionError instanceof Error
          ? executionError.message
          : "Failed to start tournament round.",
      );
    }
  }

  async function handleCancelTournament(sessionId: string, roundObjectId: string) {
    if (!account || !isAdmin) return;

    resetCancelTournament();
    setCancelMessage(null);
    setCancelTxDigest(null);

    try {
      const result = await cancelTournament({
        sessionId,
        roundId: roundObjectId,
      });
      setCancelTxDigest(result.digest ?? null);
      setCancelMessage("Tournament cancellation transaction submitted.");
      await tournamentsQuery.refetch();
    } catch (executionError) {
      setCancelMessage(
        executionError instanceof Error
          ? executionError.message
          : "Failed to cancel tournament.",
      );
    }
  }

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative z-10 text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >


      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
            Create <span style={{ color: "#0df280" }}>Tournament</span>
          </h2>
          <p className="text-slate-500 font-medium">
            Admin panel for creating tournament session and reviewing cancellation board.
          </p>
        </div>

        {!account && (
          <div className="glass-panel rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-300 mb-4">
              Connect wallet first to create tournament.
            </p>
            <div className="inline-flex">
              <ConnectButton />
            </div>
          </div>
        )}



        {account && isAdmin && (
          <div className="space-y-8">
            <form onSubmit={onSubmit} className="glass-panel rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-black uppercase tracking-wider">Create Tournament</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Round ID
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={form.roundId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, roundId: event.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Season ID
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={form.seasonId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, seasonId: event.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Coin Symbol (Finnhub BINANCE/USDT)
                  </span>
                  <select
                    value={selectedCoinSymbol}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, coinSymbol: event.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30 text-slate-100"
                  >
                    {availableSymbols.length === 0 && (
                      <option value={form.coinSymbol} style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>
                        {symbolsQuery.isLoading ? "Loading symbols..." : form.coinSymbol}
                      </option>
                    )}
                    {availableSymbols.map((symbol) => (
                      <option
                        key={symbol}
                        value={symbol}
                        style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                      >
                        {symbol}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {symbolsQuery.isError
                      ? "Failed loading symbols from Finnhub. Please retry."
                      : `${availableSymbols.length} symbols loaded from Finnhub /crypto/symbol`}
                  </p>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Entry Fee (raw)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={form.entryFeeRaw}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, entryFeeRaw: event.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
                    placeholder="100000000"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Min Participants
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={form.minParticipants}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, minParticipants: event.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Start Time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    End Time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, endTime: event.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
                  />
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Early Window Minutes
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.earlyWindowMinutes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      earlyWindowMinutes: event.target.value,
                    }))
                  }
                  className="w-full md:w-64 px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
                />
              </label>

              {validation && (
                <div
                  className="rounded-xl p-3 text-xs font-bold"
                  style={{
                    backgroundColor: "rgba(255,77,77,0.1)",
                    color: "#ff9a9a",
                    border: "1px solid rgba(255,77,77,0.2)",
                  }}
                >
                  {validation}
                </div>
              )}

              {isError && (
                <div
                  className="rounded-xl p-3 text-xs font-bold"
                  style={{
                    backgroundColor: "rgba(255,77,77,0.1)",
                    color: "#ff9a9a",
                    border: "1px solid rgba(255,77,77,0.2)",
                  }}
                >
                  {error?.message ?? "Create tournament transaction failed"}
                </div>
              )}

              {isSuccess && (
                <div
                  className="rounded-xl p-3 text-xs font-bold"
                  style={{
                    backgroundColor: "rgba(13,242,128,0.15)",
                    color: "#0df280",
                    border: "1px solid rgba(13,242,128,0.25)",
                  }}
                >
                  Tournament transaction submitted successfully.
                  {txDigest && (
                    <a
                      href={`${EXPLORER_BASE}/txblock/${txDigest}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 underline"
                    >
                      View tx
                    </a>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={Boolean(validation) || isPending}
                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0df280", color: "#0a0a0a" }}
              >
                {isPending ? "Creating..." : "Create Tournament"}
              </button>
            </form>

            <section className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black uppercase tracking-wider">
                  Tournament Control Board
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Start + cancel available
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-5">
                Use <span className="font-bold text-slate-300">Start</span> to run round and
                <span className="font-bold text-slate-300"> Cancel</span> to cancel upcoming or low-participation rounds.
              </p>

              {startMessage && (
                <div
                  className="rounded-xl p-3 text-xs font-bold mb-4"
                  style={
                    isStartError
                      ? {
                          backgroundColor: "rgba(255,77,77,0.1)",
                          color: "#ff9a9a",
                          border: "1px solid rgba(255,77,77,0.2)",
                        }
                      : {
                          backgroundColor: "rgba(13,242,128,0.15)",
                          color: "#0df280",
                          border: "1px solid rgba(13,242,128,0.25)",
                        }
                  }
                >
                  {startMessage}
                  {startTxDigest && (
                    <a
                      href={`${EXPLORER_BASE}/txblock/${startTxDigest}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 underline"
                    >
                      View tx
                    </a>
                  )}
                </div>
              )}

              {cancelMessage && (
                <div
                  className="rounded-xl p-3 text-xs font-bold mb-4"
                  style={
                    isCancelError
                      ? {
                          backgroundColor: "rgba(255,77,77,0.1)",
                          color: "#ff9a9a",
                          border: "1px solid rgba(255,77,77,0.2)",
                        }
                      : {
                          backgroundColor: "rgba(13,242,128,0.15)",
                          color: "#0df280",
                          border: "1px solid rgba(13,242,128,0.25)",
                        }
                  }
                >
                  {cancelMessage}
                  {cancelTxDigest && (
                    <a
                      href={`${EXPLORER_BASE}/txblock/${cancelTxDigest}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 underline"
                    >
                      View tx
                    </a>
                  )}
                </div>
              )}

              {tournamentsQuery.isLoading && (
                <p className="text-sm text-slate-400">Loading tournaments...</p>
              )}

              {!tournamentsQuery.isLoading && myTournaments.length === 0 && (
                <p className="text-sm text-slate-400">You haven&apos;t created any tournaments yet.</p>
              )}

              {!tournamentsQuery.isLoading && myTournaments.length > 0 && (
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        {["Session", "Coin", "Status", "Start", "End", "Participants", "Actions"].map(
                          (header) => (
                            <th
                              key={header}
                              className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500"
                            >
                              {header}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {myTournaments.map((tournament) => (
                        <tr
                          key={tournament.sessionId}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <td className="px-4 py-3 text-xs font-mono text-slate-400">
                            {tournament.sessionId.slice(0, 12)}...
                          </td>
                          <td className="px-4 py-3 text-sm font-bold">
                            {tournament.coinSymbol} / USDT
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[10px] font-black px-2 py-1 rounded uppercase"
                              style={
                                tournament.status === "live"
                                  ? { color: "#0df280", backgroundColor: "rgba(13,242,128,0.15)" }
                                  : tournament.status === "upcoming"
                                    ? {
                                        color: "#f59e0b",
                                        backgroundColor: "rgba(245,158,11,0.15)",
                                      }
                                    : tournament.status === "cancelled"
                                      ? {
                                          color: "#ef4444",
                                          backgroundColor: "rgba(239,68,68,0.15)",
                                        }
                                    : {
                                        color: "#94a3b8",
                                        backgroundColor: "rgba(148,163,184,0.15)",
                                      }
                              }
                            >
                              {tournament.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {mounted ? formatDateTime(tournament.startTimeMs) : "..."}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {mounted ? formatDateTime(tournament.endTimeMs) : "..."}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {tournament.totalParticipants}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={
                                  isStartPending ||
                                  tournament.status === "ended" ||
                                  tournament.status === "cancelled" ||
                                  tournament.isActive
                                }
                                onClick={() =>
                                  handleStartTournament(
                                    tournament.roundObjectId,
                                    tournament.coinSymbol,
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: "rgba(13,242,128,0.18)",
                                  color: "#0df280",
                                  border: "1px solid rgba(13,242,128,0.35)",
                                }}
                                title={
                                  tournament.isActive
                                    ? "Round already active."
                                    : "Run start_game admin transaction."
                                }
                              >
                                {isStartPending ? "Starting..." : tournament.isActive ? "Live" : "Start"}
                              </button>
                              {(() => {
                                const canCancel =
                                  tournament.status !== "ended" &&
                                  tournament.status !== "cancelled" &&
                                  (!tournament.isActive ||
                                    tournament.totalParticipants < tournament.minParticipants);
                                const cancelTitle = tournament.isActive
                                  ? `Only rounds below min participants (${tournament.minParticipants}) can be cancelled.`
                                  : "Run cancel_tournament admin transaction.";

                                return (
                                  <button
                                    type="button"
                                    disabled={isCancelPending || !canCancel}
                                    onClick={() =>
                                      handleCancelTournament(
                                        tournament.sessionId,
                                        tournament.roundObjectId,
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{
                                      backgroundColor: "rgba(239,68,68,0.18)",
                                      color: "#fca5a5",
                                      border: "1px solid rgba(239,68,68,0.35)",
                                    }}
                                    title={cancelTitle}
                                  >
                                    {isCancelPending ? "Cancelling..." : "Cancel"}
                                  </button>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isStartError && startError && (
                <p className="text-xs text-red-400 font-bold mt-3">
                  {startError.message}
                </p>
              )}
              {isCancelError && cancelError && (
                <p className="text-xs text-red-400 font-bold mt-3">
                  {cancelError.message}
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
