"use client";

import { useState } from "react";
import { useCurrentAccount, useCurrentWallet, useSuiClient } from "@onelabs/dapp-kit";
import { buildStartRoundTx } from "@/lib/transactions";
import { signTransactionForExecution } from "@/lib/walletFeatures";

export interface StartRoundParams {
  roundId: string;
  priceStartRaw: number;
}

export function useStartRound() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  function reset() {
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }

  async function startRound(params: StartRoundParams) {
    if (!currentWallet || !account) throw new Error("Wallet not connected");

    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);

    try {
      const tx = buildStartRoundTx(params);
      tx.setSender(account.address);

      const bytes = await tx.build({ client });
      const { transactionBlockBytes, signature } = await signTransactionForExecution(
        currentWallet,
        account,
        tx,
        bytes,
      );

      const result = await client.executeTransactionBlock({
        transactionBlock: transactionBlockBytes,
        signature,
        options: { showObjectChanges: true, showRawEffects: true },
      });

      setIsSuccess(true);
      return result;
    } catch (executionError) {
      setIsError(true);
      setError(executionError as Error);
      throw executionError;
    } finally {
      setIsPending(false);
    }
  }

  return { startRound, isPending, isSuccess, isError, error, reset };
}
