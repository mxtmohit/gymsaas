'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { db } from '@/lib/database';
import { Gym, Plan, Member, Payment, Membership } from '@/lib/mockDb';
import { 
  Building, 
  MapPin, 
  Phone, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Smartphone, 
  Upload, 
  ArrowRight,
  Sparkles,
  Lock,
  AlertOctagon
} from 'lucide-react';

export default function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  // Core Data
  const [gym, setGym] = useState<Gym | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Stepper state
  const [step, setStep] = useState(1); // 1: Info, 2: Plan, 3: Payment

  // Member Form state
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  
  // Payment Form state
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch Gym Details on load
  useEffect(() => {
    async function loadGym() {
      try {
        const gymData = await db.getGymBySlug(slug);
        if (!gymData) {
          setNotFound(true);
          return;
        }
        setGym(gymData);
        
        const plansList = await db.getPlansByGym(gymData.id);
        setPlans(plansList.filter(p => p.is_active));
      } catch (err) {
        console.error('Failed to load gym info', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadGym();
  }, [slug]);

  // Selected Plan Object
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // File Upload Helper (Screenshot -> Base64)
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Join Flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym || !selectedPlan || !memberName || !memberPhone) return;
    if (paymentMethod === 'upi' && !utr && !screenshotUrl) {
      setSubmitError('Please enter the UTR transaction ID or upload a payment screenshot.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const memberId = 'member-' + Math.random().toString(36).substr(2, 9);
      
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + selectedPlan.duration_days);

      const newMember: Member = {
        id: memberId,
        gym_id: gym.id,
        name: memberName,
        phone: memberPhone,
        joined_at: now.toISOString(),
        expires_at: expiryDate.toISOString(),
        status: 'pending'
      };

      const newMembership: Membership = {
        id: 'ms-' + Math.random().toString(36).substr(2, 9),
        member_id: memberId,
        plan_id: selectedPlan.id,
        start_date: now.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'pending'
      };

      const newPayment: Payment = {
        id: 'pay-' + Math.random().toString(36).substr(2, 9),
        member_id: memberId,
        amount: selectedPlan.price,
        utr: paymentMethod === 'upi' ? utr : `CASH-${Date.now()}`,
        screenshot_url: paymentMethod === 'upi' ? screenshotUrl : null,
        status: 'pending',
        created_at: now.toISOString()
      };

      await db.saveMember(newMember);
      await db.saveMembership(newMembership);
      await db.submitPayment(newPayment);

      router.push(`/status/${memberId}`);
    } catch (err) {
      setSubmitError('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill helper
  const handleQuickFill = () => {
    setMemberName('Aryan Verma');
    setMemberPhone('+91 99999 88888');
    if (plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
    setStep(3);
    setUtr('UTR9876543210');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Building className="w-8 h-8 text-black animate-bounce" />
          <p className="text-black font-extrabold text-sm uppercase">Opening Checkout...</p>
        </div>
      </div>
    );
  }

  if (notFound || !gym) {
    return (
      <div className="min-h-screen bg-brutal-bg flex flex-col justify-center items-center px-4 text-center">
        <AlertOctagon className="w-16 h-16 text-brutal-red mb-4" />
        <h2 className="text-3xl font-extrabold text-black uppercase mb-2">Gym Not Found</h2>
        <p className="text-slate-800 font-bold max-w-md mb-8">
          The onboarding link you followed is invalid or the gym slug has changed.
        </p>
        <Link href="/" className="neo-btn neo-btn-cyan font-bold py-2.5 px-6 shadow-[3px_3px_0px_0px_#000000]">
          Return to FlexFlow
        </Link>
      </div>
    );
  }

  if (gym && (gym as any).is_suspended) {
    return (
      <div className="min-h-screen bg-brutal-bg flex flex-col justify-center items-center px-4 text-center">
        <Lock className="w-16 h-16 text-brutal-red mb-4 animate-bounce" />
        <h2 className="text-3xl font-extrabold text-black uppercase mb-2">Gym Suspended</h2>
        <p className="text-slate-800 font-bold max-w-md mb-8">
          The membership registration portal for <strong>{gym.name}</strong> is currently suspended by the platform administrator.
        </p>
        <Link href="/" className="neo-btn neo-btn-cyan font-bold py-2.5 px-6 shadow-[3px_3px_0px_0px_#000000]">
          Return to FlexFlow
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-brutal-bg text-black px-4 py-8 sm:py-12">
      
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Gym Banner Card (Brutalist style) */}
        <div className="neo-card p-6 sm:p-8 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000] flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          {/* Solid accent banner */}
          <div className="absolute top-0 inset-x-0 h-2 bg-brutal-cyan border-b-2 border-black"></div>

          {gym.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={gym.logo_url} 
              alt={gym.name} 
              className="w-16 h-16 sm:w-20 sm:h-20 border-3 border-black rounded-xl object-cover bg-white"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-brutal-cyan border-3 border-black flex items-center justify-center text-black font-black text-2xl">
              {gym.name.charAt(0)}
            </div>
          )}

          <div className="text-center sm:text-left flex-1 space-y-2 pt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-black tracking-tight">{gym.name}</h1>
            <p className="text-slate-800 font-bold text-xs sm:text-sm">{gym.description}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-slate-700 text-xs font-bold font-mono">
              {gym.phone && (
                <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 stroke-[2.5]" /><span>{gym.phone}</span></div>
              )}
              {gym.operating_hours && (
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 stroke-[2.5]" /><span>{gym.operating_hours}</span></div>
              )}
              {gym.address && (
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 stroke-[2.5]" /><span>{gym.address}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Demo Fill */}
        <button
          type="button"
          onClick={handleQuickFill}
          className="w-full py-2.5 px-4 bg-brutal-purple/35 border-3 border-black hover:bg-brutal-purple/50 text-black rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-[3px_3px_0px_0px_#000000] font-black uppercase text-xs hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Frictionless Test: Quick Fill Forms & Skip to Payment</span>
        </button>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center justify-between px-2">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Pick Plan' },
            { num: 3, label: 'Pay & Verify' }
          ].map((s) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center font-black text-xs shadow-[1.5px_1.5px_0px_0px_#000000] ${
                  step === s.num 
                    ? 'bg-brutal-yellow text-black' 
                    : step > s.num 
                    ? 'bg-brutal-green text-black'
                    : 'bg-white text-slate-400'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-xs font-black uppercase tracking-tight hidden sm:inline ${
                  step === s.num ? 'text-black underline decoration-2 decoration-brutal-orange' : 'text-slate-650'
                }`}>{s.label}</span>
              </div>
              {s.num < 3 && (
                <div className={`flex-1 h-1 max-w-[60px] sm:max-w-none mx-2 border-y border-black ${
                  step > s.num ? 'bg-brutal-green' : 'bg-white'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Stepper Content Card */}
        <div className="neo-card p-6 sm:p-8 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000]">
          
          {/* STEP 1: CONTACT DETAILS */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase text-black mb-4 border-b-3 border-black pb-2">Your Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                      <User className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      className="neo-input block w-full !pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">WhatsApp / Contact Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                      <Smartphone className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      className="neo-input block w-full !pl-11"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-700 font-bold">Used to verify and notify you of renewals.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t-2 border-black mt-6">
                <button
                  type="button"
                  disabled={!memberName || !memberPhone}
                  onClick={() => setStep(2)}
                  className="neo-btn neo-btn-orange text-white px-6 py-2.5 font-bold shadow-[3px_3px_0px_0px_#000000] disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Pick Plan</span>
                  <ChevronRight className="w-4 h-4 ml-1 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT PLAN */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase text-black mb-4 border-b-3 border-black pb-2">Select Membership Plan</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {plans.length === 0 ? (
                  <p className="text-slate-500 font-bold text-sm text-center py-6">This gym has not defined any active membership plans yet.</p>
                ) : (
                  plans.map((p) => (
                    <label 
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`neo-card p-5 flex items-center justify-between border-3 cursor-pointer transition ${
                        selectedPlanId === p.id 
                          ? 'border-black bg-brutal-cyan/25 shadow-[4px_4px_0px_0px_#000000] translate-y-[-1px]' 
                          : 'border-black/35 shadow-none'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlanId === p.id}
                          onChange={() => setSelectedPlanId(p.id)}
                          className="w-4 h-4 text-black focus:ring-0 focus:ring-offset-0 bg-transparent border-3 border-black"
                        />
                        <div>
                          <span className="block font-black uppercase text-black text-base leading-none">{p.name}</span>
                          <span className="block text-slate-700 text-xs mt-1 font-semibold">{p.description}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-xl font-black text-black">₹{p.price.toLocaleString('en-IN')}</span>
                        <span className="block text-[10px] text-slate-800 font-mono font-bold mt-0.5">{p.duration_days} days validity</span>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="flex justify-between pt-6 border-t-3 border-black mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-black font-extrabold uppercase hover:underline transition cursor-pointer text-sm"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" />
                  <span>Go Back</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedPlanId}
                  onClick={() => setStep(3)}
                  className="neo-btn neo-btn-orange text-white px-6 py-2.5 font-bold shadow-[3px_3px_0px_0px_#000000] disabled:opacity-40"
                >
                  <span>Pay & Submit</span>
                  <ChevronRight className="w-4 h-4 ml-1 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAY & SUBMIT */}
          {step === 3 && selectedPlan && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-black uppercase text-black mb-2 border-b-3 border-black pb-2">Complete Membership Payment</h2>
              
              {/* Payment Method Tabs Selector */}
              <div className="grid grid-cols-2 gap-3.5 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-3 px-4 border-3 border-black text-xs font-black uppercase transition-all shadow-[2.5px_2.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] cursor-pointer ${
                    paymentMethod === 'upi' ? 'bg-brutal-cyan text-black' : 'bg-white text-slate-500 hover:bg-slate-550'
                  }`}
                >
                  📱 Pay via UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 px-4 border-3 border-black text-xs font-black uppercase transition-all shadow-[2.5px_2.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] cursor-pointer ${
                    paymentMethod === 'cash' ? 'bg-brutal-yellow text-black' : 'bg-white text-slate-500 hover:bg-slate-555'
                  }`}
                >
                  💵 Pay in Cash
                </button>
              </div>

              {/* Motivational Checkout Copy */}
              <div className="bg-brutal-cyan/20 border-3 border-black rounded-xl p-4 text-xs font-bold leading-normal text-black flex items-start gap-2.5 shadow-[2px_2px_0px_0px_#000000]">
                <span className="text-xl">🔥</span>
                <div>
                  <span className="font-extrabold uppercase text-sm block">You're making the right move!</span> 
                  <p className="mt-0.5 text-slate-800 text-[11px]">
                    {paymentMethod === 'upi' 
                      ? 'Complete the transaction below to unlock your access pass and start crushing your goals.'
                      : 'Please hand over the exact cash amount directly to the gym owner or counter receptionist.'}
                  </p>
                </div>
              </div>
              
              {submitError && (
                <div className="bg-red-100 border-3 border-black text-black font-semibold text-xs sm:text-sm rounded-xl p-3.5 shadow-[2px_2px_0px_0px_#000000]">
                  <span>{submitError}</span>
                </div>
              )}

              {paymentMethod === 'upi' ? (
                <>
                  {/* UPI QR Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brutal-bg/40 p-6 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_#000000]">
                    
                    {/* QR Code Wrapper */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-slate-800 text-[10px] font-black uppercase mb-3">Scan UPI QR Code</span>
                      
                      <div className="p-3 bg-white rounded border-3 border-black shadow-[2px_2px_0px_0px_#000000]">
                        {gym.upi_qr_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={gym.upi_qr_url} 
                            alt="Merchant UPI QR" 
                            className="w-36 h-36 object-contain bg-white"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${gym.upi_id}&pn=${gym.name}&am=${selectedPlan.price}&cu=INR`)}`} 
                            alt="UPI Payment QR" 
                            className="w-36 h-36 object-contain bg-white"
                          />
                        )}
                      </div>
                      
                      <span className="text-[9px] font-bold text-slate-700 mt-2 uppercase">Google Pay, PhonePe, Paytm</span>
                    </div>

                    {/* Billing details */}
                    <div className="flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-slate-800 text-[10px] font-black uppercase tracking-wider">Payment Instructions</span>
                        <div className="text-slate-800 text-xs sm:text-sm font-bold leading-normal">
                          1. Open your UPI scanner app. <br />
                          2. Scan the code to settle price directly, or enter merchant address manually:
                        </div>
                        
                        <div className="bg-white p-3 border-3 border-black rounded-lg mt-2 text-center shadow-[2px_2px_0px_0px_#000000]">
                          <div className="text-[9px] text-slate-750 font-black uppercase">UPI Address</div>
                          <div className="text-brutal-orange font-mono font-black text-xs sm:text-sm select-all mt-1">{gym.upi_id || 'merchant@upi'}</div>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-black flex justify-between items-baseline mt-4">
                        <span className="text-slate-700 text-xs font-black uppercase"> Payable</span>
                        <span className="text-2xl font-black text-black">₹{selectedPlan.price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                  </div>

                  {/* UTR Input / Screenshot upload */}
                  <div className="space-y-4 pt-2">
                    
                    {/* UTR */}
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">Enter UPI UTR / Transaction Ref ID</label>
                      <input
                        type="text"
                        required={!screenshotUrl}
                        placeholder="12-digit numeric reference"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        className="neo-input block w-full font-mono text-brutal-orange"
                      />
                    </div>

                    {/* Screenshot */}
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">OR Upload Payment Screenshot</label>
                      <div className="relative group border-3 border-dashed border-black hover:bg-slate-50 rounded-xl p-5 flex flex-col items-center justify-center transition cursor-pointer bg-white shadow-[2px_2px_0px_0px_#000000]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-black stroke-[2.5] mb-2 group-hover:translate-y-[-1px] transition-transform" />
                        <span className="text-xs text-black font-black uppercase tracking-tight">
                          {screenshotUrl ? 'Receipt slip attached' : 'Click to Upload Transaction screenshot'}
                        </span>
                      </div>

                      {screenshotUrl && (
                        <div className="mt-3 flex items-center justify-center gap-3 bg-white p-2.5 border-3 border-black rounded-lg max-w-xs mx-auto shadow-[2px_2px_0px_0px_#000000]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={screenshotUrl} alt="Receipt Preview" className="w-12 h-16 object-cover rounded border-2 border-black bg-white" />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs text-black font-bold truncate">screenshot.png</span>
                            <button 
                              type="button" 
                              onClick={() => setScreenshotUrl(null)}
                              className="text-[10px] text-red-500 font-bold underline cursor-pointer"
                            >
                              Remove slip
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </>
              ) : (
                <div className="p-6 bg-brutal-bg/40 border-3 border-black rounded-xl space-y-4 shadow-[3px_3px_0px_0px_#000000]">
                  <h3 className="text-sm font-black uppercase text-black">Cash Payment Details</h3>
                  <div className="text-slate-800 text-xs sm:text-sm font-bold leading-relaxed space-y-2">
                    <p>1. Go to the Gym front counter desk.</p>
                    <p>2. Tell the trainer/owner your registered Name: <span className="font-extrabold text-black">"{memberName}"</span> and Phone.</p>
                    <p>3. Hand over the exact subscription fees in cash: </p>
                  </div>
                  
                  <div className="bg-white p-4 border-3 border-black rounded-xl text-center shadow-[3px_3px_0px_0px_#000000]">
                    <div className="text-[10px] text-slate-500 font-black uppercase">Amount to Pay in Cash</div>
                    <div className="text-brutal-orange font-black text-2xl mt-1">₹{selectedPlan.price.toLocaleString('en-IN')}</div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase mt-1">For Plan: {selectedPlan.name}</div>
                  </div>

                  <p className="text-[10px] text-slate-650 font-bold text-center leading-normal">
                    Click "Register & Join" below. Your subscription status will remain **Pending** until the owner receives cash and verifies it.
                  </p>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-between items-center pt-6 border-t-3 border-black mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-black font-extrabold uppercase hover:underline transition cursor-pointer text-sm"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" />
                  <span>Go Back</span>
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="neo-btn neo-btn-orange text-white py-3.5 px-8 font-black uppercase shadow-[3px_3px_0px_0px_#000000] disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Register & Join'}
                  <ArrowRight className="w-4 h-4 ml-2 text-white stroke-[3]" />
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Footer */}
        <div className="text-center text-slate-700 font-bold text-xs uppercase">
          Powered by FlexFlow SaaS. Directly Settled Peer-to-Peer.
        </div>

      </div>
    </div>
  );
}
