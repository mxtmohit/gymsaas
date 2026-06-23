"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { db } from "@/lib/database";
import {
  KeyRound,
  Mail,
  Building,
  Link2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-generate slug from Gym Name
  useEffect(() => {
    const generatedSlug = gymName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .trim()
      .replace(/\s+/g, "-") // replace spaces with -
      .replace(/-+/g, "-"); // replace multiple - with single -
    setSlug(generatedSlug);
  }, [gymName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gymName || !slug || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await db.signUp(email, gymName, slug, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err?.message || "Failed to sign up. Slug might be taken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-brutal-bg flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/">
            <Logo className="scale-110 mb-2" />
          </Link>
          <h2 className="text-3xl font-extrabold uppercase text-black tracking-tight">
            Launch Your Gym Today
          </h2>
          <p className="text-slate-800 text-sm font-semibold">
            Onboard members, accept payments, and control subscriptions.
          </p>
        </div>

        {/* Card */}
        <div className="neo-card p-8 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000]">
          {error && (
            <div className="mb-6 bg-red-100 border-3 border-black text-black font-semibold text-xs sm:text-sm rounded-xl p-3.5 shadow-[2px_2px_0px_0px_#000000]">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-100 border-3 border-black text-black font-semibold text-xs sm:text-sm rounded-xl p-3.5 shadow-[2px_2px_0px_0px_#000000]">
              <span>Registration successful! Launching your dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gym Name Field */}
            <div>
              <label
                htmlFor="gym-name"
                className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2"
              >
                Gym Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                  <Building className="w-5 h-5 stroke-[2.5]" />
                </div>
                <input
                  id="gym-name"
                  type="text"
                  required
                  placeholder="e.g. Gold's Gym Bilaspur"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="neo-input block w-full !pl-11"
                />
              </div>
            </div>

            {/* Custom Slug Field */}
            <div>
              <label
                htmlFor="slug"
                className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2"
              >
                Custom Join URL Slug
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                  <Link2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <input
                  id="slug"
                  type="text"
                  required
                  placeholder="golds-gym-bilaspur"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                  }
                  className="neo-input block w-full !pl-11 font-mono text-brutal-orange"
                />
              </div>

              <div className="mt-2.5 bg-brutal-bg p-3 border-2 border-black rounded-lg">
                <p className="text-[10px] sm:text-xs font-bold text-black leading-normal">
                  Branded onboarding link: <br />
                  <span className="text-brutal-orange font-mono font-black">
                    {slug || "your-gym-slug"}.mygymsaas.com
                  </span>
                </p>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                  <Mail className="w-5 h-5 stroke-[2.5]" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="owner@yourgym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neo-input block w-full !pl-11"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                  <KeyRound className="w-5 h-5 stroke-[2.5]" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input block w-full !pl-11 !pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-750 hover:text-black cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full neo-btn neo-btn-orange text-white py-3.5 px-4 font-black uppercase shadow-[3px_3px_0px_0px_#000000]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register & Set Up Gym</span>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t-3 border-black text-center">
            <p className="text-slate-700 text-sm font-bold">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brutal-orange font-extrabold hover:underline transition"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
