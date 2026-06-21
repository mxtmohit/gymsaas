'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    // Simulate API/Supabase call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-brutal-bg flex flex-col justify-center items-center px-4 py-12">
      
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/">
            <Logo className="scale-110 mb-2" />
          </Link>
          <h2 className="text-3xl font-extrabold uppercase text-black tracking-tight">
            Reset Password
          </h2>
          <p className="text-slate-800 text-sm font-semibold">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {/* Card */}
        <div className="neo-card p-8 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000]">
          
          {success ? (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 bg-green-100 border-3 border-black text-black rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold uppercase">Check Your Inbox</h3>
                <p className="text-slate-850 text-sm font-semibold leading-relaxed">
                  We have sent recovery instructions to <br />
                  <span className="text-brutal-orange font-mono font-black">{email}</span>
                </p>
              </div>
              <Link
                href="/login"
                className="w-full neo-btn text-sm font-bold py-3 px-4 shadow-[3px_3px_0px_0px_#000000] flex justify-center items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Return to Log In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full neo-btn neo-btn-orange text-white py-3.5 px-4 font-black uppercase shadow-[3px_3px_0px_0px_#000000]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Sending Instructions...</span>
                  </>
                ) : (
                  <span>Send Recovery Email</span>
                )}
              </button>

              {/* Back Link */}
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-650 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>Back to Log In</span>
                </Link>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
