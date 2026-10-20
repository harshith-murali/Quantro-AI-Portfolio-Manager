"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
export function DemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="my-5">
      <button
        type="button"
        disabled={busy}
        className="w-full rounded-xl border border-gold/40 text-gold px-5 py-3 hover:bg-gold/10 disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const d = await api.auth.demo();
            useStore.getState().setAccessToken(d.accessToken);
            useStore.getState().setUser(d.user);
            router.push("/dashboard");
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Creating your sandbox…"
          : "Explore an interview sandbox · ₹1,00,000 virtual cash"}
      </button>
      {error && (
        <p role="alert" className="text-red-400 text-sm mt-2">
          {error}
        </p>
      )}
      <p className="text-white/40 text-xs mt-2">
        Fresh, isolated paper-trading account. No brokerage connection or real
        money.
      </p>
    </div>
  );
}
