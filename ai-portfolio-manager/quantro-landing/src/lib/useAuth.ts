"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "./store";
import { api } from "./api";

// Routes that are publicly accessible — no login redirect
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register"];

/**
 * Handles auth state with silent token refresh.
 *
 * On every mount:
 *  1. Wait for Zustand persist to hydrate from localStorage.
 *  2. If an in-memory accessToken already exists → user is considered logged in.
 *  3. If NO stored token and the route is protected → attempt a silent refresh
 *     using the HttpOnly refresh-token cookie the backend set at login.
 *     • Success → store new token + user, stay on page.
 *     • Failure → redirect to /auth/login.
 *  4. Public routes are never redirected regardless of auth state.
 */
export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, setUser } = useStore();

  // Track whether we have finished the async bootstrap
  const [ready, setReady] = useState(false);
  const bootstrapped = useRef(false);

  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/auth/");

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const bootstrap = async () => {
      // 1. Wait for zustand-persist to rehydrate from localStorage
      if (!useStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useStore.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        });
      }

      // 2. Read the freshly-hydrated token
      const storedToken = useStore.getState().accessToken;
      if (storedToken) {
        // Already logged in — nothing to do
        setReady(true);
        return;
      }

      // 3. No stored token — try a silent refresh before giving up
      if (!isPublic) {
        try {
          const { accessToken: newToken } = await api.auth.refresh();
          useStore.getState().setAccessToken(newToken);
          // Also re-hydrate user profile
          try {
            const data = await api.auth.me(newToken);
            setUser(data.user ?? data);
          } catch {
            // non-fatal — user info can be fetched by the page itself
          }
        } catch {
          // Refresh cookie is gone / expired → force login
          router.push("/auth/login");
        }
      }

      setReady(true);
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard: after bootstrap completes, watch for token being cleared (e.g. logout)
  useEffect(() => {
    if (!ready) return;
    if (!accessToken && !isPublic) {
      router.push("/auth/login");
    }
  }, [ready, accessToken, isPublic, router]);

  // Return null until we know the auth state to prevent premature redirects
  return ready ? accessToken : null;
}
