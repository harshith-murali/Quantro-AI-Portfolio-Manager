import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./store";

/**
 * Returns the accessToken only after the Zustand persist store has
 * fully hydrated from localStorage. Until hydration is done, returns
 * `null` so protected pages don't prematurely redirect to /auth/login.
 */
export function useAuth() {
  const router = useRouter();
  const accessToken = useStore((s) => s.accessToken);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // If already hydrated (e.g. client-side navigation after first load)
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.push("/auth/login");
    }
  }, [hydrated, accessToken, router]);

  // Return null until hydrated so callers can show a loading state
  return hydrated ? accessToken : null;
}
