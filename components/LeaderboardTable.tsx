"use client";

import { Trophy, TrendingUp, Zap, Flame } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/types";
import { shortenAddress } from "@/lib/constants";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightAddress?: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
        <Trophy size={13} className="rank-gold" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-7 h-7 rounded-full bg-gray-400/15 border border-gray-400/25 flex items-center justify-center">
        <Trophy size={13} className="rank-silver" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-7 h-7 rounded-full bg-orange-700/15 border border-orange-700/25 flex items-center justify-center">
        <Trophy size={13} className="rank-bronze" />
      </div>
    );
  return (
    <div className="w-7 h-7 flex items-center justify-center">
      <span className="text-sm font-semibold text-gray-500 stat-number">#{rank}</span>
    </div>
  );
}

export default function LeaderboardTable({ entries, highlightAddress }: LeaderboardTableProps) {
  return (
    <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
      <table className="w-full data-table">
        <thead>
          <tr>
            <th className="text-left">Rank</th>
            <th className="text-left">Player</th>
            <th className="text-right">Score</th>
            <th className="text-right hidden sm:table-cell">Wins</th>
            <th className="text-right hidden md:table-cell">Streak</th>
            <th className="text-right hidden lg:table-cell">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const isHighlighted =
              highlightAddress &&
              entry.player.toLowerCase().includes(highlightAddress.slice(2, 6).toLowerCase());
            const isTop3 = entry.rank <= 3;

            return (
              <tr
                key={entry.rank}
                className={`animate-fade-in-up ${
                  isHighlighted
                    ? "bg-violet-500/[0.07] border-l-2 border-l-violet-500"
                    : ""
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <td>
                  <RankBadge rank={entry.rank} />
                </td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isTop3
                          ? "bg-gradient-to-br from-violet-600 to-indigo-500 text-white"
                          : "bg-white/[0.06] text-gray-400"
                      }`}
                    >
                      {entry.player.slice(2, 4).toUpperCase()}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isHighlighted ? "text-violet-300" : "text-white"
                        }`}
                      >
                        {shortenAddress(entry.player)}
                        {isHighlighted && (
                          <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">
                            You
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-right">
                  <span
                    className={`font-bold stat-number text-sm ${
                      isTop3 ? "gradient-text" : "text-white"
                    }`}
                  >
                    {entry.score}
                  </span>
                </td>
                <td className="text-right hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-1 text-sm text-green-400">
                    <TrendingUp size={13} />
                    <span className="stat-number">{entry.wins}</span>
                  </div>
                </td>
                <td className="text-right hidden md:table-cell">
                  {entry.streak > 0 ? (
                    <div className="flex items-center justify-end gap-1 text-sm text-orange-400">
                      <Flame size={13} />
                      <span className="stat-number">{entry.streak}</span>
                    </div>
                  ) : (
                    <span className="text-gray-600 text-sm">—</span>
                  )}
                </td>
                <td className="text-right hidden lg:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                        style={{ width: `${entry.winRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 stat-number w-9 text-right">
                      {entry.winRate}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
