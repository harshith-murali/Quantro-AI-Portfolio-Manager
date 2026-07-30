"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        setExpiredMsg(true);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError("");
    try {
      const { user, accessToken } = await api.auth.login(data);
      useStore.getState().setAccessToken(accessToken);
      setUser(user);
      router.push("/dashboard");
    } catch (e: any) {
      setServerError(e.message ?? "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background ambient glow specific to auth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.08),transparent_70%)] blur-3xl pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-panel p-10 md:p-12 rounded-[2rem] relative z-10"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-gold text-[10px] uppercase tracking-[0.3em] mb-10 hover:text-white transition-colors group">
          ← Back to site
        </Link>

        <h1 className="font-serifDisplay text-4xl sm:text-5xl text-white mb-3">Welcome back</h1>
        <p className="text-white/40 text-[15px] mb-8">Sign in to your portfolio</p>

        {expiredMsg && (
          <div className="p-4 mb-6 rounded-xl bg-gold/10 border border-gold/20 flex items-center gap-3 text-gold">
            <AlertCircle size={18} className="shrink-0" />
            <span className="text-xs leading-relaxed font-semibold">
              Your session has expired. Please sign in again.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all text-sm"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-xs mt-2">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-gold transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-2">{errors.password.message}</p>}
          </div>

          {serverError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm m-0">{serverError}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-gold border border-gold/80 text-[#060606] font-semibold hover:bg-[#e8c97a] hover:-translate-y-0.5 transition-all rounded-full py-4 text-xs uppercase tracking-[0.2em] mt-2"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-white/40 text-sm">
          No account?{" "}
          <Link href="/auth/register" className="text-gold hover:text-white transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
