import { Transaction } from "@onelabs/sui/transactions";
import { PACKAGE_ID, OBJECT_IDS } from "./constants";

/**
 * Claim 100 USDT from the public faucet.
 * The minted coin is transferred to `senderAddress`.
 */
export function buildClaimFaucetTx(senderAddress: string): Transaction {
  const tx = new Transaction();
  const [coin] = tx.moveCall({
    target: `${PACKAGE_ID}::usdt::claim_faucet`,
    arguments: [tx.object(OBJECT_IDS.FAUCET)],
  });
  tx.transferObjects([coin], tx.pure.address(senderAddress));
  return tx;
}

/**
 * Join a game session and submit a prediction.
 *
 * @param sessionId        - SharedObject ID of the GameSession
 * @param roundId          - SharedObject ID of the Round
 * @param registryId       - SharedObject ID of the PredictionRegistry
 * @param direction        - 1 = UP, 2 = DOWN
 * @param usdtCoinObjectId - A USDT Coin object owned by the sender (must have >= entryFeeRaw)
 * @param entryFeeRaw      - Entry fee in raw USDT (6 decimals, e.g. 100_000_000 = 100 USDT)
 */
export function buildJoinGameTx(
  sessionId: string,
  roundId: string,
  registryId: string,
  direction: 1 | 2,
  usdtCoinObjectId: string,
  entryFeeRaw: number,
): Transaction {
  const tx = new Transaction();
  // Split exact entry fee from the user's USDT coin
  const [payment] = tx.splitCoins(tx.object(usdtCoinObjectId), [
    tx.pure.u64(entryFeeRaw),
  ]);
  tx.moveCall({
    target: `${PACKAGE_ID}::game_controller::join_game`,
    arguments: [
      tx.object(sessionId),
      tx.object(roundId),
      tx.object(registryId),
      tx.pure.u8(direction),
      payment,
      tx.object(OBJECT_IDS.CLOCK),
    ],
  });
  return tx;
}

/**
 * Claim rewards (principal + yield for winners, principal only for losers).
 * Returns a Coin<USDT> transferred to `playerAddress`.
 */
export function buildClaimRewardTx(
  roundId: string,
  registryId: string,
  playerAddress: string,
): Transaction {
  const tx = new Transaction();
  const [reward] = tx.moveCall({
    target: `${PACKAGE_ID}::game_controller::claim_rewards`,
    arguments: [
      tx.object(roundId),
      tx.object(registryId),
      tx.pure.address(playerAddress),
    ],
  });
  tx.transferObjects([reward], tx.pure.address(playerAddress));
  return tx;
}
