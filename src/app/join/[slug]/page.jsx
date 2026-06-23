"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/database";
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
  AlertOctagon,
} from "lucide-react";

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  let videoId = "";
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
  } catch (e) {
    console.error("Error parsing YouTube URL", e);
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export default function JoinPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();

  // Core Data
  const [gym, setGym] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Stepper state
  const [step, setStep] = useState(1); // 1: Info, 2: Plan, 3: Payment
  const [viewMode, setViewMode] = useState("landing"); // landing, form

  // Member Form state
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  // Payment Form state
  const [utr, setUtr] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
        setPlans(plansList.filter((p) => p.is_active));
      } catch (err) {
        console.error("Failed to load gym info", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadGym();
  }, [slug]);

  // Selected Plan Object
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // File Upload Helper (Screenshot -> Base64)
  const handleScreenshotUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Join Flow
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gym || !selectedPlan || !memberName || !memberPhone) return;
    if (paymentMethod === "upi" && !utr && !screenshotUrl) {
      setSubmitError(
        "Please enter the UTR transaction ID or upload a payment screenshot.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const memberId = "member-" + Math.random().toString(36).substr(2, 9);
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + selectedPlan.duration_days);

      const newMember = {
        id: memberId,
        gym_id: gym.id,
        name: memberName,
        phone: memberPhone,
        joined_at: now.toISOString(),
        expires_at: expiryDate.toISOString(),
        status: "pending",
      };

      const newMembership = {
        id: "ms-" + Math.random().toString(36).substr(2, 9),
        member_id: memberId,
        plan_id: selectedPlan.id,
        start_date: now.toISOString().split("T")[0],
        expiry_date: expiryDate.toISOString().split("T")[0],
        status: "pending",
      };

      const newPayment = {
        id: "pay-" + Math.random().toString(36).substr(2, 9),
        member_id: memberId,
        amount: selectedPlan.price,
        utr: paymentMethod === "upi" ? utr : `CASH-${Date.now()}`,
        screenshot_url: paymentMethod === "upi" ? screenshotUrl : null,
        status: "pending",
        created_at: now.toISOString(),
      };

      await db.saveMember(newMember);
      await db.saveMembership(newMembership);
      await db.submitPayment(newPayment);

      router.push(`/status/${memberId}`);
    } catch (err) {
      setSubmitError("Failed to submit registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill helper
  const handleQuickFill = () => {
    setMemberName("Aryan Verma");
    setMemberPhone("+91 99999 88888");
    if (plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
    setStep(3);
    setUtr("UTR9876543210");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Building className="w-8 h-8 text-black animate-bounce" />
          <p className="text-black font-extrabold text-sm uppercase">
            Opening Checkout...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !gym) {
    return (
      <div className="min-h-screen bg-brutal-bg flex flex-col justify-center items-center px-4 text-center">
        <AlertOctagon className="w-16 h-16 text-brutal-red mb-4" />
        <h2 className="text-3xl font-extrabold text-black uppercase mb-2">
          Gym Not Found
        </h2>
        <p className="text-slate-800 font-bold max-w-md mb-8">
          The onboarding link you followed is invalid or the gym slug has
          changed.
        </p>
        <Link
          href="/"
          className="neo-btn neo-btn-cyan font-bold py-2.5 px-6 shadow-[3px_3px_0px_0px_#000000]"
        >
          Return to FlexFlow
        </Link>
      </div>
    );
  }

  if (gym && gym.is_suspended) {
    return (
      <div className="min-h-screen bg-brutal-bg flex flex-col justify-center items-center px-4 text-center">
        <Lock className="w-16 h-16 text-brutal-red mb-4 animate-bounce" />
        <h2 className="text-3xl font-extrabold text-black uppercase mb-2">
          Gym Suspended
        </h2>
        <p className="text-slate-800 font-bold max-w-md mb-8">
          The membership registration portal for <strong>{gym.name}</strong> is
          currently suspended by the platform administrator.
        </p>
        <Link
          href="/"
          className="neo-btn neo-btn-cyan font-bold py-2.5 px-6 shadow-[3px_3px_0px_0px_#000000]"
        >
          Return to FlexFlow
        </Link>
      </div>
    );
  }

  const embedVideoUrl = gym ? getYouTubeEmbedUrl(gym.youtube_url) : null;

  if (viewMode === "landing") {
    return (
      <div className="relative min-h-screen bg-[#f4f2ed] text-black font-sans pb-16 selection:bg-brutal-yellow">
        {/* Navigation / Header */}
        <header className="sticky top-0 z-50 bg-white border-b-4 border-black px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {gym.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gym.logo_url}
                  alt={gym.name}
                  className="w-12 h-12 border-3 border-black rounded-xl object-cover bg-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-brutal-cyan border-3 border-black flex items-center justify-center text-black font-black text-xl shadow-[2px_2px_0px_0px_#000000]">
                  {gym.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase text-black leading-none tracking-tight">
                  {gym.name}
                </h1>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 block mt-0.5">
                  ONBOARDING HUB
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewMode("form")}
              className="neo-btn neo-btn-orange text-xs sm:text-sm font-black py-2.5 px-6 shadow-[3px_3px_0px_0px_#000000] uppercase tracking-wider"
            >
              Join Now
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Hero Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border-4 border-black p-8 sm:p-12 rounded-3xl shadow-[8px_8px_0px_0px_#000000] relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brutal-purple/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-block bg-brutal-yellow border-2 border-black text-xs uppercase tracking-widest font-black px-3 py-1 rounded-md shadow-[1.5px_1.5px_0px_0px_#000000]">
                Welcome To Our Gym
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[1.05]">
                CRUSH YOUR <br />
                <span className="bg-brutal-cyan border-b-4 border-black px-1">FITNESS GOALS</span> <br />
                WITH US!
              </h2>
              <p className="text-slate-800 font-bold text-sm sm:text-base max-w-xl leading-relaxed">
                {gym.description || "Transform your life with our state-of-the-art facility, custom training programs, and a community dedicated to helping you thrive."}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => setViewMode("form")}
                  className="neo-btn neo-btn-orange font-black py-4 px-8 text-sm sm:text-base shadow-[4px_4px_0px_0px_#000000] uppercase tracking-wider flex items-center gap-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#000000]"
                >
                  <span>Start Onboarding</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="#plans-section"
                  className="neo-btn bg-white hover:bg-slate-50 font-black py-4 px-8 text-sm sm:text-base border-3 border-black text-black rounded-2xl shadow-[4px_4px_0px_0px_#000000] uppercase tracking-wider block text-center"
                >
                  View Packages
                </a>
              </div>
            </div>

            {/* Hero Right Image / Branded Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/3] bg-brutal-purple border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000000] flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brutal-yellow/20 rounded-full blur-2xl"></div>
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-xl font-black">
                    🔥
                  </div>
                  <h3 className="text-2xl font-black text-black uppercase leading-tight">
                    Frictionless Registration
                  </h3>
                  <p className="text-slate-900 font-bold text-xs">
                    Scan, choose your pass, settle directly via UPI or cash, and step onto the floor instantly. No physical forms needed!
                  </p>
                </div>
                <div className="border-t-2 border-black/30 pt-4 flex justify-between items-center relative z-10 text-[10px] font-mono font-bold text-slate-800">
                  <span>SYSTEM ONLINE</span>
                  <span>v1.0.4</span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Info Bar */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="neo-card p-6 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000] flex items-start gap-4">
              <div className="p-3 bg-brutal-cyan border-2 border-black rounded-lg text-black">
                <MapPin className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase">LOCATION</span>
                <p className="font-extrabold text-sm text-black mt-1 leading-snug">{gym.address || "Add Address In Settings"}</p>
              </div>
            </div>

            <div className="neo-card p-6 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000] flex items-start gap-4">
              <div className="p-3 bg-brutal-purple border-2 border-black rounded-lg text-black">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase">BUSINESS HOURS</span>
                <p className="font-extrabold text-sm text-black mt-1 leading-snug">{gym.operating_hours || "06:00 AM - 10:00 PM"}</p>
              </div>
            </div>

            <div className="neo-card p-6 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000] flex items-start gap-4">
              <div className="p-3 bg-brutal-yellow border-2 border-black rounded-lg text-black">
                <Phone className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase">CALL OWNER</span>
                <p className="font-extrabold text-sm text-black mt-1 leading-snug">{gym.phone || "Add Contact Number"}</p>
              </div>
            </div>
          </section>

          {/* Media & Video Section */}
          {(embedVideoUrl || gym.instagram_url) && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* YouTube Promo Video Embed */}
              {embedVideoUrl ? (
                <div className="lg:col-span-8 neo-card p-5 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000] flex flex-col h-full">
                  <h3 className="font-extrabold uppercase text-lg mb-4 flex items-center gap-2 border-b-2 border-black pb-2">
                    <span>📺 Watch Promo Video</span>
                  </h3>
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-black shadow-[3px_3px_0px_0px_#000000] bg-black">
                    <iframe
                      src={embedVideoUrl}
                      title={`${gym.name} Promo Video`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              ) : null}

              {/* Instagram Card & Social Callout */}
              <div className={`${embedVideoUrl ? 'lg:col-span-4' : 'lg:col-span-12'} flex flex-col`}>
                <div className="neo-card p-6 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000] flex-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brutal-purple/5 rounded-full blur-xl -z-10"></div>
                  
                  <div className="space-y-4">
                    <h3 className="font-extrabold uppercase text-lg flex items-center gap-2 border-b-2 border-black pb-2 text-black">
                      <span>📸 Connect On Instagram</span>
                    </h3>
                    <p className="text-slate-800 font-bold text-xs leading-relaxed">
                      Follow our official handle to check out daily workouts, member spotlights, schedule updates, and trainer tips!
                    </p>
                  </div>

                  <div className="mt-8 space-y-3">
                    {gym.instagram_url ? (
                      <a
                        href={gym.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-3 px-4 bg-[#e1306c] hover:bg-[#d6245f] text-white border-3 border-black text-sm font-black uppercase rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000000] transition active:translate-x-0.5 active:translate-y-0.5 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000]"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        <span>Visit Instagram</span>
                      </a>
                    ) : (
                      <div className="w-full text-center py-4 bg-slate-100 border-2 border-dashed border-slate-300 text-xs font-bold text-slate-500 rounded-xl">
                        No Instagram profile linked yet.
                      </div>
                    )}

                    <div className="p-3 bg-brutal-cyan/20 border-2 border-black rounded-xl text-center">
                      <span className="text-[10px] font-black uppercase text-slate-800">
                        COMMUNITY INSIDE ⚡
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Photo Gallery Grid */}
          {(gym.gallery_photo1 || gym.gallery_photo2 || gym.gallery_photo3) && (
            <section className="space-y-6">
              <h3 className="text-2xl font-black uppercase text-black tracking-tight border-b-3 border-black pb-2 flex items-center gap-2">
                <span>📸 Facilities Photo Gallery</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[gym.gallery_photo1, gym.gallery_photo2, gym.gallery_photo3]
                  .filter(Boolean)
                  .map((photo, index) => (
                    <div
                      key={index}
                      className="group neo-card aspect-video border-3 border-black shadow-[4px_4px_0px_0px_#000000] overflow-hidden rounded-2xl relative bg-white animate-fade-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`${gym.name} Gym Facility Photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white font-extrabold uppercase text-xs tracking-wider">
                          Facility View {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Plan Picker section */}
          <section id="plans-section" className="space-y-6">
            <h3 className="text-2xl font-black uppercase text-black tracking-tight border-b-3 border-black pb-2 flex items-center gap-2">
              <span>🏷️ Membership Pricing Plans</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.length === 0 ? (
                <div className="col-span-full py-12 text-center neo-card bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000]">
                  <p className="text-slate-500 font-bold text-sm uppercase">No active membership packages set up.</p>
                </div>
              ) : (
                plans.map((p, idx) => {
                  const colors = ["bg-white", "bg-brutal-cyan/10", "bg-brutal-yellow/10", "bg-brutal-purple/10"];
                  const color = colors[idx % colors.length];
                  return (
                    <div
                      key={p.id}
                      className={`neo-card p-6 ${color} border-3 border-black shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between relative`}
                    >
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-brutal-orange border-b border-black"></div>
                      
                      <div className="pt-2">
                        <h4 className="font-extrabold text-black text-lg uppercase tracking-tight truncate mb-2">
                          {p.name}
                        </h4>
                        <p className="text-slate-800 text-xs font-semibold leading-relaxed mb-6 line-clamp-3">
                          {p.description || "Full access pass package."}
                        </p>
                      </div>

                      <div className="pt-4 border-t-2 border-dashed border-black mt-auto">
                        <div className="mb-4">
                          <span className="text-3xl font-black text-black">
                            ₹{p.price.toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs text-slate-800 font-mono font-bold ml-1">
                            /{p.duration_days} days
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedPlanId(p.id);
                            setViewMode("form");
                            setStep(1);
                          }}
                          className="w-full text-center py-2.5 px-4 bg-brutal-yellow hover:bg-brutal-yellow/90 text-black border-3 border-black text-xs font-black uppercase rounded-xl shadow-[3px_3px_0px_0px_#000000] transition active:translate-x-0.5 active:translate-y-0.5 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000]"
                        >
                          Choose Package
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Bottom Call to Action */}
          <section className="text-center py-8">
            <button
              onClick={() => setViewMode("form")}
              className="neo-btn neo-btn-orange font-black py-5 px-10 text-base sm:text-lg shadow-[6px_6px_0px_0px_#000000] uppercase tracking-wider flex items-center gap-3.5 mx-auto hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[7px_7px_0px_0px_#000000]"
            >
              <span>Ready? Click here to Join Now</span>
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </section>
        </main>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto px-4 text-center text-slate-500 font-black text-[10px] sm:text-xs uppercase border-t-2 border-black pt-6">
          Powered by FlexFlow Gym SaaS. Directly Settled Peer-to-Peer.
        </footer>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-brutal-bg text-black px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back to Landing Page navigation */}
        <button
          type="button"
          onClick={() => setViewMode("landing")}
          className="group inline-flex items-center gap-2 py-2.5 px-4 bg-white border-3 border-black hover:bg-slate-50 text-black text-xs font-black uppercase rounded-xl shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000]"
        >
          <ChevronLeft className="w-4 h-4 stroke-[3] group-hover:translate-x-[-1px] transition-transform" />
          <span>Back to Gym Landing Page</span>
        </button>

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
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-black tracking-tight">
              {gym.name}
            </h1>
            <p className="text-slate-800 font-bold text-xs sm:text-sm">
              {gym.description}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-slate-700 text-xs font-bold font-mono">
              {gym.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{gym.phone}</span>
                </div>
              )}
              {gym.operating_hours && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{gym.operating_hours}</span>
                </div>
              )}
              {gym.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{gym.address}</span>
                </div>
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
            { num: 1, label: "Details" },
            { num: 2, label: "Pick Plan" },
            { num: 3, label: "Pay & Verify" },
          ].map((s) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center font-black text-xs shadow-[1.5px_1.5px_0px_0px_#000000] ${
                    step === s.num
                      ? "bg-brutal-yellow text-black"
                      : step > s.num
                        ? "bg-brutal-green text-black"
                        : "bg-white text-slate-400"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span
                  className={`text-xs font-black uppercase tracking-tight hidden sm:inline ${
                    step === s.num
                      ? "text-black underline decoration-2 decoration-brutal-orange"
                      : "text-slate-650"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {s.num < 3 && (
                <div
                  className={`flex-1 h-1 max-w-[60px] sm:max-w-none mx-2 border-y border-black ${
                    step > s.num ? "bg-brutal-green" : "bg-white"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Stepper Content Card */}
        <div className="neo-card p-6 sm:p-8 bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000]">
          {/* STEP 1: CONTACT DETAILS */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase text-black mb-4 border-b-3 border-black pb-2">
                Your Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                    Full Name
                  </label>
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
                  <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                    WhatsApp / Contact Number
                  </label>
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
                  <p className="mt-1 text-[10px] text-slate-700 font-bold">
                    Used to verify and notify you of renewals.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-black mt-6">
                <button
                  type="button"
                  onClick={() => setViewMode("landing")}
                  className="inline-flex items-center gap-1 text-black font-extrabold uppercase hover:underline transition cursor-pointer text-sm"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" />
                  <span>Back to Gym Page</span>
                </button>
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
              <h2 className="text-xl font-black uppercase text-black mb-4 border-b-3 border-black pb-2">
                Select Membership Plan
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {plans.length === 0 ? (
                  <p className="text-slate-500 font-bold text-sm text-center py-6">
                    This gym has not defined any active membership plans yet.
                  </p>
                ) : (
                  plans.map((p) => (
                    <label
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`neo-card p-5 flex items-center justify-between border-3 cursor-pointer transition ${
                        selectedPlanId === p.id
                          ? "border-black bg-brutal-cyan/25 shadow-[4px_4px_0px_0px_#000000] translate-y-[-1px]"
                          : "border-black/35 shadow-none"
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
                          <span className="block font-black uppercase text-black text-base leading-none">
                            {p.name}
                          </span>
                          <span className="block text-slate-700 text-xs mt-1 font-semibold">
                            {p.description}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-xl font-black text-black">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                        <span className="block text-[10px] text-slate-800 font-mono font-bold mt-0.5">
                          {p.duration_days} days validity
                        </span>
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
              <h2 className="text-xl font-black uppercase text-black mb-2 border-b-3 border-black pb-2">
                Complete Membership Payment
              </h2>

              {/* Payment Method Tabs Selector */}
              <div className="grid grid-cols-2 gap-3.5 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`py-3 px-4 border-3 border-black text-xs font-black uppercase transition-all shadow-[2.5px_2.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] cursor-pointer ${
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
                  className={`py-3 px-4 border-3 border-black text-xs font-black uppercase transition-all shadow-[2.5px_2.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000] cursor-pointer ${
                    paymentMethod === "cash"
                      ? "bg-brutal-yellow text-black"
                      : "bg-white text-slate-500 hover:bg-slate-555"
                  }`}
                >
                  💵 Pay in Cash
                </button>
              </div>

              {/* Motivational Checkout Copy */}
              <div className="bg-brutal-cyan/20 border-3 border-black rounded-xl p-4 text-xs font-bold leading-normal text-black flex items-start gap-2.5 shadow-[2px_2px_0px_0px_#000000]">
                <span className="text-xl">🔥</span>
                <div>
                  <span className="font-extrabold uppercase text-sm block">
                    You're making the right move!
                  </span>
                  <p className="mt-0.5 text-slate-800 text-[11px]">
                    {paymentMethod === "upi"
                      ? "Complete the transaction below to unlock your access pass and start crushing your goals."
                      : "Please hand over the exact cash amount directly to the gym owner or counter receptionist."}
                  </p>
                </div>
              </div>

              {submitError && (
                <div className="bg-red-100 border-3 border-black text-black font-semibold text-xs sm:text-sm rounded-xl p-3.5 shadow-[2px_2px_0px_0px_#000000]">
                  <span>{submitError}</span>
                </div>
              )}

              {paymentMethod === "upi" ? (
                <>
                  {/* UPI QR Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brutal-bg/40 p-6 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_#000000]">
                    {/* QR Code Wrapper */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-slate-800 text-[10px] font-black uppercase mb-3">
                        Scan UPI QR Code
                      </span>

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

                      <span className="text-[9px] font-bold text-slate-700 mt-2 uppercase">
                        Google Pay, PhonePe, Paytm
                      </span>
                    </div>

                    {/* Billing details */}
                    <div className="flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-slate-800 text-[10px] font-black uppercase tracking-wider">
                          Payment Instructions
                        </span>
                        <div className="text-slate-800 text-xs sm:text-sm font-bold leading-normal">
                          1. Open your UPI scanner app. <br />
                          2. Scan the code to settle price directly, or enter
                          merchant address manually:
                        </div>

                        <div className="bg-white p-3 border-3 border-black rounded-lg mt-2 text-center shadow-[2px_2px_0px_0px_#000000]">
                          <div className="text-[9px] text-slate-750 font-black uppercase">
                            UPI Address
                          </div>
                          <div className="text-brutal-orange font-mono font-black text-xs sm:text-sm select-all mt-1">
                            {gym.upi_id || "merchant@upi"}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-black flex justify-between items-baseline mt-4">
                        <span className="text-slate-700 text-xs font-black uppercase">
                          {" "}
                          Payable
                        </span>
                        <span className="text-2xl font-black text-black">
                          ₹{selectedPlan.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* UTR Input / Screenshot upload */}
                  <div className="space-y-4 pt-2">
                    {/* UTR */}
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                        Enter UPI UTR / Transaction Ref ID
                      </label>
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
                      <label className="block text-xs font-black uppercase text-slate-800 tracking-wider mb-2">
                        OR Upload Payment Screenshot
                      </label>
                      <div className="relative group border-3 border-dashed border-black hover:bg-slate-50 rounded-xl p-5 flex flex-col items-center justify-center transition cursor-pointer bg-white shadow-[2px_2px_0px_0px_#000000]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <Upload className="w-8 h-8 text-black stroke-[2.5] mb-2 group-hover:translate-y-[-1px] transition-transform" />
                        <span className="text-xs text-black font-black uppercase tracking-tight">
                          {screenshotUrl
                            ? "Receipt slip attached"
                            : "Click to Upload Transaction screenshot"}
                        </span>
                      </div>

                      {screenshotUrl && (
                        <div className="mt-3 flex items-center justify-center gap-3 bg-white p-2.5 border-3 border-black rounded-lg max-w-xs mx-auto shadow-[2px_2px_0px_0px_#000000]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={screenshotUrl}
                            alt="Receipt Preview"
                            className="w-12 h-16 object-cover rounded border-2 border-black bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs text-black font-bold truncate">
                              screenshot.png
                            </span>
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
                  <h3 className="text-sm font-black uppercase text-black">
                    Cash Payment Details
                  </h3>
                  <div className="text-slate-800 text-xs sm:text-sm font-bold leading-relaxed space-y-2">
                    <p>1. Go to the Gym front counter desk.</p>
                    <p>
                      2. Tell the trainer/owner your registered Name:{" "}
                      <span className="font-extrabold text-black">
                        "{memberName}"
                      </span>{" "}
                      and Phone.
                    </p>
                    <p>3. Hand over the exact subscription fees in cash: </p>
                  </div>

                  <div className="bg-white p-4 border-3 border-black rounded-xl text-center shadow-[3px_3px_0px_0px_#000000]">
                    <div className="text-[10px] text-slate-500 font-black uppercase">
                      Amount to Pay in Cash
                    </div>
                    <div className="text-brutal-orange font-black text-2xl mt-1">
                      ₹{selectedPlan.price.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase mt-1">
                      For Plan: {selectedPlan.name}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-650 font-bold text-center leading-normal">
                    Click "Register & Join" below. Your subscription status will
                    remain **Pending** until the owner receives cash and
                    verifies it.
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
                  {submitting ? "Submitting..." : "Register & Join"}
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
