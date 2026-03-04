import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Initiate a payment for joining a paid community.
 * Returns a transaction_id from ATMOS for OTP confirmation.
 *
 * NOTE: Full ATMOS wiring pending credentials.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { communityId } = await request.json();
  if (!communityId) return NextResponse.json({ error: "communityId required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: community } = await admin
    .from("communities")
    .select("id, price_uzs, is_paid, creator_id")
    .eq("id", communityId)
    .single();

  if (!community || !community.is_paid) {
    return NextResponse.json({ error: "Community not found or free" }, { status: 400 });
  }

  // Create pending payment record
  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      user_id: user.id,
      community_id: communityId,
      amount_uzs: community.price_uzs,
      status: "pending",
      payment_type: "subscription",
    })
    .select()
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }

  // TODO: Call ATMOS API to initiate payment when credentials are ready:
  // const atmosResponse = await atmosClient.createPayment({
  //   store_id: process.env.ATMOS_STORE_ID!,
  //   amount: community.price_uzs,
  //   account: payment.id,
  // });
  // Update payment with atmos_transaction_id

  return NextResponse.json({
    paymentId: payment.id,
    amount: community.price_uzs,
    // atmosTransactionId: atmosResponse.transaction_id,
    status: "pending",
    message: "Payment integration coming soon",
  });
}
