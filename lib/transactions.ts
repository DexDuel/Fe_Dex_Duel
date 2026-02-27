import { Transaction } from "@onelabs/sui/transactions";
import { PACKAGE_ID, OBJECT_IDS } from "./constants";

/**
 * Claim 100 USDT from the public faucet.
 */
export function buildClaimFaucetTx(senderAddress: string): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(10_000_000);
  const usdtCoin = tx.moveCall({
    target: `${PACKAGE_ID}::usdt::claim_faucet`,
    arguments: [tx.object(OBJECT_IDS.FAUCET)],
  });
  tx.transferObjects([usdtCoin], tx.pure.address(senderAddress));
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
  tx.setGasBudget(10_000_000);
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
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(10_000_000);
  const rewardCoin = tx.moveCall({
    target: `${PACKAGE_ID}::game_controller::claim_rewards`,
    arguments: [tx.object(roundId), tx.object(registryId)],
  });
  tx.transferObjects([rewardCoin], tx.pure.address(senderAddress));
  return tx;
}

export interface CreateTournamentParams {
  roundId: number;
  seasonId: number;
  coinSymbol: string;
  startTimeMs: number;
  endTimeMs: number;
  entryFeeRaw: number;
  minParticipants: number;
  earlyWindowMinutes: number;
}

export interface StartRoundParams {
  roundId: string;
  priceStartRaw: number;
}

function toAsciiBytes(input: string): number[] {
  return Array.from(input).map((char) => char.charCodeAt(0));
}

/**
 * Admin-only flow:
 * 1) create game session (round + prediction registry + game session)
 * 2) create leaderboard
 * 3) share leaderboard
 */
export function buildCreateTournamentTx(
  params: CreateTournamentParams,
): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(35_000_000);

  tx.moveCall({
    target: `${PACKAGE_ID}::game_controller::create_game_session`,
    arguments: [
      tx.pure.u64(params.roundId),
      tx.pure.u64(params.seasonId),
      tx.pure.vector("u8", toAsciiBytes(params.coinSymbol.toUpperCase())),
      tx.pure.u64(params.startTimeMs),
      tx.pure.u64(params.endTimeMs),
      tx.pure.u64(params.entryFeeRaw),
      tx.pure.u64(params.minParticipants),
      tx.pure.u64(params.earlyWindowMinutes), // Tambahkan ini
      tx.pure.u64(params.earlyWindowMinutes), // Gunakan nilai yang sama untuk max window sebagai default
    ],
  });

  const leaderboard = tx.moveCall({
    target: `${PACKAGE_ID}::leaderboard::create_leaderboard`,
    arguments: [tx.pure.u64(params.seasonId)],
  });

  tx.moveCall({
    target: `${PACKAGE_ID}::leaderboard::share_leaderboard`,
    arguments: [leaderboard],
  });

  return tx;
}

/**
 * Admin-only flow:
 * Start a created round so users can join and submit predictions.
 */
export function buildStartRoundTx(params: StartRoundParams): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(10_000_000);

  tx.moveCall({
    target: `${PACKAGE_ID}::game_controller::start_game`,
    arguments: [
      tx.object(OBJECT_IDS.ADMIN_CAP),
      tx.object(params.roundId),
      tx.pure.u64(params.priceStartRaw),
      tx.object(OBJECT_IDS.CLOCK),
    ],
  });

  return tx;
}

export interface CancelTournamentParams {
  sessionId: string;
  roundId: string;
}

/**
 * Admin-only flow:
 * Cancel an upcoming round or a low-participation live round.
 */
export function buildCancelTournamentTx(params: CancelTournamentParams): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(10_000_000);

  tx.moveCall({
    target: `${PACKAGE_ID}::game_controller::cancel_tournament`,
    arguments: [
      tx.object(params.sessionId),
      tx.object(params.roundId),
      tx.object(OBJECT_IDS.CLOCK),
    ],
  });

  return tx;
}

/**
 * Player flow:
 * Claim full entry-fee refund after a cancelled tournament.
 */
export function buildClaimRefundTx(roundId: string): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(10_000_000);

  tx.moveCall({
    target: `${PACKAGE_ID}::game_controller::claim_tournament_refund`,
    arguments: [tx.object(roundId)],
  });

  return tx;
}
