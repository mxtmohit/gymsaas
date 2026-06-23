"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/database";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function MemberStatusPage({ params }) {
  const { memberId } = use(params);
  const router = useRouter();

  // Load States
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [gym, setGym] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  // Renewal State
  const [showRenewal, setShowRenewal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [utr, setUtr] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [submittingRenewal, setSubmittingRenewal] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [renewalSuccess, setRenewalSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const memberData = await db.getMemberById(memberId);
        if (!memberData) {
          setLoading(false);
          return;
        }
        setMember(memberData);

        const gyms = await db.getGymsList();
        const gymData = gyms.find((g) => g.id === memberData.gym_id);
        if (gymData) setGym(gymData);

        const plansList = await db.getPlansByGym(memberData.gym_id);
        setPlans(plansList.filter((p) => p.is_active));

        const msList = await db.getMembershipsByMember(memberId);
        setMemberships(msList);
      } catch (err) {
        console.error("Error loading member status details", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [memberId]);

  // Live polling for payment/status updates
  useEffect(() => {
    if (!memberId) return;

    const checkStatus = async () => {
      try {
        const memberData = await db.getMemberById(memberId);
        if (memberData) {
          setMember((prev) => {
            if (
              prev &&
              prev.status !== memberData.status &&
              memberData.status === "active"
            ) {
              // Trigger success confetti when approved!
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.7 },
              });
            }
            return memberData;
          });
          // Also fetch memberships to sync plan expiration
          const msList = await db.getMembershipsByMember(memberId);
          setMemberships(msList);
        }
      } catch (err) {
        console.error("Error polling status:", err);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(checkStatus, 2000);

    // Listen to localStorage changes in other tabs
    const handleStorage = (e) => {
      if (
        e.key === "members" ||
        e.key === "payments" ||
        e.key === "memberships"
      ) {
        checkStatus();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [memberId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const memberData = await db.getMemberById(memberId);
      if (memberData) {
        setMember(memberData);
        const msList = await db.getMembershipsByMember(memberId);
        setMemberships(msList);
        if (memberData.status === "active") {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleSimulateApproval = async () => {
    if (!member) return;
    try {
      const gymPayments = await db.getPaymentsByGym(member.gym_id);
      const pendingPayment = gymPayments.find(
        (p) => p.member_id === member.id && p.status === "pending",
      );
      if (pendingPayment) {
        await db.updatePaymentStatus(pendingPayment.id, "approved");
        await handleRefresh();
      } else {
        const updated = {
          ...member,
          status: "active",
          expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        };
        await db.saveMember(updated);
        await handleRefresh();
      }
    } catch (err) {
      alert("Simulation failed.");
    }
  };

  const expiryInfo = useMemo(() => {
    if (!member || !member.expires_at)
      return {
        daysLeft: 0,
        text: "Expired",
        color: "text-rose-600 bg-red-100 border-red-400",
      };

    const diffMs = new Date(member.expires_at).getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return {
        daysLeft,
        text: "Expired",
        color: "text-red-650 bg-red-100 border-red-300",
      };
    } else if (daysLeft === 0) {
      return {
        daysLeft,
        text: "Expires Today",
        color: "text-amber-700 bg-amber-100 border-amber-300",
      };
    } else if (daysLeft === 1) {
      return {
        daysLeft,
        text: "Expires Tomorrow",
        color: "text-amber-700 bg-amber-100 border-amber-300",
      };
    } else {
      return {
        daysLeft,
        text: `${daysLeft} Days Remaining`,
        color: "text-emerald-700 bg-green-100 border-green-300",
      };
    }
  }, [member]);

  const motivationalQuote = useMemo(() => {
    if (!member) return "";
    const activeQuotes = [
      "💪 'The only bad workout is the one that didn't happen. Push hard today!'",
      "🔥 'No excuses. No limits. Just results. You're locked in and ready!'",
      "⚡ 'Your future self will thank you for the sweat you put in today!'",
      "🏋️ 'Success isn't always about greatness. It's about consistency. Keep it up!'",
    ];
    const pendingQuotes = [
      "⏳ 'While we verify the payment, pre-load your playlist and prepare to sweat!'",
      "🔋 'Iron is waiting. Get your gym shoes ready; it's almost lifting time!'",
      "🌟 'Consistency starts with registration. You're one step away from crushing goals!'",
    ];
    const expiredQuotes = [
      "⚠️ 'Gains are temporary if you stop now. Power up and renew today!'",
      "💔 'Don't let yesterday's sweat go to waste. Reactivate your pass now!'",
      "🔋 'Your muscles are calling. Refuel your pass to keep lifting heavy!'",
    ];

    const sumCodes = memberId
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    if (member.status === "active") {
      return activeQuotes[sumCodes % activeQuotes.length];
    } else if (member.status === "pending") {
      return pendingQuotes[sumCodes % pendingQuotes.length];
    } else {
      return expiredQuotes[sumCodes % expiredQuotes.length];
    }
  }, [memberId, member]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleScreenshotUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    if (!member || !gym || !selectedPlan) return;
    if (paymentMethod === "upi" && !utr && !screenshotUrl) {
      setSubmitError(
        "Please provide the transaction reference ID or screenshot.",
      );
      return;
    }

    setSubmittingRenewal(true);
    setSubmitError("");

    try {
      const start = new Date();
      const expiry = new Date();
      expiry.setDate(start.getDate() + selectedPlan.duration_days);

      const newMs = {
        id: "ms-renew-" + Math.random().toString(36).substr(2, 9),
        member_id: member.id,
        plan_id: selectedPlan.id,
        start_date: start.toISOString().split("T")[0],
        expiry_date: expiry.toISOString().split("T")[0],
        status: "pending",
      };

      const newPayment = {
        id: "pay-renew-" + Math.random().toString(36).substr(2, 9),
        member_id: member.id,
        amount: selectedPlan.price,
        utr: paymentMethod === "upi" ? utr : `CASH-${Date.now()}`,
        screenshot_url: paymentMethod === "upi" ? screenshotUrl : null,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      await db.saveMembership(newMs);
      await db.submitPayment(newPayment);

      if (member.status === "expired") {
        const updatedMember = {
          ...member,
          status: "pending",
        };
        await db.saveMember(updatedMember);
      }

      setRenewalSuccess(true);
      setShowRenewal(false);
      setSelectedPlanId("");
      setUtr("");
      setScreenshotUrl(null);
      await handleRefresh();
    } catch (err) {
      setSubmitError("Renewal submission failed. Please try again.");
    } finally {
      setSubmittingRenewal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Zap className="w-8 h-8 text-black animate-bounce" />
          <p className="text-black font-extrabold text-sm uppercase">
            Loading Member Profile...
          </p>
        </div>
      </div>
    );
  }

  if (!member || !gym) {
    return (
      <div className="min-h-screen bg-brutal-bg flex flex-col justify-center items-center px-4 text-center">
        <XCircle className="w-16 h-16 text-brutal-red mb-4" />
        <h2 className="text-3xl font-extrabold text-black uppercase mb-2">
          Member Not Found
        </h2>
        <p className="text-slate-800 font-bold max-w-md mb-8">
          The member reference ID is invalid or was removed by the gym owner.
        </p>
        <Link
          href="/"
          className="neo-btn neo-btn-cyan font-bold py-2.5 px-6 shadow-[3px_3px_0px_0px_#000000]"
        >
          Go to FlexFlow Home
        </Link>
      </div>
    );
  }

  const activeMembership = memberships.find((ms) => ms.status === "active");
  const activePlanName = activeMembership
    ? plans.find((p) => p.id === activeMembership.plan_id)?.name ||
      "Standard Plan"
    : "No Active Plan";

  return (
    <div className="relative min-h-screen bg-brutal-bg text-black px-4 py-8 sm:py-12">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Gym Header */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            {gym.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gym.logo_url}
                alt="Logo"
                className="w-8 h-8 border-2 border-black rounded object-cover bg-white"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-brutal-cyan border-2 border-black flex items-center justify-center text-black font-black text-xs">
                {gym.name.charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-lg uppercase text-black">
              {gym.name}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white border-3 border-black hover:bg-slate-50 rounded-lg text-black transition cursor-pointer shadow-[2px_2px_0px_0px_#000000]"
            title="Refresh Status"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""} stroke-[2.5]`}
            />
          </button>
        </div>

        {/* STATUS CARD (Brutalist Ticket pass layout) */}
        <div className="neo-card p-8 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000] text-center space-y-6 relative overflow-hidden">
          {/* Accent top banner */}
          <div className="absolute top-0 inset-x-0 h-2 bg-brutal-yellow border-b-2 border-black"></div>

          {/* Status Badge */}
          {member.status === "active" && (
            <div className="mx-auto w-16 h-16 bg-brutal-green border-3 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <CheckCircle className="w-8 h-8 text-black stroke-[2.5]" />
            </div>
          )}

          {member.status === "pending" && (
            <div className="mx-auto w-16 h-16 bg-brutal-yellow border-3 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000] animate-pulse">
              <Clock className="w-8 h-8 text-black stroke-[2.5]" />
            </div>
          )}

          {member.status === "expired" && (
            <div className="mx-auto w-16 h-16 bg-brutal-red border-3 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <XCircle className="w-8 h-8 text-black stroke-[2.5]" />
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Membership Pass
            </h2>
            <h1 className="text-2xl font-extrabold uppercase text-black">
              {member.name}
            </h1>
            <p className="text-slate-800 text-xs font-mono font-bold">
              {member.phone}
            </p>
          </div>

          {/* Motivational Status Header */}
          <div className="py-2.5 px-4 border-2 border-black rounded-lg bg-black text-white font-extrabold text-xs uppercase tracking-wide shadow-[2px_2px_0px_0px_#fdfe02]">
            {member.status === "active" &&
              "🎉 PASS ACTIVE! You are locked in. Time to crush your fitness goals! 💪"}
            {member.status === "pending" &&
              "⏳ HOLD TIGHT! Verification in progress. Get your gym gear ready to lift heavy! ⚡"}
            {member.status === "expired" &&
              "⚠️ PASS EXPIRED! Don't lose your gains. Power up and renew today! 🔥"}
          </div>

          <div className="border-t-3 border-dashed border-black my-4"></div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-left font-bold">
            <div>
              <span className="block text-[10px] text-slate-550 uppercase font-extrabold">
                Active Subscription
              </span>
              <span className="block text-sm font-black text-black uppercase truncate mt-0.5">
                {activePlanName}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-550 uppercase font-extrabold">
                Valid Until
              </span>
              <span className="block text-sm font-black text-black font-mono mt-0.5">
                {member.expires_at
                  ? new Date(member.expires_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>

          {/* Expiration badge */}
          <div
            className={`p-4 border-3 border-black rounded-xl flex items-center justify-between shadow-[2px_2px_0px_0px_#000000] ${expiryInfo.color}`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-black stroke-[2.5]" />
              <div className="text-left">
                <span className="block text-[9px] text-slate-700 uppercase font-black">
                  Expiration Status
                </span>
                <span className="block text-xs font-black uppercase">
                  {expiryInfo.text}
                </span>
              </div>
            </div>

            <span className="text-[10px] text-black font-black uppercase border-2 border-black px-2 py-0.5 rounded bg-white">
              {member.status === "active"
                ? "Active Member"
                : member.status === "expired"
                  ? "Expired Member"
                  : "Pending Approval"}
            </span>
          </div>

          {/* Encouragement Corner */}
          <div className="p-4 bg-[#f4f2ed] border-3 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] text-left">
            <span className="block text-[10px] text-slate-700 font-black uppercase tracking-wider mb-1">
              Encouragement Corner
            </span>
            <p className="text-xs font-bold text-black italic leading-normal">
              {motivationalQuote}
            </p>
          </div>

          {/* Simualte Approval Override (Brutalist style) */}
          {member.status === "pending" && (
            <div className="bg-brutal-yellow/30 p-4 border-3 border-black rounded-xl space-y-3 shadow-[2px_2px_0px_0px_#000000]">
              <div className="flex items-start gap-3 text-left">
                <Sparkles className="w-5 h-5 text-black stroke-[2.5] flex-shrink-0 animate-bounce mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase">
                    Simulation Desk: Approve Payment
                  </h4>
                  <p className="text-[10px] text-slate-700 font-bold leading-normal mt-0.5">
                    Simulate owner checking your UTR and approving access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSimulateApproval}
                className="w-full py-2 bg-brutal-yellow hover:bg-brutal-yellow/90 border-2 border-black text-black rounded-lg text-xs font-black uppercase transition shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
              >
                Approve Payment Instantly
              </button>
            </div>
          )}

          {/* Expiration warnings */}
          {member.status === "active" && expiryInfo.daysLeft <= 7 && (
            <div
              className={`p-4 rounded-xl border-3 border-black flex items-start gap-3 text-left shadow-[2px_2px_0px_0px_#000000] ${
                expiryInfo.daysLeft <= 3
                  ? "bg-brutal-red/25 text-black"
                  : "bg-brutal-yellow/25 text-black"
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-black stroke-[2.5]" />
              <div>
                <h4 className="text-xs font-black uppercase">
                  {expiryInfo.daysLeft <= 3
                    ? "Membership Expiring Soon!"
                    : "Membership Expiry warning"}
                </h4>
                <p className="text-[10px] sm:text-xs font-bold leading-normal mt-1">
                  Your pass validity expires in {expiryInfo.daysLeft} days.
                  Click below to renew subscription.
                </p>
              </div>
            </div>
          )}

          {member.status === "expired" && (
            <div className="p-4 rounded-xl bg-brutal-red/25 border-3 border-black text-black flex items-start gap-3 text-left shadow-[2px_2px_0px_0px_#000000]">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-black stroke-[2.5]" />
              <div>
                <h4 className="text-xs font-black uppercase">
                  Gym Access Blocked
                </h4>
                <p className="text-[10px] sm:text-xs font-bold leading-normal mt-1">
                  Your membership has expired. Please submit a payment proof
                  below to unlock your pass.
                </p>
              </div>
            </div>
          )}

          {/* CTA */}
          {member.status !== "pending" && !showRenewal && (
            <button
              onClick={() => {
                setShowRenewal(true);
                setRenewalSuccess(false);
              }}
              className="w-full neo-btn neo-btn-orange text-white py-3.5 px-4 font-black uppercase shadow-[3px_3px_0px_0px_#000000]"
            >
              Renew Membership
            </button>
          )}

          {renewalSuccess && (
            <div className="p-4 rounded-xl bg-green-100 border-3 border-black text-black flex items-start gap-3 text-left shadow-[2px_2px_0px_0px_#000000]">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-black stroke-[2.5]" />
              <div>
                <h4 className="text-xs font-black uppercase">
                  Renewal Proof Submitted
                </h4>
                <p className="text-[10px] sm:text-xs font-bold leading-normal mt-1">
                  Payment verification queued. The owner has been notified.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RENEWAL PANEL (Brutalist checkout) */}
        {showRenewal && (
          <div className="neo-card p-6 sm:p-8 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000] space-y-6">
            <div className="flex justify-between items-center border-b-3 border-black pb-2">
              <h3 className="text-lg font-black uppercase text-black">
                Renew Membership
              </h3>
              <button
                onClick={() => setShowRenewal(false)}
                className="text-slate-700 hover:text-black text-xs font-extrabold uppercase hover:underline cursor-pointer"
              >
                [Cancel]
              </button>
            </div>

            <form onSubmit={handleRenewalSubmit} className="space-y-6">
              {submitError && (
                <div className="bg-red-100 border-3 border-black text-black font-semibold text-xs sm:text-sm rounded-xl p-3.5 shadow-[2px_2px_0px_0px_#000000]">
                  <span>{submitError}</span>
                </div>
              )}

              {/* 1. Pick Plan */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-3">
                  Choose Plan Option
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {plans.map((p) => (
                    <label
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`neo-card p-4 flex items-center justify-between border-3 cursor-pointer transition ${
                        selectedPlanId === p.id
                          ? "border-black bg-brutal-cyan/25 shadow-[3px_3px_0px_0px_#000000] translate-y-[-1px]"
                          : "border-black/35 shadow-none"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="renewal-plan"
                          checked={selectedPlanId === p.id}
                          onChange={() => setSelectedPlanId(p.id)}
                          className="w-3.5 h-3.5 text-black focus:ring-0 bg-transparent border-3 border-black"
                        />

                        <span className="font-extrabold uppercase text-black text-sm">
                          {p.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-black">
                          ₹{p.price}
                        </span>
                        <span className="text-[9px] text-slate-750 font-mono font-bold ml-1">
                          /{p.duration_days}d
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. UPI/Cash details */}
              {selectedPlan && (
                <div className="space-y-6 pt-4 border-t-3 border-black">
                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-3.5 mb-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`py-2 px-3 border-2 border-black text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] cursor-pointer ${
                        paymentMethod === "upi"
                          ? "bg-brutal-cyan text-black"
                          : "bg-white text-slate-500 hover:bg-slate-550"
                      }`}
                    >
                      📱 Pay via UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`py-2 px-3 border-2 border-black text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] cursor-pointer ${
                        paymentMethod === "cash"
                          ? "bg-brutal-yellow text-black"
                          : "bg-white text-slate-500 hover:bg-slate-555"
                      }`}
                    >
                      💵 Pay in Cash
                    </button>
                  </div>

                  {paymentMethod === "upi" ? (
                    <>
                      <div className="bg-brutal-bg/40 p-5 rounded-xl border-3 border-black grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-[2px_2px_0px_0px_#000000]">
                        {/* QR Code */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="p-2 bg-white rounded border-3 border-black shadow-[2px_2px_0px_0px_#000000]">
                            {gym.upi_qr_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={gym.upi_qr_url}
                                alt="UPI QR"
                                className="w-28 h-28 object-contain bg-white"
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${gym.upi_id}&pn=${gym.name}&am=${selectedPlan.price}&cu=INR`)}`}
                                alt="UPI QR"
                                className="w-28 h-28 object-contain bg-white"
                              />
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1 uppercase">
                            GPay / PhonePe Scanner
                          </span>
                        </div>

                        {/* Pay summary */}
                        <div className="flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-650 font-black uppercase">
                              UPI Address
                            </span>
                            <div className="text-brutal-orange font-bold font-mono text-xs select-all">
                              {gym.upi_id || "merchant@upi"}
                            </div>
                          </div>

                          <div className="flex justify-between items-baseline pt-3 border-t-2 border-black mt-3">
                            <span className="text-slate-700 text-xs font-black uppercase">
                              Payable
                            </span>
                            <span className="text-lg font-black text-black">
                              ₹{selectedPlan.price}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Proof */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                            Enter UPI Transaction UTR
                          </label>
                          <input
                            type="text"
                            required={!screenshotUrl}
                            placeholder="12-digit transaction ID"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            className="neo-input block w-full font-mono text-brutal-orange"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                            OR Upload Payment Screenshot
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotUpload}
                            className="block w-full text-xs text-slate-750 file:mr-4 file:py-2 file:px-4 file:rounded file:border-3 file:border-black file:text-xs file:font-black file:bg-white file:text-black file:cursor-pointer hover:file:bg-slate-100 transition"
                          />

                          {screenshotUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={screenshotUrl}
                              alt="Receipt preview"
                              className="w-16 h-20 object-cover rounded mt-3 border-2 border-black bg-white"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-5 bg-brutal-bg/40 border-3 border-black rounded-xl space-y-4 shadow-[2px_2px_0px_0px_#000000]">
                      <h4 className="text-xs font-black uppercase text-black">
                        Cash Handover Instructions
                      </h4>
                      <div className="text-slate-850 text-xs font-bold leading-relaxed space-y-1">
                        <p>
                          1. Hand over the cash payment amount directly to the
                          gym owner/trainer:
                        </p>
                      </div>

                      <div className="bg-white p-3 border-3 border-black rounded-xl text-center shadow-[2px_2px_0px_0px_#000000]">
                        <div className="text-[9px] text-slate-500 font-black uppercase">
                          Amount to pay in cash
                        </div>
                        <div className="text-brutal-orange font-black text-xl mt-1">
                          ₹{selectedPlan.price.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[9px] text-slate-650 font-bold uppercase mt-1">
                          Plan: {selectedPlan.name}
                        </div>
                      </div>

                      <p className="text-[9px] text-slate-650 font-bold text-center leading-normal">
                        After paying at the counter, click the button below to
                        submit. The owner will confirm and reactivate your pass
                        immediately.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingRenewal}
                    className="w-full neo-btn neo-btn-orange text-white py-3.5 px-4 font-black uppercase shadow-[3px_3px_0px_0px_#000000]"
                  >
                    {submittingRenewal
                      ? "Submitting proof..."
                      : paymentMethod === "upi"
                        ? "Submit Renewal Proof"
                        : "Request Cash Verification"}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
