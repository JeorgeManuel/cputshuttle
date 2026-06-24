"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthResponse } from "@/types/auth";

export type UserInfo = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  reporterStatus: string;
};

const TOKEN_KEY = "st_token";
const USER_KEY = "st_user";

export function saveAuth(result: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Hook that reads auth state from localStorage on mount.
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    setToken(storedToken);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as UserInfo);
      } catch {
        setUser(null);
      }
    }
  }, []);

  return { token, user };
}

/**
 * Hook that returns auth headers suitable for API calls, or null if not logged in.
 */
export function useAuthHeaders() {
  const { token, user } = useAuth();

  const headers = useMemo(() => {
    if (!token) return null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }, [token]);

  return { token, user, headers };
}
