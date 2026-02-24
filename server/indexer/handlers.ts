/**
 * handlers.ts — Materializes on-chain Move events into the Postgres database.
 *
 * Each handler is responsible for one event type.  They are pure DB writes —
 * no chain RPC calls happen here.
 */

import type { SuiEvent } from "@onelabs/sui/client";
import { prisma } from "@/lib/db";
import { EVENT_TYPES } from "./eventTypes";
import {
    decodeCoinSymbol,
    isRecord,
    toBigInt,
    toDate,
    toNumber,
    toPlayer,
} from "./utils";

// ────────────────────────────────────────────────────────────────────────────
// Dispatcher
// ────────────────────────────────────────────────────────────────────────────

export async function dispatchEvent(event: SuiEvent): Promise<void> {
    const payload = isRecord(event.parsedJson) ? event.parsedJson : null;
    if (!payload) return;

    switch (event.type) {
        case EVENT_TYPES.RoundCreated:
            await handleRoundCreated(payload);
            break;
        case EVENT_TYPES.RoundEnded:
            await handleRoundEnded(payload);
            break;
        case EVENT_TYPES.RoundSettled:
            await handleRoundSettled(payload);
            break;
        case EVENT_TYPES.PredictionRecorded:
            await handlePredictionRecorded(payload, event);
            break;
        case EVENT_TYPES.PredictionResultSet:
            await handlePredictionResultSet(payload);
            break;
        case EVENT_TYPES.RewardClaimed:
            await handleRewardClaimed(payload, event);
            break;
        case EVENT_TYPES.ScoreUpdated:
            await handleScoreUpdated(payload, event);
            break;
        case EVENT_TYPES.SeasonEnded:
            await handleSeasonEnded(payload, event);
            break;
        default:
            // Silently ignore unknown event types emitted by the same modules
            break;
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Individual handlers
// ────────────────────────────────────────────────────────────────────────────

async function handleRoundCreated(p: Record<string, unknown>) {
    const roundId = toBigInt(p.round_id);
    const coinSymbol = decodeCoinSymbol(p.coin_symbol);
    const startTime = toDate(p.start_time);
    const endTime = toDate(p.end_time);
    const entryFee = toBigInt(p.entry_fee);

    await prisma.round.upsert({
        where: { roundId },
        create: { roundId, coinSymbol, startTime, endTime, entryFee, status: "PENDING" },
        update: { coinSymbol, startTime, endTime, entryFee },
    });
}

async function handleRoundEnded(p: Record<string, unknown>) {
    await prisma.round.updateMany({
        where: { roundId: toBigInt(p.round_id) },
        data: {
            priceStart: toBigInt(p.price_start),
            priceEnd: toBigInt(p.price_end),
            winnerDir: toNumber(p.winner_direction),
            status: "ENDED",
        },
    });
}

async function handleRoundSettled(p: Record<string, unknown>) {
    await prisma.round.updateMany({
        where: { roundId: toBigInt(p.round_id) },
        data: {
            totalYield: toBigInt(p.total_yield),
            adminFee: toBigInt(p.admin_fee),
            prizePool: toBigInt(p.prize_pool),
            status: "SETTLED",
        },
    });
}

async function handlePredictionRecorded(
    p: Record<string, unknown>,
    event: SuiEvent,
) {
    const roundId = toBigInt(p.round_id);
    const player = toPlayer(p.player);
    if (!player) return;

    const direction = toNumber(p.direction);
    const stakeRaw = toBigInt(p.stake_amount);
    const time = toDate(p.prediction_time);
    const isEarly = p.is_early === true || p.is_early === "true";
    const txDigest = event.id.txDigest;

    await prisma.prediction.upsert({
        where: { roundId_player: { roundId, player } },
        create: { roundId, player, direction, stakeRaw, time, isEarly, txDigest },
        update: { direction, stakeRaw, time, isEarly },
    });

    // Recompute aggregates for this round from the Prediction table (safe for any ordering)
    const [upAgg, downAgg] = await Promise.all([
        prisma.prediction.aggregate({
            where: { roundId, direction: 1 },
            _count: { id: true },
            _sum: { stakeRaw: true },
        }),
        prisma.prediction.aggregate({
            where: { roundId, direction: 2 },
            _count: { id: true },
            _sum: { stakeRaw: true },
        }),
    ]);

    const upCount = upAgg._count.id;
    const downCount = downAgg._count.id;
    const totalUpStake = upAgg._sum.stakeRaw ?? BigInt(0);
    const totalDownStake = downAgg._sum.stakeRaw ?? BigInt(0);

    await prisma.round.updateMany({
        where: { roundId },
        data: {
            upCount,
            downCount,
            totalParticipants: upCount + downCount,
            totalUpStake,
            totalDownStake,
        },
    });
}

async function handlePredictionResultSet(p: Record<string, unknown>) {
    const roundId = toBigInt(p.round_id);
    const player = toPlayer(p.player);
    if (!player) return;

    await prisma.prediction.updateMany({
        where: { roundId, player },
        data: {
            isCorrect: p.is_correct === true || p.is_correct === "true",
            rank: toNumber(p.rank),
        },
    });
}

async function handleRewardClaimed(
    p: Record<string, unknown>,
    event: SuiEvent,
) {
    const roundId = toBigInt(p.round_id);
    const player = toPlayer(p.player);
    if (!player) return;

    const timestamp = event.timestampMs
        ? new Date(Number(event.timestampMs))
        : new Date();

    await prisma.rewardClaim.upsert({
        where: { roundId_player: { roundId, player } },
        create: {
            roundId,
            player,
            principal: toBigInt(p.principal),
            reward: toBigInt(p.reward),
            txDigest: event.id.txDigest,
            timestamp,
        },
        update: {}, // claim is immutable — ignore re-delivery
    });
}

async function handleScoreUpdated(
    p: Record<string, unknown>,
    event: SuiEvent,
) {
    const seasonId = toBigInt(p.season_id);
    const player = toPlayer(p.player);
    if (!player) return;

    const points = toBigInt(p.points_earned);
    const newTotal = toBigInt(p.new_total_score);
    const streak = toBigInt(p.current_streak);
    const ts = event.timestampMs ? new Date(Number(event.timestampMs)) : new Date();

    await prisma.$transaction([
        prisma.scoreEvent.create({
            data: {
                seasonId,
                player,
                points,
                newTotal,
                streak,
                txDigest: event.id.txDigest,
                timestamp: ts,
            },
        }),
        prisma.score.upsert({
            where: { seasonId_player: { seasonId, player } },
            create: { seasonId, player, total: newTotal, streak, updatedAt: ts },
            update: { total: newTotal, streak, updatedAt: ts },
        }),
    ]);
}

async function handleSeasonEnded(
    p: Record<string, unknown>,
    event: SuiEvent,
) {
    const seasonId = toBigInt(p.season_id);
    const ts = event.timestampMs ? new Date(Number(event.timestampMs)) : new Date();

    await prisma.seasonSummary.upsert({
        where: { seasonId },
        create: {
            seasonId,
            totalPlayers: toBigInt(p.total_players),
            winner: toPlayer(p.winner) || (typeof p.winner === "string" ? p.winner : ""),
            winningScore: toBigInt(p.winning_score),
            txDigest: event.id.txDigest,
            timestamp: ts,
        },
        update: {}, // season summary is immutable
    });
}
