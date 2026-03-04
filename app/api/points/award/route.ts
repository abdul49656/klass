import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { POINTS_CONFIG } from "@/lib/types/database";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { communityId, event } = await request.json();
  if (!communityId || !event) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const points = POINTS_CONFIG[event as keyof typeof POINTS_CONFIG];
  if (!points) return NextResponse.json({ error: "Unknown event" }, { status: 400 });

  const admin = createAdminClient();
  await admin.rpc("award_points", {
    p_user_id: user.id,
    p_community_id: communityId,
    p_points: points,
  });

  return NextResponse.json({ success: true, points });
}
