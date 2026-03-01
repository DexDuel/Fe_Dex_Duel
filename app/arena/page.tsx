"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ConnectButton, useCurrentAccount } from "@onelabs/dapp-kit";
import { useCreateTournament } from "@/hooks/useCreateTournament";
import { toFinnhubSymbol, useMarketSymbols } from "@/hooks/useMarketData";
import { useOnChainTournaments, useRoundJoinEvents, type OnChainTournament } from "@/hooks/useOnChainTournaments";
import { useCancelTournament } from "@/hooks/useCancelTournament";
import { useStartRound } from "@/hooks/useStartRound";
import { useCompleteGame } from "@/hooks/useCompleteGame";
import { useSettleGame } from "@/hooks/useSettleGame";
import { useLeaderboardRows } from "@/hooks/useLeaderboard";
import { buildTournamentGroup, type TournamentGroup } from "@/lib/tournamentGroup";
import { EXPLORER_BASE, isCreateTournamentAdmin, formatUSDT } from "@/lib/constants";

// ── Form state ──────────────────────────────────────────────────────
type FormState = {
  seasonId: string;
  coinSymbol: string;
  entryFeeRaw: string;
  minParticipants: string;
  startTime: string;
  totalRounds: string;
  roundDurationMinutes: string;
  gapMinutes: string;
  earlyWindowMinutes: string;
};

function toInputDate(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function initialFormState(): FormState {
  const now = new Date();
  const start = new Date(now.getTime() + 10 * 60_000);
  return {
    seasonId: String(Date.now()).slice(-4),
    coinSymbol: "BTC",
    entryFeeRaw: "100000000",
    minParticipants: "1",
    startTime: toInputDate(start),
    totalRounds: "3",
    roundDurationMinutes: "5",
    gapMinutes: "2",
    earlyWindowMinutes: "3",
  };
}

function parseDateInput(v: string): number {
  return new Date(v).getTime();
}

function formatDateTime(ts: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

// ── Reusable UI components ──────────────────────────────────────────
function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-slate-600 font-bold">{hint}</span>}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    live: { color: "#0df280", bg: "rgba(13,242,128,0.15)" },
    upcoming: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    ended: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  };
  const c = cfg[status] ?? cfg.ended;
  return (
    <span
      className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {status}
    </span>
  );
}

function AlertBox({ type, children }: { type: "error" | "success" | "warning"; children: React.ReactNode }) {
  const cfg = {
    error: { color: "#fca5a5", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: "error" },
    success: { color: "#0df280", bg: "rgba(13,242,128,0.08)", border: "rgba(13,242,128,0.25)", icon: "check_circle" },
    warning: { color: "#fcd34d", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: "warning" },
  }[type];
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3 text-xs font-bold"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      <span className="material-symbols-outlined text-base shrink-0">{cfg.icon}</span>
      <span>{children}</span>
    </div>
  );
}

// ── Fetch live price ────────────────────────────────────────────────
async function getLiveStartPriceRaw(symbol: string): Promise<number> {
  const marketSymbol = toFinnhubSymbol(symbol);
  const response = await fetch(
    `/api/market/quote?symbol=${encodeURIComponent(marketSymbol)}`,
    { cache: "no-store" },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to fetch live price.");
  }
  const currentPrice = Number(payload?.c);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    throw new Error("Invalid live price from market feed.");
  }
  return Math.floor(currentPrice * 100_000_000);
}

// ── Auto-finalize helpers ────────────────────────────────────────────
async function fetchJoinEventsForRound(roundNumber: number): Promise<Array<{ player: string; direction: number; timestampMs: number }>> {
  // We can't easily call client here outside hook — we accept events as passed-in data
  return [];
}

