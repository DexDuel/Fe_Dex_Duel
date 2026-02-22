"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCurrentAccount, ConnectButton } from "@onelabs/dapp-kit";
import { useUSDTBalance } from "@/hooks/useUSDTBalance";
import { useFaucet } from "@/hooks/useFaucet";
import { useJoinGame } from "@/hooks/useJoinGame";
import { WalletMenu } from "@/components/WalletMenu";
import {
  ACTIVE_GAME_SESSIONS,
  DIRECTION,
  formatUSDT,
  EXPLORER_BASE,
} from "@/lib/constants";

/* ── Mock fallback data (shown when no on-chain session is configured) ── */
const MOCK = {
  name: "BTC Grand Championship",
  pair: "BTC / USDT",
  icon: "currency_bitcoin",
  accent: "#0df280",
  status: "live" as const,
  entryFeeDisplay: "100 USDT",
  prizePool: "Prize from yield",
  totalRounds: 5,
  currentRound: 3,
  roundDuration: "5 min",
  currentPrice: "$64,281.50",
  lockedPrice: "$64,198.20",
  timeLeft: "03:42",
};

const ROUND_HISTORY = [
  { round: 1, lockedPrice: "$63,812.00", closedPrice: "$64,021.50", result: "UP",  myPick: "UP",   outcome: "win",  pts: 120 },
  { round: 2, lockedPrice: "$64,021.50", closedPrice: "$63,950.00", result: "DOWN", myPick: "DOWN", outcome: "win",  pts: 110 },
];

const LEADERBOARD = [
  { rank: 1,  addr: "0x7a...E921", rounds: 2, wins: 2, pts: 248, streak: 2 },
  { rank: 2,  addr: "0xf1...3B2a", rounds: 2, wins: 2, pts: 221, streak: 2 },
  { rank: 3,  addr: "0x98...C11d", rounds: 2, wins: 2, pts: 215, streak: 2 },
  { rank: 4,  addr: "0xAB...9F3e", rounds: 2, wins: 1, pts: 120, streak: 0 },
  { rank: 5,  addr: "0xcc...2D1f", rounds: 2, wins: 1, pts: 110, streak: 1 },
  { rank: 6,  addr: "0x12...88Ba", rounds: 2, wins: 1, pts: 105, streak: 0 },
  { rank: 7,  addr: "You",         rounds: 2, wins: 2, pts: 230, streak: 2, isMe: true },
  { rank: 8,  addr: "0x34...4Cd2", rounds: 2, wins: 0, pts: 0,   streak: 0 },
].sort((a, b) => b.pts - a.pts).map((p, i) => ({ ...p, rank: i + 1 }));

const MY_RANK = LEADERBOARD.find((p) => p.isMe)?.rank ?? 0;
const MY_PTS  = LEADERBOARD.find((p) => p.isMe)?.pts  ?? 0;

type Pick = "UP" | "DOWN" | null;

