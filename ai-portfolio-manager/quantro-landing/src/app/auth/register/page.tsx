"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError("");
    try {
      const { user, accessToken, emailVerificationRequired } = await api.auth.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      useStore.getState().setAccessToken(accessToken);
      setUser(user);
      router.push(
        emailVerificationRequired
          ? `/auth/verify-email?email=${encodeURIComponent(user.email)}`
          : "/auth/onboarding",
      );
    } catch (e: any) {
      setServerError(e.message ?? "Registration failed. Try a different email.");
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

        <h1 className="font-serifDisplay text-4xl sm:text-5xl text-white mb-3">Create account</h1>
        <p className="text-white/40 text-[15px] mb-8">
          Start your AI-powered portfolio journey
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Full Name</label>
            <input
              {...register("name")}
              type="text"
              placeholder="Your full name"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all text-sm"
              autoComplete="name"
            />
            {errors.name && <p className="text-red-400 text-xs mt-2">{errors.name.message}</p>}
          </div>

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
                placeholder="Min. 8 chars, include A-Z, 0-9, @#$…"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all text-sm"
                autoComplete="new-password"
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

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all text-sm"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-gold transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-2">{errors.confirmPassword.message}</p>
            )}
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
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-white/40 text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-gold hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
