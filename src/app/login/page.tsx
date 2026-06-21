'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { db } from '@/lib/database';
import { Mail, KeyRound, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    
    const targetEmail = customEmail || email;
    const targetPassword = customPassword || password;

    if (!targetEmail || !targetPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await db.login(targetEmail, targetPassword);
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    const demoEmail = 'owner@goldsgym.com';
    const demoPassword = 'default-password-123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    handleSubmit(undefined, demoEmail, demoPassword);
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
            Welcome Back
          </h2>
          <p className="text-slate-800 text-sm font-semibold">
            Access your gym member billing dashboard
          </p>
        </div>

        {/* Card */}
        <div className="neo-card p-8 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000]">
          
          {/* Quick Demo Pre-fill */}
          <button
            type="button"
            onClick={handleUseDemo}
            className="w-full mb-6 py-3.5 px-4 bg-brutal-cyan border-3 border-black hover:bg-brutal-cyan/90 text-black rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-100 font-bold shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000000]"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm uppercase font-extrabold">One-Click Demo: Gold's Gym Owner</span>
          </button>

          {error && (
            <div className="mb-6 bg-red-100 border-3 border-black text-black font-semibold text-xs sm:text-sm rounded-xl p-3.5 shadow-[2px_2px_0px_0px_#000000]">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-100 border-3 border-black text-black font-semibold text-xs sm:text-sm rounded-xl p-3.5 shadow-[2px_2px_0px_0px_#000000]">
              <span>Login successful! Opening dashboard...</span>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
            
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

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-black uppercase text-slate-800 tracking-wider">
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-bold text-slate-650 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                  <KeyRound className="w-5 h-5 stroke-[2.5]" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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
                  {showPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
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
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>

          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t-3 border-black text-center">
            <p className="text-slate-700 text-sm font-bold">
              Don't have a gym registered?{' '}
              <Link href="/signup" className="text-brutal-orange font-extrabold hover:underline transition">
                Register Gym
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
