/**
 * Shared helpers for backend modules: current user id, watchlist key sets.
 */
import { supabase } from "@/integrations/supabase/client";

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function requireUserId(message: string): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new Error(message);
  return id;
}

/** Longest identifier a client may store against itself. */
export const MAX_KEY_LENGTH = 120;

/** Validated identifier, or a thrown error naming the problem. */
export function cleanKey(raw: string): string {
  const key = raw.trim();
  if (!key) throw new Error("Nothing to track — the identifier was empty.");
  if (key.length > MAX_KEY_LENGTH) {
    throw new Error("That identifier is not a valid GlobalMatrix reference.");
  }
  return key;
}

/** All watchlist keys for the signed-in user, or empty set when signed out. */
export async function watchedKeys(): Promise<Set<string>> {
  const userId = await currentUserId();
  if (!userId) return new Set();
  const { data, error } = await supabase.from("watchlist").select("event_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.event_id));
}
