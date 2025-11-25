import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../api/supabaseClient";
import type { User, AuthError } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<AuthError | null>;
  signUp(email: string, password: string): Promise<AuthError | null>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        console.warn("Error loading Supabase session:", error.message);
      } else {
        setUser(data.session?.user ?? null);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthError | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("signIn error:", error.message);
      return error;
    }

    setUser(data.user ?? null);
    return null;
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<AuthError | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.log("signUp error:", error.message);
      return error;
    }

    // for some setups you only get a confirmation email, so no user yet
    setUser(data.user ?? null);
    return null;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("signOut error:", error.message);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
