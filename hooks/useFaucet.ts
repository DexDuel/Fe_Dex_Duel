"use client";

import { useSignAndExecuteTransaction } from "@onelabs/dapp-kit";
import { buildClaimFaucetTx } from "@/lib/transactions";
import { FAUCET_AMOUNT_USDT } from "@/lib/constants";

/**
 * Hook to claim 100 USDT from the public faucet.
 *
 * Usage:
 *   const { claimFaucet, isPending } = useFaucet();
 *   await claimFaucet(account.address);
 */
export function useFaucet() {
  const { mutateAsync, isPending, isSuccess, isError, error } =
    useSignAndExecuteTransaction();

  async function claimFaucet(senderAddress: string) {
    const tx = buildClaimFaucetTx(senderAddress);
    return mutateAsync({ transaction: tx });
  }

  return {
    claimFaucet,
    isPending,
    isSuccess,
    isError,
    error,
    faucetAmount: FAUCET_AMOUNT_USDT,
  };
}
