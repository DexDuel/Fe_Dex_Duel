"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ConnectButton, useCurrentAccount } from "@onelabs/dapp-kit";
import { useLeaderboardRows } from "@/hooks/useLeaderboard";
import {
  useOnChainTournaments,
  usePlayerJoinEvents,
} from "@/hooks/useOnChainTournaments";
import { useUSDTBalance } from "@/hooks/useUSDTBalance";
import {
  DIRECTION,
  EXPLORER_BASE,
  formatUSDT,
} from "@/lib/constants";
import { FaucetButton } from "@/components/FaucetButton";

function formatDateTime(timestampMs: number): string {
  if (!timestampMs) return "-";
  return new Date(timestampMs).toLocaleString();
}

function formatDirection(direction: number): "UP" | "DOWN" {
  return direction === DIRECTION.DOWN ? "DOWN" : "UP";
}



export default function ProfilePage() {
  const account = useCurrentAccount();
  const normalizedAccount = account?.address.toLowerCase() ?? "";
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { balance, refetch: refetchBalance } = useUSDTBalance(account?.address);
  const leaderboardQuery = useLeaderboardRows();
  const joinedEventsQuery = usePlayerJoinEvents(account?.address);
  const tournamentsQuery = useOnChainTournaments();

  const leaderboardRows = useMemo(
    () => leaderboardQuery.data ?? [],
    [leaderboardQuery.data],
  );
  const joinedEvents = useMemo(
    () =>
      [...(joinedEventsQuery.data ?? [])].sort(
        (a, b) => b.timestampMs - a.timestampMs,
      ),
    [joinedEventsQuery.data],
  );
  const tournaments = useMemo(
    () => tournamentsQuery.data ?? [],
    [tournamentsQuery.data],
  );

  const myRow = useMemo(
    () =>
      leaderboardRows.find(
        (row) => row.player.toLowerCase() === normalizedAccount,
      ) ?? null,
    [leaderboardRows, normalizedAccount],
  );

  const tournamentByRound = useMemo(() => {
    const map = new Map<number, { coinSymbol: string; seasonId: number }>();
    for (const tournament of tournaments) {
      if (!map.has(tournament.roundNumber)) {
        map.set(tournament.roundNumber, {
          coinSymbol: tournament.coinSymbol,
          seasonId: tournament.seasonId,
        });
      }
    }
    return map;
  }, [tournaments]);

  const liveCount = useMemo(
    () => tournaments.filter((tournament) => tournament.status === "live").length,
    [tournaments],
  );
  const upPredictions = useMemo(
    () =>
      joinedEvents.filter((event) => event.direction === DIRECTION.UP).length,
    [joinedEvents],
  );
  const downPredictions = joinedEvents.length - upPredictions;

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >


      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic mb-2">
              My <span style={{ color: "#0df280" }}>Arena</span>
            </h2>
            <p className="text-slate-500 font-medium">
              Personal activity is loaded from on-chain join and score events.
            </p>
          </div>
          {account && (
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Wallet: {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
          )}
        </div>

        {!account && (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <p className="text-slate-300 mb-5">Connect wallet to view your arena activity.</p>
            <ConnectButton />
          </div>
        )}

        {account && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    OUSDT Balance
                  </p>
                  <FaucetButton address={account.address} onSuccess={refetchBalance} />
                </div>
                <p className="text-2xl font-black" style={{ color: "#0df280" }}>
                  {balance?.formatted ?? "0.00"}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Total Predictions
                </p>
                <p className="text-2xl font-black" style={{ color: "#3b82f6" }}>
                  {joinedEvents.length}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Leaderboard Rank
                </p>
                <p className="text-2xl font-black" style={{ color: "#f59e0b" }}>
                  {myRow ? `#${myRow.rank}` : "-"}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Total Score
                </p>
                <p className="text-2xl font-black" style={{ color: "#a855f7" }}>
                  {myRow?.totalScore.toLocaleString() ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-panel rounded-xl p-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  UP Predictions
                </p>
                <p className="text-xl font-black" style={{ color: "#22c55e" }}>
                  {upPredictions}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  DOWN Predictions
                </p>
                <p className="text-xl font-black" style={{ color: "#ef4444" }}>
                  {downPredictions}
                </p>
              </div>
              <div className="glass-panel rounded-xl p-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Live Tournaments
                </p>
                <p className="text-xl font-black" style={{ color: "#0df280" }}>
                  {liveCount}
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest">
                  My Join Transactions
                </h3>
                <Link
                  href="/tournaments"
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "#0df280" }}
                >
                  Go to tournaments
                </Link>
              </div>

              {joinedEventsQuery.isLoading && (
                <p className="text-slate-400 text-sm">Loading your join events...</p>
              )}

              {!joinedEventsQuery.isLoading && joinedEvents.length === 0 && (
                <p className="text-slate-400 text-sm">
                  No join events found for this wallet.
                </p>
              )}

              {!joinedEventsQuery.isLoading && joinedEvents.length > 0 && (
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        {[
                          "Time",
                          "Tournament",
                          "Direction",
                          "Stake",
                          "Transaction",
                        ].map((header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {joinedEvents.map((event) => {
                        const tournamentMeta = tournamentByRound.get(event.roundNumber);
                        return (
                          <tr
                            key={`${event.txDigest}-${event.timestampMs}`}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                          >
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {mounted ? formatDateTime(event.timestampMs) : "..."}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold">
                              {(tournamentMeta?.coinSymbol ?? "UNKNOWN").toUpperCase()} / USDT
                              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                Season {tournamentMeta?.seasonId ?? "-"} - Round{" "}
                                {event.roundNumber}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="text-xs font-black px-2 py-1 rounded"
                                style={
                                  event.direction === DIRECTION.UP
                                    ? {
                                        color: "#22c55e",
                                        backgroundColor: "rgba(34,197,94,0.12)",
                                      }
                                    : {
                                        color: "#ef4444",
                                        backgroundColor: "rgba(239,68,68,0.12)",
                                      }
                                }
                              >
                                {formatDirection(event.direction)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-black">
                              {formatUSDT(event.amountRaw)} USDT
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={`${EXPLORER_BASE}/txblock/${event.txDigest}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-sky-300 hover:text-sky-200"
                              >
                                {event.txDigest.slice(0, 10)}...
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
