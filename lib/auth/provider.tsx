"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = React.useMemo(() => createClient(), []);
  const [user, setUser] = React.useState<User | null>(null);
  const [ready, setReady] = React.useState(!client);

  React.useEffect(() => {
    if (!client) return;
    let active = true;
    void client.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user);
        setReady(true);
      }
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      configured: Boolean(client),
      async signIn(email, password) {
        if (!client) throw new Error("A sincronização ainda não foi configurada.");
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(email, password) {
        if (!client) throw new Error("A sincronização ainda não foi configurada.");
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;
        return !data.session;
      },
      async signOut() {
        if (!client) return;
        const { error } = await client.auth.signOut();
        if (error) throw error;
      },
    }),
    [client, ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return value;
}
