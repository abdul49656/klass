import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ATMOS webhook endpoint — called by ATMOS when payment status changes.
 * Verifies the request and updates payment/membership records.
 *
 * NOTE: Full ATMOS integration pending credentials.
 * This is the webhook handler stub ready for production wiring.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // TODO: Verify ATMOS HMAC signature
    // const signature = request.headers.get("x-atmos-signature");
    // if (!verifyAtmosSignature(body, signature)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const { transaction_id, status, account } = body;

    // Find the payment by ATMOS transaction ID
    const { data: payment } = await admin
      .from("payments")
      .select("*")
      .eq("atmos_transaction_id", transaction_id)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (status === "CONFIRMED") {
      // Update payment status
      await admin
        .from("payments")
        .update({ status: "confirmed" })
        .eq("id", payment.id);

      // Activate membership
      if (payment.payment_type === "subscription" && payment.community_id) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await admin
          .from("memberships")
          .upsert({
            user_id: payment.user_id,
            community_id: payment.community_id,
            status: "active",
            expires_at: expiresAt.toISOString(),
          });

        // Update member count
        await admin.rpc("increment_member_count", {
          p_community_id: payment.community_id,
        });

        // Write to creator earnings ledger
        const { data: community } = await admin
          .from("communities")
          .select("creator_id")
          .eq("id", payment.community_id)
          .single();

        if (community) {
          const { data: creator } = await admin
            .from("users")
            .select("platform_tier")
            .eq("id", community.creator_id)
            .single();

          const TIER_CUTS = { free: 0.1, growth: 0.05, pro: 0.02 };
          const cut = TIER_CUTS[(creator?.platform_tier as keyof typeof TIER_CUTS) ?? "free"];
          const platformFee = Math.round(payment.amount_uzs * cut);
          const creatorShare = payment.amount_uzs - platformFee;

          await admin.from("creator_earnings_ledger").insert({
            creator_id: community.creator_id,
            community_id: payment.community_id,
            learner_payment_id: payment.id,
            gross_amount_uzs: payment.amount_uzs,
            platform_fee_uzs: platformFee,
            creator_share_uzs: creatorShare,
          });
        }
      }
    } else if (status === "FAILED" || status === "CANCELLED") {
      await admin
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
