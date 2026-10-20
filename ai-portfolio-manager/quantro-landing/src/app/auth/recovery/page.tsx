"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
export default function Recovery() {
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState("reset");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setToken(q.get("token") || "");
    setKind(q.get("kind") === "verify" ? "verify" : "reset");
  }, []);
  return (
    <main className="max-w-lg mx-auto px-5 pt-40 pb-24">
      <div className="glass-card">
        <h1 className="text-3xl text-white mb-3">
          Account recovery &amp; verification
        </h1>
        <p className="text-white/50 mb-5 text-sm">
          Links expire after 30 minutes and can be used once. Delivery requires
          the project&apos;s email service to be configured.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setMessage("");
            try {
              await fetchAPI(
                token ? "/auth/complete-action" : "/auth/account-action",
                {
                  method: "POST",
                  body: JSON.stringify(
                    token
                      ? {
                          token,
                          kind,
                          ...(kind === "reset" ? { password } : {}),
                        }
                      : { email, kind },
                  ),
                },
              );
              setMessage(
                token
                  ? "Completed. You can sign in again."
                  : "If the account exists, a single-use email link has been requested.",
              );
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {!token && (
            <>
              <label htmlFor="recoveryKind" className="field-label">
                Action
              </label>
              <select
                id="recoveryKind"
                className="auth-input mb-4"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="reset">Reset password</option>
                <option value="verify">Verify email</option>
              </select>
              <label htmlFor="recoveryEmail" className="field-label">
                Account email
              </label>
              <input
                id="recoveryEmail"
                className="auth-input mb-4"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}
          {token && kind === "reset" && (
            <>
              <label htmlFor="newPassword" className="field-label">
                New password
              </label>
              <input
                id="newPassword"
                className="auth-input mb-4"
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-white/40 text-xs mb-4">
                Use uppercase, lowercase, a number and a symbol.
              </p>
            </>
          )}
          <button disabled={busy} className="gold-btn w-full">
            {busy
              ? "Working…"
              : token
                ? "Complete action"
                : "Send single-use link"}
          </button>
        </form>
        {message && (
          <p role="status" className="text-emerald-300 mt-4">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-red-300 mt-4">
            {error}
          </p>
        )}
        <Link className="text-gold" href="/auth/login">
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
