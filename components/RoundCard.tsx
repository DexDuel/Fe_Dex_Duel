"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Award,
} from "lucide-react";
import type { MockRound, Direction, Prediction } from "@/lib/types";
import { formatUSDT } from "@/lib/constants";
import CountdownTimer from "./CountdownTimer";
import PredictionModal from "./PredictionModal";

interface RoundCardProps {
  round: MockRound;
  userPrediction?: Prediction | null;
  onPredict?: (roundId: string, direction: Direction, amount: number) => void;
  isLoading?: boolean;
  index?: number;
}

const COIN_COLORS: Record<string, string> = {
  BTC: "from-orange-500 to-yellow-500",
  ETH: "from-blue-500 to-indigo-500",
  ONE: "from-violet-500 to-purple-500",
  SOL: "from-green-400 to-teal-500",
};

const COIN_BG: Record<string, string> = {
  BTC: "bg-orange-500/10 border-orange-500/20",
  ETH: "bg-blue-500/10 border-blue-500/20",
  ONE: "bg-violet-500/10 border-violet-500/20",
  SOL: "bg-green-500/10 border-green-500/20",
};

export default function RoundCard({
  round,
  userPrediction,
  onPredict,
  isLoading = false,
  index = 0,
}: RoundCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isActive = round.status === "active";
  const isSettled = round.status === "settled";
  const priceUp = round.priceChangePercent > 0;
  const totalPool = formatUSDT(round.total_pool);
  const coinColor = COIN_COLORS[round.coin_symbol] ?? "from-violet-500 to-indigo-500";
  const coinBg = COIN_BG[round.coin_symbol] ?? "bg-violet-500/10 border-violet-500/20";
  const upPct =
    round.total_participants > 0
      ? Math.round((round.up_count / round.total_participants) * 100)
      : 50;

  const handlePredict = (direction: Direction, amount: number) => {
    onPredict?.(round.id, direction, amount);
    setModalOpen(false);
  };

  return (
    <>
      <div
        className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden hover:border-white/[0.16] hover:bg-white/[0.05] transition-all duration-300 flex flex-col animate-fade-in-up"
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        {/* Top stripe */}
        <div className={`h-1 bg-gradient-to-r ${coinColor}`} />

        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${coinBg}`}
            >
              {round.coin_symbol.slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{round.coin_symbol}/USDT</p>
              <p className="text-xs text-gray-500">Round #{round.round_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="badge-active text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                Live
              </span>
            )}
            {isSettled && (
              <span className="badge-settled text-xs px-2 py-0.5 rounded-full font-medium">
                Settled
              </span>
            )}
            {round.status === "ended" && (
              <span className="badge-ended text-xs px-2 py-0.5 rounded-full font-medium">
                Ended
              </span>
            )}
            {round.status === "pending" && (
              <span className="badge-pending text-xs px-2 py-0.5 rounded-full font-medium">
                Pending
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="px-4 pb-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Current Price</p>
              <p className="text-2xl font-bold text-white stat-number">
                ${round.currentPrice.toLocaleString()}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold stat-number ${
                priceUp
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {priceUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {priceUp ? "+" : ""}
              {round.priceChangePercent.toFixed(2)}%
            </div>
          </div>
          {isSettled && (
            <p className="text-xs text-gray-600 mt-1">
              Start: ${round.price_start.toLocaleString()} → End: ${round.price_end.toLocaleString()}
            </p>
          )}
        </div>

        {/* Prediction bar */}
        <div className="px-4 pb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span className="flex items-center gap-1">
              <TrendingUp size={11} className="text-green-400" />
              Pump {upPct}%
            </span>
            <span className="flex items-center gap-1">
              Dump {100 - upPct}%
              <TrendingDown size={11} className="text-red-400" />
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
              style={{ width: `${upPct}%` }}
            />
            <div className="h-full flex-1 bg-gradient-to-r from-red-400 to-red-600" />
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <div className="flex items-center gap-1 text-gray-500 mb-1.5">
              <Users size={10} />
              <span className="text-xs">Players</span>
            </div>
            <p className="text-sm font-bold text-white stat-number">
              {round.total_participants}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <div className="flex items-center gap-1 text-gray-500 mb-1.5">
              <DollarSign size={10} />
              <span className="text-xs">Pool</span>
            </div>
            <p className="text-sm font-bold text-white stat-number">{totalPool}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <div className="flex items-center gap-1 text-gray-500 mb-1.5">
              <Clock size={10} />
              <span className="text-xs">Time</span>
            </div>
            {isActive ? (
              <CountdownTimer endTime={round.end_time} size="sm" showIcon={false} />
            ) : (
              <p className="text-sm font-bold text-gray-500">—</p>
            )}
          </div>
        </div>

        {/* User prediction result */}
        {userPrediction && isSettled && (
          <div
            className={`mx-4 mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
              userPrediction.is_correct
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {userPrediction.is_correct ? (
              <CheckCircle size={15} />
            ) : (
              <TrendingDown size={15} />
            )}
            <span className="font-medium">
              {userPrediction.is_correct ? "You won!" : "Better luck next time"}
            </span>
            {userPrediction.rank > 0 && (
              <span className="ml-auto flex items-center gap-1">
                <Award size={13} />
                Rank #{userPrediction.rank}
              </span>
            )}
          </div>
        )}

        {/* Existing prediction badge */}
        {userPrediction && isActive && (
          <div className="mx-4 mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-2 text-sm text-violet-300">
            <CheckCircle size={15} />
            <span>
              Predicted{" "}
              <strong>{userPrediction.direction === 1 ? "PUMP" : "DUMP"}</strong>
              {userPrediction.is_early && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                  Early +3pts
                </span>
              )}
            </span>
          </div>
        )}

        {/* Action button */}
        {isActive && !userPrediction && (
          <div className="px-4 pb-4 mt-auto">
            <button
              onClick={() => setModalOpen(true)}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl btn-primary text-sm disabled:opacity-50"
            >
              Predict Now
            </button>
          </div>
        )}

        {isSettled && round.yield_pool > 0 && (
          <div className="px-4 pb-4 mt-auto">
            <div className="w-full py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm text-center font-medium">
              Yield Pool: {formatUSDT(round.yield_pool)} USDT
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <PredictionModal
          round={round}
          onClose={() => setModalOpen(false)}
          onSubmit={handlePredict}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
