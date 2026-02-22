export const PACKAGE_ID =
  "0x816b6cd7533bef4e1f96f0001f982f26549690d3bdc6fcda8aed0be78a9ac004";

export const OBJECT_IDS = {
  FAUCET: "0x3974604ec4eb83495998712f86263d4c3ecc97a6003d8d9590f5d9b225078a68",
  ADMIN_CAP:
    "0x43c7353865813dd36eb6c763d1053cec696d8e64b04d0b47083fea353e48adc7",
  TREASURY:
    "0x579187571046c055fb3ad7205331e9458ed799d198d416f20c737b14f709a614",
  CLOCK: "0x0000000000000000000000000000000000000000000000000000000000000006",
};

export const MODULES = {
  USDT: `${PACKAGE_ID}::usdt`,
  GAME_ROUND: `${PACKAGE_ID}::game_round`,
  PREDICTION: `${PACKAGE_ID}::prediction`,
  LEADERBOARD: `${PACKAGE_ID}::leaderboard`,
  GAME_CONTROLLER: `${PACKAGE_ID}::game_controller`,
} as const;

export const USDT_TYPE = `${PACKAGE_ID}::usdt::USDT`;
export const FAUCET_AMOUNT_USDT = 100;
export const FAUCET_AMOUNT_RAW = 100_000_000; // 6 decimals
export const USDT_DECIMALS = 6;

export const DIRECTION = {
  UP: 1,
  DOWN: 2,
} as const;

export const ROUND_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  ENDED: "ended",
  SETTLED: "settled",
} as const;

export const SCORING = {
  POINTS_WIN: 10,
  POINTS_WIN_STREAK: 5,
  POINTS_EARLY: 3,
} as const;

export const REWARD_DISTRIBUTION = {
  ADMIN_FEE_BPS: 1000, // 10%
  RANK1_BPS: 5000, // 50% of net
  RANK2_BPS: 3000, // 30% of net
  RANK3_BPS: 2000, // 20% of net
} as const;

export const NETWORK = {
  TESTNET_RPC: "https://rpc.testnet.onechain.io",
  TESTNET_CHAIN_ID: "one-testnet",
};

export const EXPLORER_BASE = "https://explorer.onechain.io";

/**
 * Active game session configs — populate after admin deploys sessions on-chain.
 * Each entry maps directly to on-chain shared objects created by create_game_session().
 */
export interface GameSessionConfig {
  sessionId: string;      // GameSession shared object ID
  roundId: string;        // Round shared object ID
  registryId: string;     // PredictionRegistry shared object ID
  leaderboardId: string;  // Leaderboard shared object ID for the season
  coinSymbol: string;     // e.g. "BTC"
  entryFeeRaw: number;    // e.g. 100_000_000 (= 100 USDT, 6 decimals)
  startTime: number;      // unix milliseconds
  endTime: number;        // unix milliseconds
}

export const ACTIVE_GAME_SESSIONS: GameSessionConfig[] = [
  // Example (fill in real IDs from explorer after admin creates sessions):
  // {
  //   sessionId:    "0x...",
  //   roundId:      "0x...",
  //   registryId:   "0x...",
  //   leaderboardId:"0x...",
  //   coinSymbol:   "BTC",
  //   entryFeeRaw:  100_000_000,
  //   startTime:    Date.now(),
  //   endTime:      Date.now() + 5 * 60 * 1000,
  // },
];

export function formatUSDT(raw: number | bigint): string {
  const n = typeof raw === "bigint" ? Number(raw) : raw;
  return (n / 10 ** USDT_DECIMALS).toFixed(2);
}

export function toRawUSDT(amount: number): number {
  return Math.floor(amount * 10 ** USDT_DECIMALS);
}

export function shortenAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}
