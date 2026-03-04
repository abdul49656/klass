import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Weekly payout processor — triggered by Vercel Cron every Monday at 10:00 UTC.
 * Aggregates unpaid creator earnings and initiates ATMOS payout transfers.
 *
 * Protected by CRON_SECRET header (set in Vercel environment variables).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all unpaid earnings grouped by creator
  const { data: earnings } = await admin
    .from("creator_earnings_ledger")
    .select("creator_id, creator_share_uzs")
    .is("payout_id", null);

  if (!earnings?.length) {
    return NextResponse.json({ message: "No pending payouts", processed: 0 });
  }

  // Group by creator
  const byCreator: Record<string, number> = {};
  for (const e of earnings) {
    byCreator[e.creator_id] = (byCreator[e.creator_id] ?? 0) + e.creator_share_uzs;
  }

  let processed = 0;

  for (const [creatorId, amount] of Object.entries(byCreator)) {
    if (amount <= 0) continue;

    // Get creator's verified payout card
    const { data: card } = await admin
      .from("creator_payout_cards")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("is_verified", true)
      .single();

    if (!card) continue; // Skip creators without verified payout card

    // Create payout record
    const { data: payout } = await admin
      .from("creator_payouts")
      .insert({
        creator_id: creatorId,
        amount_uzs: amount,
        period_start: weekAgo.toISOString().split("T")[0],
        period_end: now.toISOString().split("T")[0],
        status: "processing",
      })
      .select()
      .single();

    if (!payout) continue;

    // TODO: Call ATMOS PAYOUT API when credentials ready:
    // await atmosPayoutClient.send({
    //   card_token: card.atmos_card_token,
    //   amount: amount,
    //   description: `Klass выплата ${payout.period_start} — ${payout.period_end}`,
    // });

    // Link earnings to payout
    await admin
      .from("creator_earnings_ledger")
      .update({ payout_id: payout.id })
      .eq("creator_id", creatorId)
      .is("payout_id", null);

    processed++;
  }

  return NextResponse.json({ message: "Payouts processed", processed });
}
