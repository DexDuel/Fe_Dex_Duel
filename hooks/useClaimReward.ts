"use client";

import { useSignAndExecuteTransaction } from "@onelabs/dapp-kit";
import { buildClaimRewardTx } from "@/lib/transactions";

/**
 * Hook to claim principal + yield reward after a round is settled.
 */
export function useClaimReward() {
  const { mutateAsync, isPending, isSuccess, isError, error } =
    useSignAndExecuteTransaction();

  async function claimReward(roundId: string, registryId: string, playerAddress: string) {
    const tx = buildClaimRewardTx(roundId, registryId, playerAddress);
    return mutateAsync({ transaction: tx });
  }

  return { claimReward, isPending, isSuccess, isError, error };
}
