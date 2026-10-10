import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  isProduct,
  priceFor,
  resolvePaymentMode,
  newOrderReference,
  canTransition,
  canVerify,
  effectivePlan,
  type OrderStatus,
  type PaymentMode,
  type SubscriptionRow,
} from "@/lib/billing/core";

function mode(): PaymentMode {
  return resolvePaymentMode({
    PAYMENT_MODE: process.env["PAYMENT_MODE"],
    UPI_VERIFICATION_READY: process.env["UPI_VERIFICATION_READY"],
    GATEWAY_READY: process.env["GATEWAY_READY"],
  });
}

export const getPaymentMode = createServerFn({ method: "GET" }).handler(async () => ({
  mode: mode(),
}));

/** Current user's plan, subscription and orders (RLS as the user). */
export const getMyBilling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [
      { data: sub, error: subError },
      { data: orders, error: ordersError },
      { data: isAdmin, error: roleError },
    ] = await Promise.all([
      sb
        .from("subscriptions")
        .select("plan,status,starts_at,expires_at")
        .eq("user_id", context.userId)
        .maybeSingle(),
      sb
        .from("orders")
        .select(
          "id,reference,product,amount_inr,currency,billing_period,status,payment_mode,created_at,updated_at",
        )
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      sb.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    if (subError || ordersError || roleError) throw new Error("Could not load billing. Try again.");
    return {
      mode: mode(),
      plan: effectivePlan(sub as SubscriptionRow),
      subscription: sub,
      orders: orders ?? [],
      isAdmin: !!isAdmin,
    };
  });

/** Free Explorer activates without payment. Never downgrades an active paid plan. */
export const activateFree = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("plan,status,expires_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (effectivePlan(sub as SubscriptionRow) !== "free")
      return { ok: false as const, message: "You already have an active paid plan." };
    if (!sub)
      await supabaseAdmin
        .from("subscriptions")
        .insert({ user_id: context.userId, plan: "free", status: "active" });
    return { ok: true as const };
  });

/** Create (or return the existing open) order. Price is set on the server. */
export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const p = (input as { product?: unknown })?.product;
    if (!isProduct(p)) throw new Error("Unknown product");
    return { product: p };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", context.userId)
      .eq("product", data.product)
      .in("status", ["draft", "pending_payment", "pending_verification"])
      .maybeSingle();
    if (existing) return { order: existing, reused: true };

    const { amount, period } = priceFor(data.product);
    const payment_mode = mode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: context.userId,
          reference: newOrderReference(),
          product: data.product,
          amount_inr: amount,
          billing_period: period,
          status: "pending_payment",
          payment_mode,
        })
        .select("*")
        .single();
      if (order) {
        await supabaseAdmin.from("payment_events").insert({
          order_id: order.id,
          user_id: context.userId,
          actor_id: context.userId,
          action: "order_created",
          to_status: "pending_payment",
          reason: `mode=${payment_mode}`,
        });
        return { order, reused: false };
      }
      if (error?.code === "23505" && /orders_one_open/.test(error.message)) {
        const { data: again } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("user_id", context.userId)
          .eq("product", data.product)
          .in("status", ["draft", "pending_payment", "pending_verification"])
          .maybeSingle();
        if (again) return { order: again, reused: true };
      }
      if (error?.code !== "23505") throw new Error("Could not create the order. Try again.");
    }
    throw new Error("Could not create the order. Try again.");
  });

/** Customer cancels their own open order. */
export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const id = (input as { id?: unknown })?.id;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id)) throw new Error("Invalid order");
    return { id };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,status,user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!order || order.user_id !== context.userId) throw new Error("Order not found");
    if (!canTransition(order.status as OrderStatus, "cancelled"))
      throw new Error("This order can no longer be cancelled.");
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", order.status)
      .select("id")
      .maybeSingle();
    if (updateError || !updated)
      throw new Error("Order changed or could not be cancelled. Reload billing.");
    await supabaseAdmin.from("payment_events").insert({
      order_id: order.id,
      user_id: context.userId,
      actor_id: context.userId,
      action: "customer_cancelled",
      from_status: order.status,
      to_status: "cancelled",
    });
    return { ok: true };
  });

/* Admin -------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- receives the request-scoped client from auth middleware
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase; // admin RLS policies grant read-all
    const [{ data: orders }, { data: subs }, { data: events }] = await Promise.all([
      sb.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("subscriptions").select("*").order("updated_at", { ascending: false }).limit(200),
      sb.from("payment_events").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    return { mode: mode(), orders: orders ?? [], subscriptions: subs ?? [], events: events ?? [] };
  });

/** Approve / reject a manually verified payment. Requires a reason; audited. */
export const adminDecideOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { id?: unknown; decision?: unknown; reason?: unknown };
    if (typeof i?.id !== "string" || !/^[0-9a-f-]{36}$/.test(i.id))
      throw new Error("Invalid order");
    if (i.decision !== "verified" && i.decision !== "rejected") throw new Error("Invalid decision");
    if (typeof i.reason !== "string" || i.reason.trim().length < 5 || i.reason.length > 500)
      throw new Error("A reason (5–500 characters) is required");
    return { id: i.id, decision: i.decision, reason: i.reason.trim() };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    const status = order.status as OrderStatus;
    if (
      data.decision === "verified" &&
      !canVerify({ status, payment_mode: order.payment_mode as PaymentMode })
    ) {
      throw new Error(
        order.payment_mode === "demo"
          ? "Demo orders can never be verified."
          : "Order is not awaiting verification.",
      );
    }
    if (!canTransition(status, data.decision as OrderStatus))
      throw new Error(`Cannot move from ${status} to ${data.decision}.`);

    const now = new Date();
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.decision, admin_note: data.reason, updated_at: now.toISOString() })
      .eq("id", order.id)
      .eq("status", status); // optimistic guard against double decisions
    if (error) throw new Error("Update failed");
    await supabaseAdmin.from("payment_events").insert({
      order_id: order.id,
      user_id: order.user_id,
      actor_id: context.userId,
      action: `admin_${data.decision}`,
      from_status: status,
      to_status: data.decision,
      reason: data.reason,
      idempotency_key: `decide:${order.id}`,
    });

    if (data.decision === "verified" && order.product !== "custom_report") {
      const expires = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: order.user_id,
          plan: order.product,
          status: "active",
          starts_at: now.toISOString(),
          expires_at: expires.toISOString(),
          source_order_id: order.id,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
    return { ok: true };
  });
