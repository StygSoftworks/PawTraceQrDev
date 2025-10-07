import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req)=>{
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"));
    // Verify caller is logged in
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supa.auth.getUser(token);
    if (!user) return new Response("Unauthorized", {
      status: 401
    });
    const body = await req.json();
    const { plan_id, subscription_id, product_type } = body;
    // Use service role for DB writes
    const svc = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    // Decide base plan type for your own reference
    const basePlan = product_type === "base" ? plan_id.includes("year") ? "yearly" : "monthly" : null;
    // Upsert
    const patch = {
      user_id: user.id,
      status: "pending",
      last_event: "CLIENT_APPROVED",
      updated_at: new Date().toISOString()
    };
    if (product_type === "base") {
      patch.base_plan = basePlan;
      patch.base_paypal_sub_id = subscription_id;
    } else {
      patch.addon_paypal_sub_id = subscription_id;
      patch.addon_quantity = 1; // You can adjust this later if you sell multiple at once
    }
    const { error } = await svc.from("subscriptions").upsert(patch, {
      onConflict: "user_id"
    });
    if (error) throw error;
    return new Response(JSON.stringify({
      ok: true
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (e) {
    console.error(e);
    return new Response("Error", {
      status: 500
    });
  }
});
