/**
 * OneChain config — single source of truth for all NEXT_PUBLIC_* env vars.
 * Import from here instead of accessing process.env directly.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[OneChain Config] Missing required environment variable: ${key}\n` +
      `Please add it to your .env.local file.`
    );
  }
  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

export const onechainConfig = {
  /** The OneChain RPC endpoint. */
  rpc: optionalEnv("NEXT_PUBLIC_ONECHAIN_RPC", "https://rpc-testnet.onelabs.cc:443"),

  /** The network name (testnet / mainnet). */
  network: optionalEnv("NEXT_PUBLIC_NETWORK", "testnet"),

  /** The deployed package ID of SC_Dex_Duel. */
  packageId: optionalEnv(
    "NEXT_PUBLIC_PACKAGE_ID",
    "0xfcb745f20df975c8436ee5ce22c51b389545ffa6f0ac53a435bfdcf2dc1de64d"
  ),

  /** The Treasury shared object ID (game_round::Treasury). */
  treasuryId: optionalEnv(
    "NEXT_PUBLIC_TREASURY_OBJECT_ID",
    "0x8d900bcfd26c3f6866af28f2707bf93b2eb71448c545cead723640df2590d04e"
  ),

  /** The USDT coin type string. */
  usdtType: optionalEnv(
    "NEXT_PUBLIC_USDT_TYPE",
    "0xfcb745f20df975c8436ee5ce22c51b389545ffa6f0ac53a435bfdcf2dc1de64d::usdt::USDT"
  ),

  /** Faucet shared object ID (optional). */
  faucetId: optionalEnv(
    "NEXT_PUBLIC_FAUCET_OBJECT_ID",
    "0xf1bbfbbaae6f9f6e8c88755072f391656538a685caf3f189d5263ab4a24fc1d9"
  ),

  /** AdminCap object ID (owned by deployer wallet). Required to call start_game. */
  adminCapId: optionalEnv(
    "NEXT_PUBLIC_ADMIN_CAP_ID",
    "0x348eb18f5d14e51b74c9bbce8546e7248a89158f9c89e06e65b1752a9c34416a"
  ),

  /** Sui/OneChain Clock system object ID. */
  clockId: "0x6" as const,
} as const;

/** Convenience: full module targets */
export const modules = {
  gameController: `${onechainConfig.packageId}::game_controller`,
  gameRound:      `${onechainConfig.packageId}::game_round`,
  prediction:     `${onechainConfig.packageId}::prediction`,
  leaderboard:    `${onechainConfig.packageId}::leaderboard`,
  usdt:           `${onechainConfig.packageId}::usdt`,
} as const;

/** Event type strings for querying on-chain events */
export const EVENT_TYPES = {
  // game_round events
  RoundCreated:    `${modules.gameRound}::RoundCreated`,
  RoundEnded:      `${modules.gameRound}::RoundEnded`,
  RoundSettled:    `${modules.gameRound}::RoundSettled`,
  RoundCancelled:  `${modules.gameRound}::RoundCancelled`,
  RewardClaimed:   `${modules.gameRound}::RewardClaimed`,
  RefundClaimed:   `${modules.gameRound}::RefundClaimed`,

  // game_controller events
  GameSessionCreated: `${modules.gameController}::GameSessionCreated`,
  PlayerJoinedGame:   `${modules.gameController}::PlayerJoinedGame`,
  GameCompleted:      `${modules.gameController}::GameCompleted`,
  TournamentCancelled:`${modules.gameController}::TournamentCancelled`,

  // Relayer events
  JoinEvent:   `${modules.gameController}::JoinEvent`,
  RefundEvent: `${modules.gameController}::RefundEvent`,
  PrizeEvent:  `${modules.gameController}::PrizeEvent`,

  // prediction events
  PredictionRecorded:  `${modules.prediction}::PredictionRecorded`,
  PredictionResultSet: `${modules.prediction}::PredictionResultSet`,

  // leaderboard events
  ScoreUpdated: `${modules.leaderboard}::ScoreUpdated`,
  SeasonEnded:  `${modules.leaderboard}::SeasonEnded`,
} as const;
