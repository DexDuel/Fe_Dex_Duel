"use client";

import { useState } from "react";
import { X, TrendingUp, TrendingDown, Zap, DollarSign } from "lucide-react";
import { formatUSDT, FAUCET_AMOUNT_USDT } from "@/lib/constants";
import type { Direction, MockRound } from "@/lib/types";

interface PredictionModalProps {
  round: MockRound;
  onClose: () => void;
  onSubmit: (direction: Direction, amount: number) => void;
  isLoading?: boolean;
}

const QUICK_AMOUNTS = [10, 25, 50, 100];

export default function PredictionModal({
  round,
  onClose,
  onSubmit,
  isLoading = false,
}: PredictionModalProps) {
  const [direction, setDirection] = useState<Direction | null>(null);
  const [amount, setAmount] = useState(10);

  const entryFee = round.entry_fee / 1_000_000;
  const priceUp = round.priceChangePercent > 0;

  const handleSubmit = () => {
    if (!direction) return;
    onSubmit(direction, amount);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Zap size={15} className="text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Make Prediction</h2>
              <p className="text-xs text-gray-500">{round.coin_symbol}/USDT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Price */}
        <div className="mx-5 mt-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Current Price</p>
              <p className="text-xl font-bold text-white stat-number">
                ${round.currentPrice.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">24h Change</p>
              <p
                className={`text-sm font-semibold stat-number ${
                  priceUp ? "price-up" : "price-down"
                }`}
              >
                {priceUp ? "+" : ""}
                {round.priceChangePercent.toFixed(2)}%
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${priceUp ? "bg-green-500" : "bg-red-500"}`}
                style={{
                  width: `${Math.min(100, Math.abs(round.priceChangePercent) * 10)}%`,
                  marginLeft: priceUp ? "50%" : undefined,
                  marginRight: !priceUp ? "50%" : undefined,
                }}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>Bears {round.down_count}</span>
            <span>Bulls {round.up_count}</span>
          </div>
        </div>

        {/* Direction Selection */}
        <div className="px-5 mt-4">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
            Your Prediction
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDirection(1)}
              className={`relative flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                direction === 1
                  ? "bg-green-500/15 border-green-500/50 glow-green"
                  : "border-white/[0.08] hover:border-green-500/30 hover:bg-green-500/5"
              }`}
            >
              <TrendingUp
                size={24}
                className={direction === 1 ? "text-green-400" : "text-gray-500"}
              />
              <span
                className={`text-sm font-bold ${direction === 1 ? "text-green-400" : "text-gray-400"}`}
              >
                PUMP
              </span>
              <span className="text-xs text-gray-600">{round.up_count} players</span>
            </button>
            <button
              onClick={() => setDirection(2)}
              className={`relative flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                direction === 2
                  ? "bg-red-500/15 border-red-500/50 glow-red"
                  : "border-white/[0.08] hover:border-red-500/30 hover:bg-red-500/5"
              }`}
            >
              <TrendingDown
                size={24}
                className={direction === 2 ? "text-red-400" : "text-gray-500"}
              />
              <span
                className={`text-sm font-bold ${direction === 2 ? "text-red-400" : "text-gray-400"}`}
              >
                DUMP
              </span>
              <span className="text-xs text-gray-600">{round.down_count} players</span>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="px-5 mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Stake Amount
            </p>
            <p className="text-xs text-gray-600">
              Min: {formatUSDT(round.entry_fee)} USDT
            </p>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-violet-500/50 transition-colors">
            <DollarSign size={14} className="text-gray-500 shrink-0" />
            <input
              type="number"
              value={amount}
              min={entryFee}
              max={FAUCET_AMOUNT_USDT}
              step={1}
              onChange={(e) => setAmount(Math.max(entryFee, Number(e.target.value)))}
              className="flex-1 bg-transparent text-sm text-white outline-none stat-number"
            />
            <span className="text-xs text-gray-500 shrink-0">USDT</span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${
                  amount === v
                    ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                    : "bg-white/[0.04] text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
          <div className="flex gap-2 text-xs text-gray-400">
            <Zap size={12} className="text-violet-400 mt-0.5 shrink-0" />
            <span>
              Principal is staked for yield. Top 3 winners share the yield pool proportionally by rank. Your {amount} USDT is always returned.
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="p-5 pt-4">
          <button
            onClick={handleSubmit}
            disabled={!direction || isLoading}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              direction === 1
                ? "btn-up"
                : direction === 2
                ? "btn-down"
                : "btn-ghost opacity-50 cursor-not-allowed"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : direction === 1 ? (
              "Predict PUMP"
            ) : direction === 2 ? (
              "Predict DUMP"
            ) : (
              "Select Direction"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
