import React, { createContext, useContext, useEffect, useState } from "react";
import { sessionStorage } from "./session-storage";
import { login as loginRequest } from "./auth.service";
import type { User } from "./types";

const KEY = "national-acts-session";
type Session = { user: User; expiresAt: number };
type Auth = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = await sessionStorage.getItem(KEY);
        const value: Session | null = saved ? JSON.parse(saved) : null;
        if (
          value?.user?.token &&
          value.user.isAuthenticated &&
          value.expiresAt > Date.now()
        ) {
          if (active) setSession(value);
        } else await sessionStorage.removeItem(KEY);
      } catch {
        /* Fail closed if storage is unavailable or invalid. */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function logout() {
    await sessionStorage.removeItem(KEY);
    setSession(null);
  }
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      () => {
        void logout().catch(() => {});
      },
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session]);
  async function login(username: string, password: string) {
    const response = await loginRequest(username.trim(), password);
    if (!response.success || !response.user)
      throw new Error(response.error || "Unable to sign in.");
    const { password: ignored, ...user } = response.user as User & {
      password?: string;
    };
    const value = { user, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
    // Persist only the token and minimal identity fields, never passwords.
    await sessionStorage.setItem(
      KEY,
      JSON.stringify({
        ...value,
        user: {
          token: user.token,
          isAuthenticated: true,
          username: user.username,
          userId: user.userId,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
          sellers: user.sellers,
          disableCheckIn: user.disableCheckIn,
        },
      }),
    );
    setSession(value);
  }
  return (
    <Context.Provider
      value={{ user: session?.user ?? null, loading, login, logout }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const auth = useContext(Context);
  if (!auth) throw new Error("AuthProvider is missing.");
  return auth;
}
