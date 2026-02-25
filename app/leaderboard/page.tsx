"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useCurrentAccount } from "@onelabs/dapp-kit";
import { useLeaderboardRows } from "@/hooks/useLeaderboard";
import { shortenAddress } from "@/lib/constants";

function rankColor(rank: number): string {
  if (rank === 1) return "#facc15";
  if (rank === 2) return "#cbd5e1";
  if (rank === 3) return "#c2410c";
  return "#94a3b8";
}

function formatLastUpdate(timestampMs: number): string {
  if (!timestampMs) return "-";
  return new Date(timestampMs).toLocaleString();
}

export default function LeaderboardPage() {
  const account = useCurrentAccount();
  const [search, setSearch] = useState("");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const leaderboardQuery = useLeaderboardRows();
  const rows = useMemo(() => leaderboardQuery.data ?? [], [leaderboardQuery.data]);
  const normalizedAccount = account?.address.toLowerCase() ?? "";

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => row.player.toLowerCase().includes(keyword));
  }, [rows, search]);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const totalScore = useMemo(
    () => rows.reduce((sum, row) => sum + row.totalScore, 0),
    [rows],
  );
  const lastUpdated = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.lastUpdateMs), 0),
    [rows],
  );

  if (!mounted) return null;

  return (
    <div
      style={{ backgroundColor: "#0a0a0a" }}
      className="relative z-10 text-slate-100 antialiased min-h-screen overflow-x-hidden"
    >


      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic mb-2">
              On-Chain <span style={{ color: "#0df280" }}>Leaderboard</span>
            </h2>
            <p className="text-slate-500 font-medium">
              Ranking is aggregated from live <code>ScoreUpdated</code> events.
            </p>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Last event: {mounted ? formatLastUpdate(lastUpdated) : "..."}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Players</p>
            <p className="text-2xl font-black" style={{ color: "#0df280" }}>
              {rows.length}
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Score</p>
            <p className="text-2xl font-black" style={{ color: "#3b82f6" }}>
              {totalScore.toLocaleString()}
            </p>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top Score</p>
            <p className="text-2xl font-black" style={{ color: "#f59e0b" }}>
              {rows[0]?.totalScore.toLocaleString() ?? 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {podium.map((row) => (
            <div key={row.player} className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-black uppercase tracking-widest" style={{ color: rankColor(row.rank) }}>
                  #{row.rank}
                </p>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Streak {row.currentStreak}
                </span>
              </div>
              <p className="font-bold text-sm mb-1">{shortenAddress(row.player, 6)}</p>
              <p className="text-xs text-slate-500 mb-3">
                {row.winEvents} win events - {row.updateEvents} updates
              </p>
              <p className="text-xl font-black" style={{ color: "#0df280" }}>
                {row.totalScore.toLocaleString()} pts
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex justify-end">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search wallet address"
            className="w-full md:w-72 px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 outline-none focus:border-white/30"
          />
        </div>

        {leaderboardQuery.isLoading && (
          <div className="glass-panel rounded-2xl p-6 text-center text-slate-400">
            Loading leaderboard events...
          </div>
        )}

        {leaderboardQuery.isError && (
          <div
            className="rounded-xl p-4 text-sm font-bold mb-5"
            style={{
              backgroundColor: "rgba(255,77,77,0.1)",
              color: "#ff9a9a",
              border: "1px solid rgba(255,77,77,0.2)",
            }}
          >
            Failed to load leaderboard:{" "}
            {leaderboardQuery.error instanceof Error
              ? leaderboardQuery.error.message
              : "Unknown error"}
          </div>
        )}

        {!leaderboardQuery.isLoading && !leaderboardQuery.isError && filteredRows.length === 0 && (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
            No leaderboard events found yet.
          </div>
        )}

        {!leaderboardQuery.isLoading && !leaderboardQuery.isError && filteredRows.length > 0 && (
          <div className="overflow-x-auto rounded-xl glass-panel">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Rank", "Player", "Score", "Win Events", "Streak", "Last Update"].map((header) => (
                    <th
                      key={header}
                      className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isMe = row.player.toLowerCase() === normalizedAccount;
                  return (
                    <tr
                      key={row.player}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        backgroundColor: isMe ? "rgba(13,242,128,0.08)" : "transparent",
                      }}
                    >
                      <td className="px-5 py-4">
                        <span className="font-black" style={{ color: rankColor(row.rank) }}>
                          #{row.rank}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{shortenAddress(row.player, 6)}</span>
                          {isMe && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-black"
                              style={{ backgroundColor: "rgba(13,242,128,0.2)", color: "#0df280" }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black" style={{ color: "#0df280" }}>
                        {row.totalScore.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{row.winEvents}</td>
                      <td className="px-5 py-4 text-slate-300">{row.currentStreak}</td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {mounted ? formatLastUpdate(row.lastUpdateMs) : "..."}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
