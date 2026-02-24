import { PACKAGE_ID } from "./chainClient";

/**
 * Full qualified Move event types emitted by the DexDuel smart contract.
 */
export const EVENT_TYPES = {
    // game_round module
    RoundCreated: `${PACKAGE_ID}::game_round::RoundCreated`,
    RoundEnded: `${PACKAGE_ID}::game_round::RoundEnded`,
    RoundSettled: `${PACKAGE_ID}::game_round::RoundSettled`,
    // prediction module
    PredictionRecorded: `${PACKAGE_ID}::prediction::PredictionRecorded`,
    PredictionResultSet: `${PACKAGE_ID}::prediction::PredictionResultSet`,
    // game_controller module
    RewardClaimed: `${PACKAGE_ID}::game_controller::RewardClaimed`,
    // leaderboard module
    ScoreUpdated: `${PACKAGE_ID}::leaderboard::ScoreUpdated`,
    SeasonEnded: `${PACKAGE_ID}::leaderboard::SeasonEnded`,
} as const;

export type EventTypeName = keyof typeof EVENT_TYPES;
export type EventTypeValue = (typeof EVENT_TYPES)[EventTypeName];