// ── Main page ────────────────────────────────────────────────────────
export default function CreateTournamentPage() {
  const account = useCurrentAccount();
  const isAdmin = isCreateTournamentAdmin(account?.address);
  const [form, setForm] = useState<FormState>(() => initialFormState());
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [createLog, setCreateLog] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  type TxState = { message: string | null; txDigest: string | null; isError: boolean };
  type CompleteFormState = { priceEndRaw: string; rank1: string; rank2: string; rank3: string };

  const [startStateByRound, setStartStateByRound] = useState<Record<string, TxState>>({});
  const [cancelStateByRound, setCancelStateByRound] = useState<Record<string, TxState>>({});
  const [completeFormByRound, setCompleteFormByRound] = useState<Record<string, CompleteFormState>>({});
  const [completeStateByRound, setCompleteStateByRound] = useState<Record<string, TxState>>({});
  const [settleStateByRound, setSettleStateByRound] = useState<Record<string, TxState>>({});
  const [autoFinalizeLog, setAutoFinalizeLog] = useState<string[]>([]);
  const autoFinalizeInProgress = useRef<Set<string>>(new Set());

  const { createTournament, isPending, isSuccess, isError, error } = useCreateTournament();
  const { startRound, isPending: isStartPending, reset: resetStartRound } = useStartRound();
  const { cancelTournament, isPending: isCancelPending, reset: resetCancelTournament } = useCancelTournament();
  const { completeGame } = useCompleteGame();
  const { settleGame } = useSettleGame();

  const symbolsQuery = useMarketSymbols("BINANCE", "USDT");
  const availableSymbols = useMemo(() => symbolsQuery.data ?? [], [symbolsQuery.data]);
  const tournamentsQuery = useOnChainTournaments();
  const tournaments = useMemo(() => tournamentsQuery.data ?? [], [tournamentsQuery.data]);
  const joinEventsQuery = useRoundJoinEvents();
  const leaderboardQuery = useLeaderboardRows();

  const selectedCoinSymbol = useMemo(() => {
    const current = form.coinSymbol.toUpperCase();
    if (availableSymbols.includes(current)) return current;
    return availableSymbols[0] ?? current;
  }, [availableSymbols, form.coinSymbol]);

  const myTournaments = useMemo(() => {
    if (!account?.address) return [];
    const normalized = account.address.toLowerCase();
    return tournaments.filter(
      (t) => t.creatorAddress.toLowerCase() === normalized && t.status !== "cancelled",
    );
  }, [tournaments, account]);

  // Group my tournaments by seasonId
  const myTournamentGroups = useMemo((): TournamentGroup[] => {
    const bySeasonId = new Map<number, OnChainTournament[]>();
    for (const r of myTournaments) {
      const list = bySeasonId.get(r.seasonId) ?? [];
      list.push(r);
      bySeasonId.set(r.seasonId, list);
    }
    return Array.from(bySeasonId.entries())
      .map(([sId, rounds]) => buildTournamentGroup(sId, rounds))
      .filter((g): g is TournamentGroup => g !== null)
      .sort((a, b) => b.prizeRound.startTimeMs - a.prizeRound.startTimeMs);
  }, [myTournaments]);

  const validation = useMemo(() => {
    const seasonId = Number(form.seasonId);
    const entryFeeRaw = Number(form.entryFeeRaw);
    const minParticipants = Number(form.minParticipants);
    const earlyWindowMinutes = Number(form.earlyWindowMinutes);
    const totalRounds = Number(form.totalRounds);
    const roundDurationMinutes = Number(form.roundDurationMinutes);
    const gapMinutes = Number(form.gapMinutes);
    const startTimeMs = parseDateInput(form.startTime);
    if (!Number.isFinite(seasonId) || seasonId <= 0) return "Season ID must be > 0";
    if (!form.coinSymbol.trim()) return "Coin symbol required";
    if (!Number.isFinite(entryFeeRaw) || entryFeeRaw <= 0) return "Entry fee must be > 0";
    if (!Number.isFinite(minParticipants) || minParticipants <= 0) return "Min participants must be > 0";
    if (!Number.isFinite(earlyWindowMinutes) || earlyWindowMinutes < 0) return "Early window must be >= 0";
    if (!Number.isFinite(totalRounds) || totalRounds < 1 || totalRounds > 10) return "Total rounds: 1–10";
    if (!Number.isFinite(roundDurationMinutes) || roundDurationMinutes < 1) return "Round duration >= 1 min";
    if (!Number.isFinite(gapMinutes) || gapMinutes < 0) return "Gap must be >= 0";
    if (!Number.isFinite(startTimeMs)) return "Valid start time required";
    return null;
  }, [form]);

  // Preview round schedule
  const roundSchedule = useMemo(() => {
    const totalRounds = Number(form.totalRounds);
    const durationMs = Number(form.roundDurationMinutes) * 60_000;
    const gapMs = Number(form.gapMinutes) * 60_000;
    const startMs = parseDateInput(form.startTime);
    if (!Number.isFinite(startMs) || totalRounds < 1) return [];
    return Array.from({ length: totalRounds }, (_, i) => {
      const roundStart = startMs + i * (durationMs + gapMs);
      const roundEnd = roundStart + durationMs;
      return { roundIndex: i + 1, startMs: roundStart, endMs: roundEnd };
    });
  }, [form.totalRounds, form.roundDurationMinutes, form.gapMinutes, form.startTime]);

  function setCompleteForm(roundId: string, patch: Partial<CompleteFormState>) {
    setCompleteFormByRound((prev) => {
      const existing = prev[roundId] ?? { priceEndRaw: "", rank1: "", rank2: "", rank3: "" };
      return { ...prev, [roundId]: { ...existing, ...patch } };
    });
  }

  async function handleAutoFetchEndPrice(roundObjectId: string, coinSymbol: string) {
    setCompleteForm(roundObjectId, { priceEndRaw: "Fetching…" });
    try {
      const priceRaw = await getLiveStartPriceRaw(coinSymbol);
      setCompleteForm(roundObjectId, { priceEndRaw: String(priceRaw) });
    } catch {
      setCompleteForm(roundObjectId, { priceEndRaw: "" });
    }
  }

  async function handleCompleteGame(tournament: OnChainTournament) {
    if (!account || !isAdmin || !tournament.leaderboardId) return;
    const formData = completeFormByRound[tournament.roundObjectId];
    const priceEndRaw = Number(formData?.priceEndRaw);
    if (!Number.isFinite(priceEndRaw) || priceEndRaw <= 0) return;
    const top3 = [formData?.rank1 ?? "", formData?.rank2 ?? "", formData?.rank3 ?? ""]
      .map((a) => a.trim())
      .filter((a) => a.startsWith("0x") && a.length >= 10);
    setCompleteStateByRound((p) => ({
      ...p,
      [tournament.roundObjectId]: { message: "Submitting…", txDigest: null, isError: false },
    }));
    try {
      const result = await completeGame({
        sessionId: tournament.sessionId,
        roundId: tournament.roundObjectId,
        registryId: tournament.registryId,
        leaderboardId: tournament.leaderboardId,
        priceEndRaw,
        top3Players: top3,
      });
      setCompleteStateByRound((p) => ({
        ...p,
        [tournament.roundObjectId]: {
          message: "Game completed!",
          txDigest: (result as { digest?: string }).digest ?? null,
          isError: false,
        },
      }));
      await tournamentsQuery.refetch();
    } catch (err) {
      setCompleteStateByRound((p) => ({
        ...p,
        [tournament.roundObjectId]: {
          message: err instanceof Error ? err.message : "Failed to complete.",
          txDigest: null,
          isError: true,
        },
      }));
    }
  }

  async function handleSettleGame(tournament: OnChainTournament) {
    if (!account || !isAdmin) return;
    setSettleStateByRound((p) => ({
      ...p,
      [tournament.roundObjectId]: { message: "Submitting…", txDigest: null, isError: false },
    }));
    try {
      const result = await settleGame({ roundId: tournament.roundObjectId });
      setSettleStateByRound((p) => ({
        ...p,
        [tournament.roundObjectId]: {
          message: "Game settled! Prizes locked.",
          txDigest: (result as { digest?: string }).digest ?? null,
          isError: false,
        },
      }));
      await tournamentsQuery.refetch();
    } catch (err) {
      setSettleStateByRound((p) => ({
        ...p,
        [tournament.roundObjectId]: {
          message: err instanceof Error ? err.message : "Failed to settle.",
          txDigest: null,
          isError: true,
        },
      }));
    }
  }

  async function handleStartTournament(roundObjectId: string, coinSymbol: string) {
    if (!account || !isAdmin) return;
    resetStartRound();
    setStartStateByRound((p) => ({
      ...p,
      [roundObjectId]: { message: "Fetching live price…", txDigest: null, isError: false },
    }));
    try {
      const priceStartRaw = await getLiveStartPriceRaw(coinSymbol);
      setStartStateByRound((p) => ({
        ...p,
        [roundObjectId]: { message: "Submitting transaction…", txDigest: null, isError: false },
      }));
      const result = await startRound({ roundId: roundObjectId, priceStartRaw });
      setStartStateByRound((p) => ({
        ...p,
        [roundObjectId]: {
          message: `Round started at $${(priceStartRaw / 1e8).toFixed(2)}`,
          txDigest: result.digest ?? null,
          isError: false,
        },
      }));
      await tournamentsQuery.refetch();
    } catch (executionError) {
      setStartStateByRound((p) => ({
        ...p,
        [roundObjectId]: {
          message: executionError instanceof Error ? executionError.message : "Failed to start.",
          txDigest: null,
          isError: true,
        },
      }));
    }
  }

  async function handleCancelTournament(sessionId: string, roundObjectId: string) {
    if (!account || !isAdmin) return;
    resetCancelTournament();
    setCancelStateByRound((p) => ({
      ...p,
      [roundObjectId]: { message: "Submitting…", txDigest: null, isError: false },
    }));
    try {
      const result = await cancelTournament({ sessionId, roundId: roundObjectId });
      setCancelStateByRound((p) => ({
        ...p,
        [roundObjectId]: {
          message: "Cancelled.",
          txDigest: result.digest ?? null,
          isError: false,
        },
      }));
      await tournamentsQuery.refetch();
    } catch (executionError) {
      setCancelStateByRound((p) => ({
        ...p,
        [roundObjectId]: {
          message: executionError instanceof Error ? executionError.message : "Failed to cancel.",
          txDigest: null,
          isError: true,
        },
      }));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !isAdmin || validation) return;

    const totalRounds = Number(form.totalRounds);
    const durationMs = Number(form.roundDurationMinutes) * 60_000;
    const gapMs = Number(form.gapMinutes) * 60_000;
    const startMs = parseDateInput(form.startTime);
    const seasonId = Number(form.seasonId);
    const coinSymbol = selectedCoinSymbol;
    const entryFeeRaw = Number(form.entryFeeRaw);
    const minParticipants = Number(form.minParticipants);
    const earlyWindowMinutes = Number(form.earlyWindowMinutes);

    setCreateLog([`Creating ${totalRounds} rounds for Season ${seasonId}…`]);

    for (let i = 0; i < totalRounds; i++) {
      const roundStart = startMs + i * (durationMs + gapMs);
      const roundEnd = roundStart + durationMs;
      const roundEntryFee = i === 0 ? entryFeeRaw : 1; // Round 1 = prize, rest = free
      const roundId = Date.now() + i;

      setCreateLog((prev) => [
        ...prev,
        `Round ${i + 1}/${totalRounds}: creating… (fee: ${i === 0 ? formatUSDT(roundEntryFee) + " USDT" : "free"})`,
      ]);

      try {
        const result = await createTournament({
          roundId,
          seasonId,
          coinSymbol,
          startTimeMs: roundStart,
          endTimeMs: roundEnd,
          entryFeeRaw: roundEntryFee,
          minParticipants,
          earlyWindowMinutes,
        });
        setCreateLog((prev) => [
          ...prev,
          `Round ${i + 1} created ✓ (tx: ${result.digest?.slice(0, 12)}…)`,
        ]);
      } catch (err) {
        setCreateLog((prev) => [
          ...prev,
          `Round ${i + 1} FAILED: ${err instanceof Error ? err.message : "Unknown error"}`,
        ]);
        break;
      }

      // Small delay between rounds to avoid nonce issues
      if (i < totalRounds - 1) {
        await new Promise((res) => setTimeout(res, 1200));
      }
    }

    setCreateLog((prev) => [...prev, "Done! Check your tournaments below."]);
    await tournamentsQuery.refetch();
  }

  // ── Auto-finalize polling ────────────────────────────────────────
  const autoFinalizeRef = useRef(autoFinalizeInProgress);

  const runAutoFinalize = useCallback(async () => {
    if (!isAdmin || !account) return;
    const allJoinEvents = joinEventsQuery.data ?? [];
    const leaderboardRows = leaderboardQuery.data ?? [];

    for (const group of myTournamentGroups) {
      for (const round of group.rounds) {
        // Only process ended rounds that haven't been completed yet
        if (round.status !== "ended" || round.winnerDirection !== 0) continue;
        if (!round.leaderboardId) continue;
        const key = round.roundObjectId;
        if (autoFinalizeRef.current.current.has(key)) continue;

        const isFreeRound = round.entryFeeRaw <= 1;
        const isPrizeRound = !isFreeRound;

        // Prize round: only finalize after ALL score rounds settled
        if (isPrizeRound) {
          const scoreRoundsAllSettled = group.rounds
            .filter((r) => r.entryFeeRaw <= 1)
            .every((r) => r.winnerDirection !== 0 || r.isSettled);
          if (!scoreRoundsAllSettled) continue;
        }

        autoFinalizeRef.current.current.add(key);
        setAutoFinalizeLog((prev) => [
          `[${new Date().toLocaleTimeString()}] Auto-finalizing Round ${round.roundNumber} (Season ${round.seasonId})…`,
          ...prev.slice(0, 19),
        ]);

        try {
          // Fetch price_end
          const priceEndRaw = await getLiveStartPriceRaw(round.coinSymbol);

          let top3: string[];

          if (isFreeRound) {
            // Determine winner direction
            const winDir = priceEndRaw > round.priceStart ? 1 : 2;
            // Top 3 = first 3 players who predicted correctly, sorted by timestamp
            const correctEvents = allJoinEvents
              .filter((e) => e.roundNumber === round.roundNumber && e.direction === winDir)
              .sort((a, b) => a.timestampMs - b.timestampMs);
            top3 = correctEvents.slice(0, 3).map((e) => e.player);
          } else {
            // Prize round: top 3 from leaderboard who also joined this round
            const roundJoins = new Set(
              allJoinEvents
                .filter((e) => e.roundNumber === round.roundNumber)
                .map((e) => e.player.toLowerCase()),
            );
            top3 = leaderboardRows
              .filter((r) => roundJoins.has(r.player.toLowerCase()))
              .slice(0, 3)
              .map((r) => r.player);
          }

          // Complete game
          await completeGame({
            sessionId: round.sessionId,
            roundId: round.roundObjectId,
            registryId: round.registryId,
            leaderboardId: round.leaderboardId!,
            priceEndRaw,
            top3Players: top3,
          });

          setAutoFinalizeLog((prev) => [
            `[${new Date().toLocaleTimeString()}] Round ${round.roundNumber} completed ✓`,
            ...prev.slice(0, 19),
          ]);

          // Wait a moment then settle
          await new Promise((res) => setTimeout(res, 1500));

          await settleGame({ roundId: round.roundObjectId });

          setAutoFinalizeLog((prev) => [
            `[${new Date().toLocaleTimeString()}] Round ${round.roundNumber} settled ✓ Prizes locked!`,
            ...prev.slice(0, 19),
          ]);

          await tournamentsQuery.refetch();
        } catch (err) {
          setAutoFinalizeLog((prev) => [
            `[${new Date().toLocaleTimeString()}] Round ${round.roundNumber} error: ${err instanceof Error ? err.message : "Unknown"}`,
            ...prev.slice(0, 19),
          ]);
        } finally {
          autoFinalizeRef.current.current.delete(key);
        }
      }
    }
  }, [isAdmin, account, myTournamentGroups, joinEventsQuery.data, leaderboardQuery.data, completeGame, settleGame, tournamentsQuery]);

  // Polling
  useEffect(() => {
    if (!isAdmin || !account) return;
    const interval = setInterval(runAutoFinalize, 10_000);
    return () => clearInterval(interval);
  }, [isAdmin, account, runAutoFinalize]);

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative z-10 text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="blue-cyber-grid absolute inset-0 opacity-30" />
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(13,242,128,0.05) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20">

        {/* Hero */}
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4"
            style={{
              backgroundColor: "rgba(13,242,128,0.1)",
              color: "#0df280",
              border: "1px solid rgba(13,242,128,0.2)",
            }}
          >
            <span className="material-symbols-outlined text-sm leading-none">sports_esports</span>
            Admin Arena
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic mb-2">
            Tournament{" "}
            <span
              className="animate-gradient-text"
              style={{
                background: "linear-gradient(90deg, #0df280, #3b82f6, #0df280)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize: "200% auto",
              }}
            >
              Control
            </span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Create multi-round tournaments. Auto-finalize runs in the background when admin wallet is connected.
          </p>
        </div>

        {/* Wallet guard */}
        {!account ? (
          <div className="glass-panel rounded-2xl p-8 text-center mb-8">
            <p className="text-slate-400 font-bold mb-4">Connect your admin wallet to continue.</p>
            <ConnectButton />
          </div>
        ) : !isAdmin ? (
          <AlertBox type="warning">
            Your wallet is not registered as a tournament admin. You can still view tournaments below.
          </AlertBox>
        ) : null}

        {isAdmin && account && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

            {/* ── Create Tournament Form ── */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
                Create Multi-Round Tournament
              </h2>
              <form
                onSubmit={onSubmit}
                className="glass-panel rounded-2xl p-6 space-y-5"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Season ID" hint="Unique ID for this tournament">
                    <input
                      type="number"
                      value={form.seasonId}
                      onChange={(e) => setForm((p) => ({ ...p, seasonId: e.target.value }))}
                      className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#f1f5f9",
                        outline: "none",
                      }}
                    />
                  </FormField>

                  <FormField label="Coin Symbol">
                    {availableSymbols.length > 0 ? (
                      <select
                        value={selectedCoinSymbol}
                        onChange={(e) => setForm((p) => ({ ...p, coinSymbol: e.target.value }))}
                        className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#f1f5f9",
                          outline: "none",
                        }}
                      >
                        {availableSymbols.map((s) => (
                          <option key={s} value={s} style={{ backgroundColor: "#161b22", color: "#f1f5f9" }}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.coinSymbol}
                        onChange={(e) => setForm((p) => ({ ...p, coinSymbol: e.target.value.toUpperCase() }))}
                        className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#f1f5f9",
                          outline: "none",
                        }}
                      />
                    )}
                  </FormField>
                </div>

                <FormField label="Entry Fee (raw USDT)" hint="Prize round entry fee. e.g. 100000000 = 100 USDT">
                  <input
                    type="number"
                    value={form.entryFeeRaw}
                    onChange={(e) => setForm((p) => ({ ...p, entryFeeRaw: e.target.value }))}
                    className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#f1f5f9",
                      outline: "none",
                    }}
                  />
                  {form.entryFeeRaw && Number(form.entryFeeRaw) > 0 && (
                    <span className="text-[10px] font-bold" style={{ color: "#0df280" }}>
                      = {formatUSDT(Number(form.entryFeeRaw))} USDT
                    </span>
                  )}
                </FormField>

                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Total Rounds" hint="1–10">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.totalRounds}
                      onChange={(e) => setForm((p) => ({ ...p, totalRounds: e.target.value }))}
                      className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#f1f5f9",
                        outline: "none",
                      }}
                    />
                  </FormField>
                  <FormField label="Duration (min)">
                    <input
                      type="number"
                      min={1}
                      value={form.roundDurationMinutes}
                      onChange={(e) => setForm((p) => ({ ...p, roundDurationMinutes: e.target.value }))}
                      className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#f1f5f9",
                        outline: "none",
                      }}
                    />
                  </FormField>
                  <FormField label="Gap (min)">
                    <input
                      type="number"
                      min={0}
                      value={form.gapMinutes}
                      onChange={(e) => setForm((p) => ({ ...p, gapMinutes: e.target.value }))}
                      className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#f1f5f9",
                        outline: "none",
                      }}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Start Time">
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                      className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#f1f5f9",
                        outline: "none",
                      }}
                    />
                  </FormField>
                  <FormField label="Min Participants">
                    <input
                      type="number"
                      min={1}
                      value={form.minParticipants}
                      onChange={(e) => setForm((p) => ({ ...p, minParticipants: e.target.value }))}
                      className="rounded-xl px-3 py-2.5 text-sm font-bold form-field-glow"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#f1f5f9",
                        outline: "none",
                      }}
                    />
                  </FormField>
                </div>

                {/* Round schedule preview */}
                {roundSchedule.length > 0 && (
                  <div
                    className="rounded-xl p-3 space-y-1.5"
                    style={{ backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#3b82f6" }}>
                      Round Schedule Preview
                    </p>
                    {roundSchedule.map((r) => (
                      <div key={r.roundIndex} className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>
                          Round {r.roundIndex}
                          {r.roundIndex === 1 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: "rgba(250,204,21,0.15)", color: "#facc15" }}>
                              PRIZE
                            </span>
                          )}
                          {r.roundIndex > 1 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
                              FREE
                            </span>
                          )}
                        </span>
                        <span>
                          {new Date(r.startMs).toLocaleTimeString()} → {new Date(r.endMs).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {validation && <AlertBox type="error">{validation}</AlertBox>}

                <button
                  type="submit"
                  disabled={!!validation || isPending}
                  className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all"
                  style={
                    !validation && !isPending
                      ? {
                          backgroundColor: "#0df280",
                          color: "#0a0a0a",
                          boxShadow: "0 0 24px rgba(13,242,128,0.3)",
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "#4b5563",
                          cursor: "not-allowed",
                        }
                  }
                >
                  {isPending
                    ? "Creating…"
                    : `Create ${form.totalRounds} Rounds · Season ${form.seasonId}`}
                </button>

                {/* Creation log */}
                {createLog.length > 0 && (
                  <div
                    className="rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      fontFamily: "monospace",
                    }}
                  >
                    {createLog.map((line, i) => (
                      <p key={i} className="text-[11px]" style={{ color: line.includes("FAILED") ? "#fca5a5" : line.includes("✓") ? "#0df280" : "#94a3b8" }}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* ── Auto-finalize status ── */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                Auto-Finalize
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-black"
                  style={{ backgroundColor: "rgba(13,242,128,0.15)", color: "#0df280" }}
                >
                  POLLING 10s
                </span>
              </h2>
              <div
                className="glass-panel rounded-2xl p-5"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-[11px] text-slate-500 font-bold mb-4">
                  Auto-finalize checks every 10 seconds for ended rounds with no winner. It fetches the live price, determines the winning direction, and automatically completes + settles the round.
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-2 h-2 rounded-full animate-live-dot"
                    style={{ backgroundColor: "#0df280" }}
                  />
                  <span className="text-xs font-black text-slate-300">Active</span>
                  <span className="text-[10px] text-slate-600 font-bold">
                    Watching {myTournamentGroups.reduce((s, g) => s + g.rounds.length, 0)} rounds across {myTournamentGroups.length} tournaments
                  </span>
                </div>

                <button
                  type="button"
                  onClick={runAutoFinalize}
                  className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest mb-4 transition-all hover:opacity-80"
                  style={{
                    backgroundColor: "rgba(13,242,128,0.1)",
                    color: "#0df280",
                    border: "1px solid rgba(13,242,128,0.25)",
                  }}
                >
                  Run Now
                </button>

                {autoFinalizeLog.length > 0 && (
                  <div
                    className="rounded-xl p-3 space-y-1.5 max-h-52 overflow-y-auto"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      fontFamily: "monospace",
                    }}
                  >
                    {autoFinalizeLog.map((line, i) => (
                      <p
                        key={i}
                        className="text-[10px]"
                        style={{
                          color: line.includes("error") || line.includes("Error")
                            ? "#fca5a5"
                            : line.includes("✓")
                            ? "#0df280"
                            : "#94a3b8",
                        }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                {autoFinalizeLog.length === 0 && (
                  <p className="text-[10px] text-slate-600 font-bold italic">No activity yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── My Tournaments ── */}
        {account && myTournamentGroups.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
              My Tournaments ({myTournamentGroups.length})
            </h2>
            <div className="space-y-6">
              {myTournamentGroups.map((group) => (
                <div
                  key={group.seasonId}
                  className="glass-panel rounded-2xl p-5"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {/* Group header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase italic">
                        {group.coinSymbol}/USDT · Season {group.seasonId}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        {group.totalRounds} rounds · {group.completedRounds}/{group.totalRounds} done
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
                      style={{
                        color: group.status === "live" ? "#0df280" : group.status === "upcoming" ? "#f59e0b" : "#94a3b8",
                        backgroundColor:
                          group.status === "live"
                            ? "rgba(13,242,128,0.12)"
                            : group.status === "upcoming"
                            ? "rgba(245,158,11,0.12)"
                            : "rgba(148,163,184,0.1)",
                      }}
                    >
                      {group.status}
                    </span>
                  </div>

                  {/* Individual rounds */}
                  <div className="space-y-3">
                    {group.rounds.map((tournament) => {
                      const startState = startStateByRound[tournament.roundObjectId];
                      const cancelState = cancelStateByRound[tournament.roundObjectId];
                      const completeState = completeStateByRound[tournament.roundObjectId];
                      const settleState = settleStateByRound[tournament.roundObjectId];
                      const completeForm = completeFormByRound[tournament.roundObjectId] ?? { priceEndRaw: "", rank1: "", rank2: "", rank3: "" };
                      const isPrize = tournament.entryFeeRaw > 1;

                      return (
                        <div
                          key={tournament.roundObjectId}
                          className="rounded-xl p-4 space-y-3"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.02)",
                            border: isPrize
                              ? "1px solid rgba(250,204,21,0.2)"
                              : "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {/* Round header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-200">
                                Round {tournament.roundNumber}
                              </span>
                              {isPrize && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded font-black"
                                  style={{ backgroundColor: "rgba(250,204,21,0.15)", color: "#facc15" }}
                                >
                                  PRIZE
                                </span>
                              )}
                              {!isPrize && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded font-black"
                                  style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
                                >
                                  FREE
                                </span>
                              )}
                            </div>
                            <StatusBadge status={tournament.status} />
                          </div>

                          {/* Round info */}
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-600 font-black uppercase">Start</span>
                              <p className="text-slate-300 font-bold mt-0.5">{formatDateTime(tournament.startTimeMs)}</p>
                            </div>
                            <div>
                              <span className="text-slate-600 font-black uppercase">End</span>
                              <p className="text-slate-300 font-bold mt-0.5">{formatDateTime(tournament.endTimeMs)}</p>
                            </div>
                            <div>
                              <span className="text-slate-600 font-black uppercase">Participants</span>
                              <p className="text-slate-300 font-bold mt-0.5">{tournament.totalParticipants}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          {tournament.status === "upcoming" && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartTournament(tournament.roundObjectId, tournament.coinSymbol)}
                                disabled={isStartPending}
                                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: "#0df280",
                                  color: "#0a0a0a",
                                  boxShadow: "0 0 16px rgba(13,242,128,0.25)",
                                }}
                              >
                                {isStartPending ? "Starting…" : "▶ Start Round"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelTournament(tournament.sessionId, tournament.roundObjectId)}
                                disabled={isCancelPending}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: "rgba(239,68,68,0.1)",
                                  color: "#fca5a5",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                }}
                              >
                                {isCancelPending ? "…" : "Cancel"}
                              </button>
                            </div>
                          )}

                          {tournament.status === "live" && (
                            <div className="flex items-center gap-2">
                              <div
                                className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl"
                                style={{ backgroundColor: "rgba(13,242,128,0.06)", border: "1px solid rgba(13,242,128,0.15)" }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 animate-live-dot"
                                  style={{ backgroundColor: "#0df280" }}
                                />
                                <span className="text-xs font-black text-slate-300">Round in progress…</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCancelTournament(tournament.sessionId, tournament.roundObjectId)}
                                disabled={isCancelPending}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: "rgba(239,68,68,0.1)",
                                  color: "#fca5a5",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                }}
                              >
                                {isCancelPending ? "…" : "Cancel"}
                              </button>
                            </div>
                          )}

                          {(tournament.status === "ended" || tournament.isSettled) && (
                            <div
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              <span className="material-symbols-outlined text-sm" style={{ color: "#0df280" }}>
                                check_circle
                              </span>
                              <span className="text-xs text-slate-400 font-bold">
                                Round ended — winners can claim rewards in{" "}
                                <a href="/profile" className="font-black" style={{ color: "#0df280" }}>
                                  My Arena
                                </a>
                              </span>
                            </div>
                          )}

                          {tournament.status === "cancelled" && (
                            <div
                              className="px-4 py-2.5 rounded-xl"
                              style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                            >
                              <span className="text-xs text-red-400 font-bold">Round cancelled</span>
                            </div>
                          )}

                          {/* Start / Cancel status messages */}
                          {[startState, cancelState]
                            .filter(Boolean)
                            .map((state, i) =>
                              state?.message ? (
                                <p
                                  key={i}
                                  className="text-[11px] font-bold"
                                  style={{ color: state.isError ? "#fca5a5" : "#0df280" }}
                                >
                                  {state.message}
                                  {state.txDigest && (
                                    <a
                                      href={`${EXPLORER_BASE}/txblock/${state.txDigest}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="ml-2 text-sky-400 hover:text-sky-300"
                                    >
                                      (view tx)
                                    </a>
                                  )}
                                </p>
                              ) : null,
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {account && isAdmin && myTournamentGroups.length === 0 && !tournamentsQuery.isLoading && (
          <div
            className="glass-panel rounded-2xl p-8 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <p className="text-slate-500 font-bold">No tournaments created yet. Use the form above.</p>
          </div>
        )}
      </main>
    </div>
  );
}
