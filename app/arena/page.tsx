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

/* ─── Styled form field ─────────────────────────────────────────── */
function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[10px] text-slate-600 font-bold">{hint}</span>
      )}
    </label>
  );
}

/* ─── Status badge ──────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    live:      { color: "#0df280", bg: "rgba(13,242,128,0.15)" },
    upcoming:  { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    ended:     { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  };
  const c = config[status] ?? config.ended;
  return (
    <span
      className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {status}
    </span>
  );
}

/* ─── Alert box ─────────────────────────────────────────────────── */
function AlertBox({
  type,
  children,
}: {
  type: "error" | "success" | "warning";
  children: React.ReactNode;
}) {
  const config = {
    error:   { color: "#fca5a5", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: "error" },
    success: { color: "#0df280", bg: "rgba(13,242,128,0.08)", border: "rgba(13,242,128,0.25)", icon: "check_circle" },
    warning: { color: "#fcd34d", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: "warning" },
  }[type];

  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3 text-xs font-bold"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
      }}
    >
      <span className="material-symbols-outlined text-base shrink-0">{config.icon}</span>
      <span>{children}</span>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
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
  const { createTournament, isPending, isSuccess, isError, error } = useCreateTournament();
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
  const availableSymbols = useMemo(() => symbolsQuery.data ?? [], [symbolsQuery.data]);
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
    if (!Number.isFinite(roundId) || roundId <= 0) return "Round ID must be greater than 0";
    if (!Number.isFinite(seasonId) || seasonId <= 0) return "Season ID must be greater than 0";
    if (!form.coinSymbol.trim()) return "Coin symbol is required";
    if (!Number.isFinite(entryFeeRaw) || entryFeeRaw <= 0) return "Entry fee must be greater than 0";
    if (!Number.isFinite(minParticipants) || minParticipants <= 0) return "Min participants must be greater than 0";
    if (!Number.isFinite(earlyWindowMinutes) || earlyWindowMinutes < 0) return "Early window must be 0 or greater";
    if (!Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs)) return "Start and end time are required";
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
        typeof payload?.error === "string" ? payload.error : "Failed to fetch live price.",
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
      const result = await startRound({ roundId: roundObjectId, priceStartRaw });
      setStartTxDigest(result.digest ?? null);
      setStartMessage(`Round started for ${coinSymbol}/USDT with start price raw ${priceStartRaw}.`);
      await tournamentsQuery.refetch();
    } catch (executionError) {
      setStartMessage(
        executionError instanceof Error ? executionError.message : "Failed to start tournament round.",
      );
    }
  }

  async function handleCancelTournament(sessionId: string, roundObjectId: string) {
    if (!account || !isAdmin) return;
    resetCancelTournament();
    setCancelMessage(null);
    setCancelTxDigest(null);
    try {
      const result = await cancelTournament({ sessionId, roundId: roundObjectId });
      setCancelTxDigest(result.digest ?? null);
      setCancelMessage("Tournament cancellation transaction submitted.");
      await tournamentsQuery.refetch();
    } catch (executionError) {
      setCancelMessage(
        executionError instanceof Error ? executionError.message : "Failed to cancel tournament.",
      );
    }
  }

  const inputStyle = {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f1f5f9",
    outline: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "14px",
    width: "100%",
    transition: "border-color 0.2s, box-shadow 0.2s",
  } as const;

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative z-10 text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="blue-cyber-grid absolute inset-0 opacity-35" />
        <div
          className="absolute top-0 left-1/2 w-[500px] h-[500px] rounded-full -translate-x-1/2"
          style={{
            background: "radial-gradient(circle, rgba(13,242,128,0.05) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20">

        {/* ── Hero ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-2xl" style={{ color: "#0df280" }}>
              shield
            </span>
            <div
              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
              style={{
                backgroundColor: "rgba(245,158,11,0.1)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              Admin Panel
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic">
            My{" "}
            <span
              className="animate-gradient-text"
              style={{
                background: "linear-gradient(90deg, #0df280, #3b82f6, #0df280)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize: "200% auto",
              }}
            >
              Arena
            </span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm">
            Create tournament sessions and manage your rounds on-chain.
          </p>
        </div>

        {/* ── Not connected ── */}
        {!account && (
          <div
            className="glass-panel rounded-2xl p-12 text-center animate-card-enter"
            style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: "#3b82f6" }}>
                account_balance_wallet
              </span>
            </div>
            <h3 className="text-xl font-black uppercase italic mb-2">Connect Wallet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Connect your wallet to access the admin panel.
            </p>
            <div className="inline-flex">
              <ConnectButton />
            </div>
          </div>
        )}

        {/* ── Not admin ── */}
        {account && !isAdmin && (
          <div
            className="glass-panel rounded-2xl p-8 text-center animate-card-enter"
            style={{ border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: "#f59e0b" }}>
                lock
              </span>
            </div>
            <h3 className="text-lg font-black uppercase italic mb-2">Access Restricted</h3>
            <p className="text-slate-400 text-sm">
              Your wallet does not have admin privileges to create tournaments.
            </p>
          </div>
        )}

        {/* ── Admin panel ── */}
        {account && isAdmin && (
          <div className="space-y-8">

            {/* Create form */}
            <div
              className="glass-panel rounded-2xl p-7 animate-card-enter"
              style={{ animationDelay: "0ms" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-black uppercase tracking-widest">
                  Create New Tournament
                </h2>
                <div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(13,242,128,0.1)",
                    color: "#0df280",
                    border: "1px solid rgba(13,242,128,0.2)",
                  }}
                >
                  On-Chain
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField label="Round ID">
                    <input
                      type="number"
                      min={1}
                      value={form.roundId}
                      onChange={(e) => setForm((prev) => ({ ...prev, roundId: e.target.value }))}
                      className="form-field-glow"
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Season ID">
                    <input
                      type="number"
                      min={1}
                      value={form.seasonId}
                      onChange={(e) => setForm((prev) => ({ ...prev, seasonId: e.target.value }))}
                      className="form-field-glow"
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField
                    label="Coin Symbol"
                    hint={
                      symbolsQuery.isError
                        ? "Failed loading symbols. Please retry."
                        : `${availableSymbols.length} symbols from Finnhub`
                    }
                  >
                    <select
                      value={selectedCoinSymbol}
                      onChange={(e) => setForm((prev) => ({ ...prev, coinSymbol: e.target.value }))}
                      className="form-field-glow"
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {availableSymbols.length === 0 && (
                        <option value={form.coinSymbol} style={{ color: "#0f172a", backgroundColor: "#1e293b" }}>
                          {symbolsQuery.isLoading ? "Loading symbols..." : form.coinSymbol}
                        </option>
                      )}
                      {availableSymbols.map((symbol) => (
                        <option
                          key={symbol}
                          value={symbol}
                          style={{ color: "#f1f5f9", backgroundColor: "#0f172a" }}
                        >
                          {symbol}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Entry Fee (raw USDT)">
                    <input
                      type="number"
                      min={1}
                      value={form.entryFeeRaw}
                      onChange={(e) => setForm((prev) => ({ ...prev, entryFeeRaw: e.target.value }))}
                      className="form-field-glow"
                      style={inputStyle}
                      placeholder="100000000"
                    />
                  </FormField>

                  <FormField label="Min Participants">
                    <input
                      type="number"
                      min={1}
                      value={form.minParticipants}
                      onChange={(e) => setForm((prev) => ({ ...prev, minParticipants: e.target.value }))}
                      className="form-field-glow"
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Early Window (minutes)">
                    <input
                      type="number"
                      min={0}
                      value={form.earlyWindowMinutes}
                      onChange={(e) => setForm((prev) => ({ ...prev, earlyWindowMinutes: e.target.value }))}
                      className="form-field-glow"
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Start Time">
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      className="form-field-glow"
                      style={{ ...inputStyle, colorScheme: "dark" }}
                    />
                  </FormField>

                  <FormField label="End Time">
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      className="form-field-glow"
                      style={{ ...inputStyle, colorScheme: "dark" }}
                    />
                  </FormField>
                </div>

                {/* Validation / status messages */}
                {validation && <AlertBox type="warning">{validation}</AlertBox>}
                {isError && <AlertBox type="error">{error?.message ?? "Transaction failed"}</AlertBox>}
                {isSuccess && (
                  <AlertBox type="success">
                    Tournament submitted!{" "}
                    {txDigest && (
                      <a
                        href={`${EXPLORER_BASE}/txblock/${txDigest}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline ml-1"
                      >
                        View tx →
                      </a>
                    )}
                  </AlertBox>
                )}

                <button
                  type="submit"
                  disabled={Boolean(validation) || isPending}
                  className="w-full md:w-auto px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{
                    backgroundColor: isPending ? "rgba(13,242,128,0.5)" : "#0df280",
                    color: "#0a0a0a",
                    boxShadow: isPending ? "none" : "0 0 24px rgba(13,242,128,0.3)",
                  }}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                      Creating...
                    </span>
                  ) : (
                    "Create Tournament"
                  )}
                </button>
              </form>
            </div>

            {/* Control board */}
            <div
              className="glass-panel rounded-2xl p-7 animate-card-enter"
              style={{ animationDelay: "80ms" }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-black uppercase tracking-widest">
                    Tournament Control Board
                  </h2>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">
                    Start rounds with live price. Cancel low-participation rounds.
                  </p>
                </div>
                <div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(245,158,11,0.1)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  {myTournaments.length} tournaments
                </div>
              </div>

              {startMessage && (
                <div className="mb-4">
                  <AlertBox type={isStartError ? "error" : "success"}>
                    {startMessage}
                    {startTxDigest && (
                      <a
                        href={`${EXPLORER_BASE}/txblock/${startTxDigest}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline ml-2"
                      >
                        View tx →
                      </a>
                    )}
                  </AlertBox>
                </div>
              )}

              {cancelMessage && (
                <div className="mb-4">
                  <AlertBox type={isCancelError ? "error" : "success"}>
                    {cancelMessage}
                    {cancelTxDigest && (
                      <a
                        href={`${EXPLORER_BASE}/txblock/${cancelTxDigest}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline ml-2"
                      >
                        View tx →
                      </a>
                    )}
                  </AlertBox>
                </div>
              )}

              {tournamentsQuery.isLoading && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl animate-shimmer" />
                  ))}
                </div>
              )}

              {!tournamentsQuery.isLoading && myTournaments.length === 0 && (
                <div className="text-center py-10">
                  <span className="material-symbols-outlined text-3xl text-slate-600 block mb-3">
                    calendar_month
                  </span>
                  <p className="text-sm text-slate-500">You haven&apos;t created any tournaments yet.</p>
                </div>
              )}

              {!tournamentsQuery.isLoading && myTournaments.length > 0 && (
                <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                        {["Session", "Coin", "Status", "Start", "End", "Players", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myTournaments.map((tournament, i) => (
                        <tr
                          key={tournament.sessionId}
                          className="animate-row-enter transition-colors hover:bg-white/[0.02]"
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            animationDelay: `${i * 40}ms`,
                          }}
                        >
                          <td className="px-4 py-3.5 text-xs font-mono text-slate-500">
                            {tournament.sessionId.slice(0, 12)}…
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-black text-sm text-slate-200">
                              {tournament.coinSymbol}
                              <span className="text-slate-500 font-bold text-xs">/USDT</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={tournament.status} />
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {mounted ? formatDateTime(tournament.startTimeMs) : "..."}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {mounted ? formatDateTime(tournament.endTimeMs) : "..."}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-slate-300">
                            {tournament.totalParticipants}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={
                                  isStartPending ||
                                  tournament.status === "ended" ||
                                  tournament.status === "cancelled" ||
                                  tournament.isActive
                                }
                                onClick={() => handleStartTournament(tournament.roundObjectId, tournament.coinSymbol)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-80"
                                style={{
                                  backgroundColor: "rgba(13,242,128,0.15)",
                                  color: "#0df280",
                                  border: "1px solid rgba(13,242,128,0.3)",
                                }}
                                title={tournament.isActive ? "Round already active." : "Run start_game admin transaction."}
                              >
                                {isStartPending ? "…" : tournament.isActive ? "Live" : "Start"}
                              </button>

                              {(() => {
                                const canCancel =
                                  tournament.status !== "ended" &&
                                  tournament.status !== "cancelled" &&
                                  (!tournament.isActive || tournament.totalParticipants < tournament.minParticipants);
                                return (
                                  <button
                                    type="button"
                                    disabled={isCancelPending || !canCancel}
                                    onClick={() => handleCancelTournament(tournament.sessionId, tournament.roundObjectId)}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-80"
                                    style={{
                                      backgroundColor: "rgba(239,68,68,0.15)",
                                      color: "#fca5a5",
                                      border: "1px solid rgba(239,68,68,0.3)",
                                    }}
                                    title={
                                      tournament.isActive
                                        ? `Only below min (${tournament.minParticipants}) can cancel.`
                                        : "Run cancel_tournament admin transaction."
                                    }
                                  >
                                    {isCancelPending ? "…" : "Cancel"}
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
                <p className="text-xs text-red-400 font-bold mt-3">{startError.message}</p>
              )}
              {isCancelError && cancelError && (
                <p className="text-xs text-red-400 font-bold mt-3">{cancelError.message}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
