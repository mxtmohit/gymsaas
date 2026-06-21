import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { ArrowRight, QrCode, ShieldCheck, TrendingUp, Users, Sparkles, Building } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-brutal-bg text-black overflow-hidden font-sans">
      
      {/* Header Nav */}
      <header className="sticky top-0 w-full z-50 border-b-3 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/admin" 
              className="text-xs sm:text-sm font-bold text-black hover:underline"
            >
              Super Admin
            </Link>
            <Link 
              href="/login" 
              className="neo-btn text-xs sm:text-sm font-bold"
            >
              Log In
            </Link>
            <Link 
              href="/signup" 
              className="neo-btn neo-btn-yellow text-xs sm:text-sm font-bold"
            >
              Register Gym
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        
        {/* Banner Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border-3 border-black bg-white shadow-[2px_2px_0px_0px_#000000] text-black text-xs sm:text-sm font-extrabold uppercase rounded-lg">
          <span className="w-2 h-2 bg-brutal-orange rounded-full animate-ping"></span>
          <span>SaaS QR Membership Flow MVP</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight uppercase leading-none max-w-5xl mx-auto">
          Manage Gym Memberships <br className="hidden sm:inline" />
          <span className="bg-brutal-cyan border-3 border-black px-4 py-1 inline-block rotate-[-1.5deg] shadow-[4px_4px_0px_0px_#000000] mt-3">
            Via Branded QR Codes
          </span>
        </h1>
        
        <p className="text-sm sm:text-lg lg:text-xl font-bold text-slate-800 max-w-2xl mx-auto leading-relaxed pt-2">
          Let members join, select subscriptions, and submit UPI payment verification screenshots directly from their phone. Standardize billing operations with flat analytics dashboards.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
          <Link 
            href="/signup" 
            className="w-full sm:w-auto neo-btn neo-btn-orange text-sm font-black py-4 px-8 flex gap-2 items-center justify-center shadow-[4px_4px_0px_0px_#000000]"
          >
            <span>Launch Your Gym</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto neo-btn neo-btn-cyan text-sm font-bold py-4 px-8 shadow-[4px_4px_0px_0px_#000000]"
          >
            Explore Demo Owner
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 border-t-3 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">
              Bold Features for Hardcore Gym Owners
            </h2>
            <p className="text-slate-650 font-bold max-w-xl mx-auto text-xs sm:text-sm">
              Say goodbye to sheets and manuals. Track billing and active subscriptions on autopilot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="neo-card p-8 flex flex-col items-start gap-4">
              <div className="w-12 h-12 bg-brutal-cyan border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-lg flex items-center justify-center text-black">
                <QrCode className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold uppercase tracking-tight">Onboarding Subdomains</h3>
              <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
                Get a custom subdomain for your gym (e.g. <span className="font-bold">power.mygymsaas.com</span>). Members scan the printed QR at the counter to join instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="neo-card p-8 flex flex-col items-start gap-4">
              <div className="w-12 h-12 bg-brutal-purple border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-lg flex items-center justify-center text-black">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold uppercase tracking-tight">UPI Billing Desk</h3>
              <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
                Members select plans, pay to your UPI ID, and upload UTR screenshots. Review submissions on your clean payment confirmation dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="neo-card p-8 flex flex-col items-start gap-4">
              <div className="w-12 h-12 bg-brutal-yellow border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-lg flex items-center justify-center text-black">
                <TrendingUp className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold uppercase tracking-tight">Minimal Analytics</h3>
              <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
                No complex calculations. View total registrations, active members, revenue totals, and clean month-on-month trend charts.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 border-t-3 border-black bg-brutal-bg px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center uppercase mb-16">
          The Brutalist Pipeline
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="neo-card bg-white p-6 relative">
            <div className="absolute -top-5 -left-3 w-10 h-10 bg-brutal-orange text-white border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-lg flex items-center justify-center font-extrabold text-sm">
              01
            </div>
            <h4 className="text-lg font-black uppercase mt-2 mb-2">Configure Gym</h4>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              Create your profile, configure membership plans (Monthly, Yearly), and upload your merchant UPI ID and QR code.
            </p>
          </div>

          {/* Step 2 */}
          <div className="neo-card bg-white p-6 relative">
            <div className="absolute -top-5 -left-3 w-10 h-10 bg-brutal-cyan text-black border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-lg flex items-center justify-center font-extrabold text-sm">
              02
            </div>
            <h4 className="text-lg font-black uppercase mt-2 mb-2">Member Scans QR</h4>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              Members scan the printed counter QR code, select their plan, make direct UPI payments, and upload proof details.
            </p>
          </div>

          {/* Step 3 */}
          <div className="neo-card bg-white p-6 relative">
            <div className="absolute -top-5 -left-3 w-10 h-10 bg-brutal-purple text-black border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-lg flex items-center justify-center font-extrabold text-sm">
              03
            </div>
            <h4 className="text-lg font-black uppercase mt-2 mb-2">Confirm & Extend</h4>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              You verify the UTR and screenshot inside your dashboard and click Approve. The system automatically computes and activates their membership.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-3 border-black bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-xs sm:text-sm text-black">
          <Logo iconOnly={true} className="opacity-80" />
          <p>© {new Date().getFullYear()} FlexFlow GymSaaS. Minimal, Bold, Automated.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:underline">Demo Log In</Link>
            <Link href="/admin" className="hover:underline">Platform Admin</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
