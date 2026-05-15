import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "./store";

// Routes that are publicly accessible — no login redirect
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register"];

/**
 * Returns the accessToken only after the Zustand persist store has
 * fully hydrated from localStorage. Until hydration is done, returns
 * `null` so protected pages don't prematurely redirect to /auth/login.
 * Public routes (landing page, auth pages) are never redirected.
 */
export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useStore((s) => s.accessToken);
  const [hydrated, setHydrated] = useState(false);

  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/auth/");

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken && !isPublic) {
      router.push("/auth/login");
    }
  }, [hydrated, accessToken, isPublic, router]);

  return hydrated ? accessToken : null;
}
