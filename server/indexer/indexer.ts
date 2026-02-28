/**
 * indexer.ts — Main event-indexing loop for DexDuel.
 *
 * Run with: npx tsx server/indexer/indexer.ts
 * (or: npm run indexer:dev)
 *
 * Strategy:
 *  - For each module (game_round, prediction, game_controller, leaderboard),
 *    query events in ascending order using a persistent cursor stored in
 *    the ChainCursor table.
 *  - Each event is deduplicated via the ChainEvent table (unique on eventType+txDigest+eventSeq).
 *  - Only new events are dispatched to the materialized-table handlers.
 *  - After each poll all cursors are persisted so the process can restart safely.
 */

import "dotenv/config";

import type { EventId } from "@onelabs/sui/client";
import { chainClient, MODULES_TO_POLL, PACKAGE_ID, type PolledModule } from "./chainClient";
import { dispatchEvent } from "./handlers";
import { prisma } from "@/lib/db";

// ─── Configuration ──────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = Math.max(
    2_000,
    Number(process.env.INDEXER_POLL_INTERVAL_MS ?? 5_000),
);
const PAGE_LIMIT = 50; // events per RPC page (max 50 for most nodes)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the ChainCursor DB key for a given module. */
function cursorKey(module: PolledModule): string {
    return `${PACKAGE_ID}::${module}`;
}

/** Load the last saved EventId cursor for this module. */
async function loadCursor(module: PolledModule): Promise<EventId | undefined> {
    const row = await prisma.chainCursor.findUnique({
        where: { eventType: cursorKey(module) },
        select: { cursor: true },
    });
    if (!row?.cursor) return undefined;
    try {
        return JSON.parse(row.cursor) as EventId;
    } catch {
        return undefined;
    }
}

/** Persist the last seen EventId cursor for this module. */
async function saveCursor(module: PolledModule, cursor: EventId): Promise<void> {
    await prisma.chainCursor.upsert({
        where: { eventType: cursorKey(module) },
        create: { eventType: cursorKey(module), cursor: JSON.stringify(cursor) },
        update: { cursor: JSON.stringify(cursor) },
    });
}

// ─── Core polling logic ───────────────────────────────────────────────────────

/**
 * Fetch and process all unprocessed events for one module.
 * Stops when no more pages are available (catches up to chain head).
 */
async function pollModule(module: PolledModule): Promise<void> {
    let cursor = await loadCursor(module);
    let totalNew = 0;

    while (true) {
        // 1. Fetch next page from chain
        const page = await chainClient.queryEvents({
            query: { MoveModule: { package: PACKAGE_ID, module } },
            cursor: cursor ?? null,
            limit: PAGE_LIMIT,
            order: "ascending",
        });

        // 2. Process each event
        for (const event of page.data) {
            const eventSeq = Number(event.id.eventSeq);

            // ── Dedup check ──────────────────────────────────────────────────────
            const existing = await prisma.chainEvent.findUnique({
                where: {
                    eventType_txDigest_eventSeq: {
                        eventType: event.type,
                        txDigest: event.id.txDigest,
                        eventSeq,
                    },
                },
                select: { id: true },
            });

            if (existing) continue; // already indexed, skip

            // ── Persist raw event ────────────────────────────────────────────────
            await prisma.chainEvent.create({
                data: {
                    eventType: event.type,
                    txDigest: event.id.txDigest,
                    eventSeq,
                    timestamp:
                        event.timestampMs
                            ? new Date(Number(event.timestampMs))
                            : new Date(),
                    payload: (event.parsedJson as object) ?? {},
                },
            });

            // ── Materialize into domain tables ───────────────────────────────────
            try {
                await dispatchEvent(event);
                totalNew++;
            } catch (err) {
                console.error(
                    `[indexer/${module}] Handler error for ${event.type} (tx: ${event.id.txDigest}):`,
                    err,
                );
                // Continue processing other events — don't let one bad event block the indexer
            }
        }

        // 3. Advance cursor if the RPC provided one (even if hasNextPage is false)
        if (page.nextCursor) {
            cursor = page.nextCursor;
            await saveCursor(module, cursor);
        }

        // 4. Stop when we've caught up to chain head
        if (!page.hasNextPage) break;
    }

    if (totalNew > 0) {
        console.log(`[indexer/${module}] ✔ ${totalNew} new event(s) indexed`);
    }
}

// ─── Main loop ────────────────────────────────────────────────────────────────

async function runCycle(): Promise<void> {
    for (const module of MODULES_TO_POLL) {
        try {
            await pollModule(module);
        } catch (err) {
            console.error(`[indexer/${module}] Poll cycle error:`, err);
        }
    }
}

async function main(): Promise<void> {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║   DexDuel On-Chain Event Indexer — starting…    ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`  RPC: ${process.env.NEXT_PUBLIC_CHAIN_RPC ?? "https://rpc-testnet.onelabs.cc:443"}`);
    console.log(`  Package: ${PACKAGE_ID}`);
    console.log(`  Poll interval: ${POLL_INTERVAL_MS}ms`);
    console.log(`  Modules: ${MODULES_TO_POLL.join(", ")}\n`);

    // Run immediately on start, then on interval
    await runCycle();

    setInterval(() => {
        runCycle().catch((err) => {
            console.error("[indexer] Unhandled cycle error:", err);
        });
    }, POLL_INTERVAL_MS);
}

main().catch((err) => {
    console.error("[indexer] Fatal startup error:", err);
    process.exit(1);
});
