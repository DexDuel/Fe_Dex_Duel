/**
 * GET /api/tournaments/[roundId]
 *
 * Returns full Round details by its on-chain roundId (u64 — passed as a decimal string in the URL).
 */

import { prisma } from "@/lib/db";
import { serializeRound } from "@/lib/serialize";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ roundId: string }> },
) {
    try {
        const { roundId: rawId } = await params;
        const roundId = BigInt(rawId);

        const round = await prisma.round.findUnique({ where: { roundId } });
        if (!round) {
            return Response.json({ ok: false, error: "Tournament not found" }, { status: 404 });
        }

        return Response.json({
            ok: true,
            data: serializeRound(round),
        });
    } catch (error) {
        console.error("[GET /api/tournaments/[roundId]]", error);
        return Response.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
