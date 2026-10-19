import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { inquirySchema } from "@/lib/commerce";
import { REQUEST_LIMIT, retryMessage } from "@/lib/request-policy";

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inquirySchema.extend({ website: z.string().max(200).optional() }).parse(input))
  .handler(async ({ data }) => {
    if (data.website) return { ok: false, message: "Your request could not be sent." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Do not trust arbitrary X-Forwarded-For headers. Hosting supplies CF-Connecting-IP.
    // With no trusted address, share a conservative anonymous bucket.
    const ip = getRequestHeader("cf-connecting-ip") ?? "unknown-origin";
    for (const subject of [`inquiry-ip:${ip}`, `inquiry-email:${data.email.toLowerCase()}`]) {
      const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(subject));
      const key = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
      const { data: claim, error } = await supabaseAdmin.rpc("claim_request_window", {
        p_key: key, p_limit: REQUEST_LIMIT.inquiriesPerHour, p_window_seconds: REQUEST_LIMIT.windowSeconds,
      });
      if (error) { console.error("Inquiry reservation failed", error.code); return { ok: false, message: "Requests are temporarily unavailable. Please try again." }; }
      if (claim && typeof claim === "object" && !Array.isArray(claim) && claim.ok === false) {
        return { ok: false, message: retryMessage(Number(claim.waitSeconds) || REQUEST_LIMIT.windowSeconds) };
      }
    }
    const { error } = await supabaseAdmin.from("inquiries").insert({
      kind: data.kind, name: data.name, email: data.email.toLowerCase(),
      company: data.company ?? null, message: data.message,
    });
    if (error) return { ok: false, message: error.code === "23505"
      ? "We already received a request of this type from this email today."
      : "Your request could not be saved. Please try again." };
    return { ok: true, message: "Request received." };
  });