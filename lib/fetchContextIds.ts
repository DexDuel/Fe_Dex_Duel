import { SuiClient } from "@onelabs/sui/client";
import { PACKAGE_ID } from "./constants";

export interface TrueContextIds {
  sessionId: string;
  registryId: string;
  leaderboardId: string;
}

/**
 * Because the DB-based tournament list uses roundId as a fallback for sessionId
 * and other contextual Shared Objects, we must fetch the TRUE object IDs from the blockchain
 * RPC directly before performing actions that require them (like joining, canceling, or ending rounds).
 *
 * It works by looking at the creation transaction of the roundId.
 */
export async function fetchTrueContextIds(client: SuiClient, roundId: string): Promise<TrueContextIds> {
  const txs = await client.queryTransactionBlocks({
    filter: { ChangedObject: roundId },
    options: { showObjectChanges: true },
    order: "ascending",
  });

  if (!txs.data || txs.data.length === 0) {
    throw new Error(`Could not find creation transaction for round ${roundId}`);
  }

  const creationTx = txs.data[0];
  const objectChanges = creationTx.objectChanges;
  if (!objectChanges) {
    throw new Error("No object changes found in creation tx");
  }

  const sessionChange = objectChanges.find(
    (change: any) => change.type === "created" && change.objectType === `${PACKAGE_ID}::game_controller::GameSession`,
  );
  const registryChange = objectChanges.find(
    (change: any) => change.type === "created" && change.objectType === `${PACKAGE_ID}::prediction::PredictionRegistry`,
  );
  const leaderboardChange = objectChanges.find(
    (change: any) => change.type === "created" && change.objectType === `${PACKAGE_ID}::leaderboard::Leaderboard`,
  );

  if (!sessionChange || !("objectId" in sessionChange)) throw new Error("Could not find GameSession ID mapping");
  
  // Note: Registry and Leaderboard are only really needed by specific actions,
  // but we query them safely. If they fail, we return empty string to avoid breaking actions that only need sessionId.
  return {
    sessionId: sessionChange.objectId,
    registryId: registryChange && "objectId" in registryChange ? registryChange.objectId : "",
    leaderboardId: leaderboardChange && "objectId" in leaderboardChange ? leaderboardChange.objectId : "",
  };
}
