"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken, setUser } = useStore();
  const initialEmail = useMemo(
    () => searchParams.get("email") ?? user?.email ?? "",
    [searchParams, user?.email],
  );
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("Enter the 6-digit code sent to your email.");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await api.auth.verifyEmail({ email, otp });
      if (user) setUser({ ...user, emailVerified: true });
      router.push(accessToken ? "/auth/onboarding" : "/auth/login");
    } catch (e: any) {
      setError(e.message ?? "Verification failed. Check the code and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setIsResending(true);
    try {
      await api.auth.resendVerification({ email });
      setMessage("A new verification code has been sent.");
    } catch (e: any) {
      setError(e.message ?? "Could not resend the code yet.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.08),transparent_70%)] blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-panel p-10 md:p-12 rounded-[2rem] relative z-10"
      >
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-gold text-[10px] uppercase tracking-[0.3em] mb-10 hover:text-white transition-colors group">
          Back to sign in
        </Link>

        <div className="w-12 h-12 rounded-2xl border border-gold/30 bg-gold/10 flex items-center justify-center mb-6">
          <MailCheck className="text-gold" size={22} />
        </div>

        <h1 className="font-serifDisplay text-4xl sm:text-5xl text-white mb-3">Verify email</h1>
        <p className="text-white/40 text-[15px] mb-8">
          Confirm your address before continuing.
        </p>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all text-sm"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Verification code</label>
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              type="text"
              inputMode="numeric"
              placeholder="123456"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all text-sm tracking-[0.4em]"
              autoComplete="one-time-code"
            />
          </div>

          {message && (
            <div className="p-4 rounded-xl bg-gold/10 border border-gold/20">
              <p className="text-gold text-sm m-0">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm m-0">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6 || !email}
            className="w-full bg-gold border border-gold/80 text-[#060606] font-semibold hover:bg-[#e8c97a] hover:-translate-y-0.5 transition-all rounded-full py-4 text-xs uppercase tracking-[0.2em] mt-2 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSubmitting ? "Verifying..." : "Verify email"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || !email}
          className="w-full mt-4 text-white/50 hover:text-gold transition-colors text-sm disabled:opacity-50"
        >
          {isResending ? "Sending..." : "Resend code"}
        </button>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
