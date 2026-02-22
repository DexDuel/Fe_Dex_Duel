"use client";

import { useSignAndExecuteTransaction } from "@onelabs/dapp-kit";
import { buildJoinGameTx } from "@/lib/transactions";

export interface JoinGameParams {
  sessionId: string;
  roundId: string;
  registryId: string;
  direction: 1 | 2;
  /** Coin object ID to pay with (from useUSDTBalance().balance.largestCoin) */
  usdtCoinObjectId: string;
  /** Entry fee in raw USDT (6 decimals) */
  entryFeeRaw: number;
}

/**
 * Hook to submit a prediction and join a game round.
 *
 * Usage:
 *   const { joinGame, isPending } = useJoinGame();
 *   await joinGame({ sessionId, roundId, registryId, direction: 1, usdtCoinObjectId, entryFeeRaw });
 */
export function useJoinGame() {
  const { mutateAsync, isPending, isSuccess, isError, error, reset } =
    useSignAndExecuteTransaction();

  async function joinGame(params: JoinGameParams) {
    const tx = buildJoinGameTx(
      params.sessionId,
      params.roundId,
      params.registryId,
      params.direction,
      params.usdtCoinObjectId,
      params.entryFeeRaw,
    );
    return mutateAsync({ transaction: tx });
  }

  return { joinGame, isPending, isSuccess, isError, error, reset };
}