/* ── Faucet button component ─────────────────────────────────────── */
function FaucetButton({ address, onSuccess }: { address: string; onSuccess?: () => void }) {
  const { claimFaucet, isPending, isSuccess } = useFaucet();

  async function handleClaim() {
    try {
      await claimFaucet(address);
      onSuccess?.();
    } catch {
      // error shown via isError state if needed
    }
  }

  if (isSuccess) {
    return (
      <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
        style={{ backgroundColor: "rgba(13,242,128,0.15)", color: "#0df280" }}>
        <span className="material-symbols-outlined text-sm leading-none">check_circle</span>
        +100 USDT sent!
      </span>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={isPending}
      className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all hover:opacity-80 disabled:opacity-50"
      style={{ backgroundColor: "rgba(13,242,128,0.12)", color: "#0df280", border: "1px solid rgba(13,242,128,0.25)" }}>
      <span className="material-symbols-outlined text-sm leading-none">water_drop</span>
      {isPending ? "Claiming…" : "Get 100 USDT"}
    </button>
  );
}

export default function TournamentDetailPage() {
  const params = useParams();
  const sessionIdx = Number(params.id) - 1;
  const sessionConfig = ACTIVE_GAME_SESSIONS[sessionIdx] ?? null;
  const isDemo = !sessionConfig;

  const account = useCurrentAccount();
  const { balance, refetch: refetchBalance } = useUSDTBalance(account?.address);
  const { joinGame, isPending: joinPending, isSuccess: joinSuccess, isError: joinError, error: joinErr, reset: resetJoin } = useJoinGame();

  const [pick, setPick]         = useState<Pick>(null);
  const [submitted, setSubmitted] = useState(false);
  const [txDigest, setTxDigest]   = useState<string | null>(null);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const t = MOCK;
  const entryFeeRaw  = sessionConfig?.entryFeeRaw ?? 100_000_000;
  const hasEnoughBalance = balance ? balance.raw >= BigInt(entryFeeRaw) : false;

  async function handleSubmit() {
    if (!pick) return;

    // Demo mode — just show local feedback
    if (isDemo || !account) {
      setDemoSubmitted(true);
      return;
    }

    // No USDT coin to pay with
    if (!balance?.largestCoin) return;

    try {
      const result = await joinGame({
        sessionId:       sessionConfig.sessionId,
        roundId:         sessionConfig.roundId,
        registryId:      sessionConfig.registryId,
        direction:       pick === "UP" ? DIRECTION.UP : DIRECTION.DOWN,
        usdtCoinObjectId: balance.largestCoin.coinObjectId,
        entryFeeRaw,
      });
      setTxDigest(result.digest ?? null);
      setSubmitted(true);
      refetchBalance();
    } catch {
      // joinError / joinErr will be populated
    }
  }

  const isSubmitted = submitted || demoSubmitted || joinSuccess;
  const isLoading   = joinPending;

  return (
    <div style={{ backgroundColor: "#0a0a0a" }} className="text-slate-100 antialiased min-h-screen overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 glass-panel">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl" style={{ color: "#0df280" }}>swords</span>
              <h1 className="text-lg font-black tracking-tighter uppercase italic">
                GameFi <span style={{ color: "#0df280" }}>Arena</span>
              </h1>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <Link href="/tournaments" className="hover:text-white transition-colors">Tournaments</Link>
              <span className="material-symbols-outlined text-base leading-none">chevron_right</span>
              <span className="text-white font-bold truncate max-w-48">{t.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {account ? (
              <>
                {/* USDT balance */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="material-symbols-outlined text-sm leading-none" style={{ color: "#0df280" }}>toll</span>
                  <span>{balance ? `${balance.formatted} USDT` : "…"}</span>
                </div>

                {/* Faucet — show when balance is low */}
                {(!balance || balance.raw < BigInt(entryFeeRaw)) && (
                  <FaucetButton address={account.address} onSuccess={refetchBalance} />
                )}

                {/* Wallet chip + disconnect dropdown */}
                <WalletMenu />
              </>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16">

        {/* ── Demo mode banner ───────────────────────────────────────── */}
        {isDemo && (
          <div className="rounded-xl px-5 py-3 mb-5 flex items-center gap-3 text-sm font-bold"
            style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
            <span className="material-symbols-outlined text-xl leading-none">science</span>
            <span>
              Demo mode — no active on-chain session found for this tournament.
              Predictions run locally without submitting a transaction.
              Configure <code className="font-mono text-xs mx-1">ACTIVE_GAME_SESSIONS</code> in{" "}
              <code className="font-mono text-xs">lib/constants.ts</code> to enable live play.
            </span>
          </div>
        )}

        {/* ── Tournament Header ──────────────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5">
            <span className="material-symbols-outlined" style={{ fontSize: "8rem" }}>{t.icon}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Left: name + meta */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${t.accent}18`, border: `2px solid ${t.accent}40` }}>
                <span className="material-symbols-outlined text-3xl" style={{ color: t.accent }}>{t.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">{t.name}</h2>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: "rgba(13,242,128,0.15)", color: "#0df280" }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#0df280" }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#0df280" }} />
                    </span>
                    LIVE
                  </span>
                </div>
                <p className="text-slate-400 text-sm font-bold">
                  {t.pair} · {t.roundDuration} rounds · {t.totalRounds} rounds total
                </p>
              </div>
            </div>

            {/* Round progress */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Round Progress</p>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: t.totalRounds }).map((_, i) => (
                  <div key={i} className="h-2 rounded-full transition-all"
                    style={{
                      width: i === t.currentRound - 1 ? "3rem" : "2rem",
                      backgroundColor: i < t.currentRound - 1 ? "#0df280"
                        : i === t.currentRound - 1 ? "#0df280"
                        : "rgba(255,255,255,0.1)",
                      opacity: i === t.currentRound - 1 ? 1 : i < t.currentRound - 1 ? 0.6 : 0.3,
                      boxShadow: i === t.currentRound - 1 ? "0 0 8px #0df280" : "none",
                    }} />
                ))}
              </div>
              <p className="text-sm font-black">
                Round <span style={{ color: "#0df280" }}>{t.currentRound}</span>
                <span className="text-slate-500"> / {t.totalRounds}</span>
              </p>
            </div>

            {/* Key stats */}
            <div className="flex gap-6">
              {[
                { label: "Entry Fee",  value: isDemo ? t.entryFeeDisplay : `${formatUSDT(entryFeeRaw)} USDT`, color: t.accent },
                { label: "My Balance", value: balance ? `${balance.formatted} USDT` : account ? "…" : "—", color: "#3b82f6" },
                { label: "My Rank",    value: `#${MY_RANK}`, color: "#f59e0b" },
                { label: "My Points",  value: `${MY_PTS} pts`, color: "#a855f7" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{s.label}</p>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

          {/* ── Left: Current Round Prediction (3 cols) ─────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Price card */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Round {t.currentRound} of {t.totalRounds} — {t.pair}
                  </p>
                  <p className="text-4xl font-black" style={{ color: "#0df280" }}>{t.currentPrice}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Locked at <span className="font-bold text-white">{t.lockedPrice}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Round Ends In</p>
                  <p className="text-4xl font-black" style={{ color: "#f59e0b" }}>{t.timeLeft}</p>
                  <p className="text-xs text-slate-500 mt-1">Next round starts immediately</p>
                </div>
              </div>

              {/* Mini chart */}
              <div className="w-full h-24 rounded-xl mb-6 relative overflow-hidden"
                style={{ backgroundColor: "rgba(13,242,128,0.04)", border: "1px solid rgba(13,242,128,0.1)" }}>
                <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
                  <polyline
                    points="0,60 40,55 80,58 120,45 160,40 200,30 240,35 280,20 300,18"
                    fill="none" stroke="#0df280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline
                    points="0,60 40,55 80,58 120,45 160,40 200,30 240,35 280,20 300,18 300,80 0,80"
                    fill="url(#grad)" opacity="0.15" />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0df280" />
                      <stop offset="100%" stopColor="#0df280" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0df280" }}>
                  +0.13% this round
                </div>
              </div>

              {/* Prediction area */}
              {isSubmitted ? (
                <div>
                  <div className="rounded-xl p-5 text-center mb-4"
                    style={{ backgroundColor: pick === "UP" ? "rgba(13,242,128,0.1)" : "rgba(255,77,77,0.1)",
                      border: `1px solid ${pick === "UP" ? "rgba(13,242,128,0.3)" : "rgba(255,77,77,0.3)"}` }}>
                    <span className="material-symbols-outlined text-4xl block mb-2"
                      style={{ color: pick === "UP" ? "#0df280" : "#ff4d4d" }}>
                      {pick === "UP" ? "trending_up" : "trending_down"}
                    </span>
                    <p className="font-black uppercase text-lg" style={{ color: pick === "UP" ? "#0df280" : "#ff4d4d" }}>
                      Predicted {pick}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">Waiting for round to close…</p>
                  </div>

                  {/* TX link */}
                  {txDigest && (
                    <a href={`${EXPLORER_BASE}/txblock/${txDigest}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors py-2">
                      <span className="material-symbols-outlined text-sm leading-none">open_in_new</span>
                      View on Explorer · {txDigest.slice(0, 8)}…
                    </a>
                  )}

                  {/* Demo badge */}
                  {isDemo && (
                    <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      Demo — no transaction submitted
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* UP / DOWN buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => { setPick("UP"); resetJoin(); }}
                      className="py-5 rounded-xl flex flex-col items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: pick === "UP" ? "rgba(13,242,128,0.2)" : "rgba(13,242,128,0.08)",
                        border: pick === "UP" ? "2px solid #0df280" : "2px solid rgba(13,242,128,0.2)",
                        boxShadow: pick === "UP" ? "0 0 20px rgba(13,242,128,0.3)" : "none",
                      }}>
                      <span className="material-symbols-outlined text-4xl" style={{ color: "#0df280" }}>trending_up</span>
                      <span className="font-black uppercase text-sm" style={{ color: "#0df280" }}>Predict UP</span>
                      <span className="text-xs text-slate-500">Price will rise</span>
                    </button>
                    <button
                      onClick={() => { setPick("DOWN"); resetJoin(); }}
                      className="py-5 rounded-xl flex flex-col items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: pick === "DOWN" ? "rgba(255,77,77,0.2)" : "rgba(255,77,77,0.08)",
                        border: pick === "DOWN" ? "2px solid #ff4d4d" : "2px solid rgba(255,77,77,0.2)",
                        boxShadow: pick === "DOWN" ? "0 0 20px rgba(255,77,77,0.3)" : "none",
                      }}>
                      <span className="material-symbols-outlined text-4xl" style={{ color: "#ff4d4d" }}>trending_down</span>
                      <span className="font-black uppercase text-sm" style={{ color: "#ff4d4d" }}>Predict DOWN</span>
                      <span className="text-xs text-slate-500">Price will fall</span>
                    </button>
                  </div>

                  {/* Entry fee info */}
                  <div className="rounded-xl p-4 mb-4"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entry Stake</span>
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs leading-none">lock</span>
                        Principal returned after tournament
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black">
                        {formatUSDT(entryFeeRaw)} <span className="text-slate-400 text-lg">USDT</span>
                      </span>
                      {account && !isDemo && (
                        <span className="text-xs font-bold" style={{ color: hasEnoughBalance ? "#0df280" : "#ff4d4d" }}>
                          {hasEnoughBalance ? "✓ Sufficient balance" : "Insufficient balance"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Error */}
                  {joinError && (
                    <div className="rounded-xl p-3 mb-4 text-xs font-bold"
                      style={{ backgroundColor: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.25)", color: "#ff4d4d" }}>
                      <span className="material-symbols-outlined text-sm leading-none mr-1">error</span>
                      {joinErr instanceof Error ? joinErr.message : "Transaction failed. Please try again."}
                    </div>
                  )}

                  {/* Confirm button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!pick || isLoading || (!isDemo && !!account && !hasEnoughBalance)}
                    className="w-full py-4 rounded-xl font-black text-base uppercase tracking-widest transition-all disabled:cursor-not-allowed"
                    style={pick && (isDemo || !account || hasEnoughBalance)
                      ? { backgroundColor: pick === "UP" ? "#0df280" : "#ff4d4d", color: "#0a0a0a",
                          boxShadow: `0 0 24px ${pick === "UP" ? "rgba(13,242,128,0.4)" : "rgba(255,77,77,0.4)"}` }
                      : { backgroundColor: "rgba(255,255,255,0.06)", color: "#475569" }}>
                    {isLoading ? "Submitting…"
                      : !account ? "Connect Wallet to Play"
                      : !isDemo && !hasEnoughBalance ? "Insufficient USDT"
                      : pick ? `Confirm Predict ${pick}${isDemo ? " (Demo)" : ""}`
                      : "Select a Direction"}
                  </button>

                  {/* No wallet nudge */}
                  {!account && (
                    <div className="mt-3 text-center">
                      <ConnectButton />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Round History ──────────────────────────────────────── */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ color: "#0df280" }}>history</span>
                Your Round History
              </h3>
              {ROUND_HISTORY.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-4">No rounds completed yet</p>
              ) : (
                <div className="space-y-3">
                  {ROUND_HISTORY.map((r) => (
                    <div key={r.round} className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                          {r.round}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-300">
                            {r.lockedPrice} → {r.closedPrice}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            Closed {r.result} · You picked {r.myPick}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded"
                          style={r.outcome === "win"
                            ? { backgroundColor: "#0df280", color: "#0a0a0a" }
                            : { backgroundColor: "#334155", color: "#94a3b8" }}>
                          {r.outcome === "win" ? "WIN" : "LOSS"}
                        </span>
                        <span className="font-black text-sm" style={{ color: r.outcome === "win" ? "#0df280" : "#475569" }}>
                          +{r.pts} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-4 text-center">
                {t.totalRounds - ROUND_HISTORY.length} rounds remaining in this tournament
              </p>
            </div>
          </div>

          {/* ── Right: Tournament Leaderboard (2 cols) ──────────────── */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-2xl p-6 sticky top-24">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: "#f59e0b" }}>emoji_events</span>
                  Tournament Leaderboard
                </h3>
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#0df280" }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#0df280" }} />
                  </span>
                  Live
                </span>
              </div>

              {/* Prize distribution */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { pos: "1st", share: "50%", color: "#f59e0b", icon: "looks_one" },
                  { pos: "2nd", share: "30%", color: "#94a3b8", icon: "looks_two" },
                  { pos: "3rd", share: "20%", color: "#cd7f32", icon: "looks_3" },
                ].map((p) => (
                  <div key={p.pos} className="rounded-lg p-2 text-center"
                    style={{ backgroundColor: `${p.color}12`, border: `1px solid ${p.color}25` }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: p.color }}>{p.icon}</span>
                    <p className="text-xs font-black" style={{ color: p.color }}>{p.share}</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase">{p.pos}</p>
                  </div>
                ))}
              </div>

              {/* Rankings */}
              <div className="space-y-1">
                {LEADERBOARD.map((p) => (
                  <div key={p.rank}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{
                      backgroundColor: p.isMe ? "rgba(13,242,128,0.08)"
                        : p.rank <= 3 ? "rgba(255,255,255,0.04)" : "transparent",
                      border: p.isMe ? "1px solid rgba(13,242,128,0.2)" : "1px solid transparent",
                    }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                      style={{
                        backgroundColor: p.rank === 1 ? "rgba(245,158,11,0.2)"
                          : p.rank === 2 ? "rgba(148,163,184,0.2)"
                          : p.rank === 3 ? "rgba(205,127,50,0.2)"
                          : "rgba(255,255,255,0.06)",
                        color: p.rank === 1 ? "#f59e0b" : p.rank === 2 ? "#94a3b8" : p.rank === 3 ? "#cd7f32" : "#64748b",
                      }}>
                      {p.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: p.isMe ? "#0df280" : "inherit" }}>
                        {p.addr}
                        {p.isMe && (
                          <span className="ml-1 text-[10px] px-1 py-0.5 rounded font-black"
                            style={{ backgroundColor: "rgba(13,242,128,0.2)", color: "#0df280" }}>YOU</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold">
                        {p.wins}W / {p.rounds - p.wins}L
                        {p.streak > 0 && <span style={{ color: "#f59e0b" }}> · 🔥{p.streak}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black" style={{ color: p.rank <= 3 ? "#f59e0b" : "inherit" }}>{p.pts}</p>
                      <p className="text-[10px] text-slate-600 font-bold">pts</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center mt-4">
                Updated after each round
              </p>
            </div>
          </div>
        </div>

        {/* ── How it works ──────────────────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ color: "#3b82f6" }}>info</span>
            How This Tournament Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: "login",          color: "#0df280", title: "1. Pay Entry Fee",    desc: `Stake ${formatUSDT(entryFeeRaw)} USDT once to enter. Your principal is always returned.` },
              { icon: "query_stats",    color: "#3b82f6", title: `2. Predict ${t.totalRounds}× Rounds`, desc: `Each round: pick UP or DOWN on ${t.pair} within ${t.roundDuration}. You play all ${t.totalRounds} rounds.` },
              { icon: "military_tech",  color: "#f59e0b", title: "3. Earn Points",      desc: "Correct prediction = points. Wrong prediction = 0 pts. Streak bonus applies." },
              { icon: "emoji_events",   color: "#a855f7", title: "4. Win the Yield",    desc: "Top 3 by total points split the prize pool. Everyone gets their principal back — no loss." },
            ].map((s) => (
              <div key={s.title} className="rounded-xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <span className="material-symbols-outlined text-2xl block mb-2" style={{ color: s.color }}>{s.icon}</span>
                <p className="font-black text-sm uppercase italic mb-1">{s.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
