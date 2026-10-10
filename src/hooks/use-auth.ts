import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string | undefined;
  name: string | undefined;
  image: string | undefined;
}

function toAuthUser(user: SupabaseUser | null | undefined): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: (user.user_metadata?.full_name as string | undefined) ?? user.email,
    image: user.user_metadata?.avatar_url as string | undefined,
  };
}

/**
 * Supabase-backed replacement for the old Convex auth hook. Keeps the same
 * return shape — { isLoading, isAuthenticated, user, signIn, signOut } — so
 * every call site built against the Convex version keeps working unchanged.
 */
export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setIsLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = supabase.auth.signInWithPassword.bind(supabase.auth);
  const signOut = () => supabase.auth.signOut();

  return {
    isLoading,
    isAuthenticated: !!session,
    user: toAuthUser(session?.user),
    signIn,
    signOut,
  };
}
