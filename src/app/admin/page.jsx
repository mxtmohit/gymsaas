"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { db } from "@/lib/database";
import {
  Building,
  Users,
  ShieldAlert,
  Search,
  CheckCircle,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Lock,
  Unlock,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [gyms, setGyms] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Load all gyms on platform
  useEffect(() => {
    async function loadPlatformData() {
      try {
        const gymsList = await db.getGymsList();
        setGyms(gymsList);

        let membersAcc = [];
        let paymentsAcc = [];

        for (const gym of gymsList) {
          const gymMembers = await db.getMembersByGym(gym.id);
          const gymPayments = await db.getPaymentsByGym(gym.id);
          membersAcc = [...membersAcc, ...gymMembers];
          paymentsAcc = [...paymentsAcc, ...gymPayments];
        }

        setAllMembers(membersAcc);
        setAllPayments(paymentsAcc);
      } catch (err) {
        console.error("Failed to load super admin data", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlatformData();
  }, []);

  const refreshAdmin = async () => {
    try {
      const gymsList = await db.getGymsList();
      setGyms(gymsList);

      let membersAcc = [];
      let paymentsAcc = [];

      for (const gym of gymsList) {
        const gymMembers = await db.getMembersByGym(gym.id);
        const gymPayments = await db.getPaymentsByGym(gym.id);
        membersAcc = [...membersAcc, ...gymMembers];
        paymentsAcc = [...paymentsAcc, ...gymPayments];
      }

      setAllMembers(membersAcc);
      setAllPayments(paymentsAcc);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Gym Suspension
  const handleToggleSuspend = async (gym) => {
    const isSuspended = !gym.is_suspended;
    try {
      const updatedGym = {
        ...gym,
        is_suspended: isSuspended,
      };
      await db.updateGym(updatedGym);
      if (typeof window !== "undefined") {
        const localGyms = JSON.parse(
          window.localStorage.getItem("gyms") || "[]",
        );
        const idx = localGyms.findIndex((g) => g.id === gym.id);
        if (idx !== -1) {
          localGyms[idx].is_suspended = isSuspended;
          window.localStorage.setItem("gyms", JSON.stringify(localGyms));
        }
      }
      await refreshAdmin();
    } catch (err) {
      alert("Failed to update suspension status.");
    }
  };

  // Delete Gym
  const handleDeleteGym = async (gymId, gymName) => {
    if (
      !confirm(
        `Warning: Are you sure you want to delete "${gymName}"? All plans, members, and billing logs will be permanently deleted.`,
      )
    )
      return;
    try {
      await db.deleteGym(gymId);
      if (typeof window !== "undefined") {
        const plans = JSON.parse(window.localStorage.getItem("plans") || "[]");
        const members = JSON.parse(
          window.localStorage.getItem("members") || "[]",
        );
        const memberships = JSON.parse(
          window.localStorage.getItem("memberships") || "[]",
        );
        const payments = JSON.parse(
          window.localStorage.getItem("payments") || "[]",
        );

        window.localStorage.setItem(
          "plans",
          JSON.stringify(plans.filter((p) => p.gym_id !== gymId)),
        );
        window.localStorage.setItem(
          "members",
          JSON.stringify(members.filter((m) => m.gym_id !== gymId)),
        );
        window.localStorage.setItem(
          "memberships",
          JSON.stringify(
            memberships.filter((ms) => {
              const gymMemberIds = members
                .filter((m) => m.gym_id === gymId)
                .map((m) => m.id);
              return !gymMemberIds.includes(ms.member_id);
            }),
          ),
        );
        window.localStorage.setItem(
          "payments",
          JSON.stringify(
            payments.filter((p) => {
              const gymMemberIds = members
                .filter((m) => m.gym_id === gymId)
                .map((m) => m.id);
              return !gymMemberIds.includes(p.member_id);
            }),
          ),
        );
      }

      await refreshAdmin();
    } catch (err) {
      alert("Failed to delete gym.");
    }
  };

  // Compute Platform Metrics
  const metrics = useMemo(() => {
    const totalGyms = gyms.length;
    const totalMembers = allMembers.length;
    const activeMembers = allMembers.filter(
      (m) => m.status === "active",
    ).length;
    const totalRevenue = allPayments
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalGyms, totalMembers, activeMembers, totalRevenue };
  }, [gyms, allMembers, allPayments]);

  // Filter gyms
  const filteredGyms = useMemo(() => {
    return gyms.filter(
      (g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.address &&
          g.address.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [gyms, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-black animate-bounce" />
          <p className="text-black font-extrabold text-sm uppercase">
            Loading Admin Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-bg text-black font-sans relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-3 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-1.5 hover:bg-slate-50 border-2 border-black rounded-lg text-black transition shadow-[2px_2px_0px_0px_#000000]"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
            </Link>
            <Logo />
            <span className="hidden sm:inline bg-brutal-purple border-2 border-black text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_#000000]">
              Super Admin Console
            </span>
          </div>
          <div className="font-bold uppercase text-xs sm:text-sm">
            Platform Metrics Overview
          </div>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="neo-card p-6 bg-white shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-black">
              <Building className="w-16 h-16" />
            </div>
            <p className="text-slate-650 text-xs font-black uppercase tracking-wider">
              Total Gyms
            </p>
            <p className="text-3xl font-extrabold text-black mt-2">
              {metrics.totalGyms}
            </p>
          </div>

          <div className="neo-card p-6 bg-white shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-black">
              <Users className="w-16 h-16" />
            </div>
            <p className="text-slate-650 text-xs font-black uppercase tracking-wider">
              Total Members
            </p>
            <p className="text-3xl font-extrabold text-black mt-2">
              {metrics.totalMembers}
            </p>
          </div>

          <div className="neo-card p-6 bg-white border-l-brutal-green shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-black">
              <CheckCircle className="w-16 h-16" />
            </div>
            <p className="text-slate-650 text-xs font-black uppercase tracking-wider">
              Active Passes
            </p>
            <p className="text-3xl font-extrabold text-brutal-green mt-2">
              {metrics.activeMembers}
            </p>
          </div>

          <div className="neo-card p-6 bg-white border-l-brutal-cyan shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-black">
              <TrendingUp className="w-16 h-16" />
            </div>
            <p className="text-slate-650 text-xs font-black uppercase tracking-wider">
              SaaS Revenue
            </p>
            <p className="text-3xl font-extrabold text-brutal-cyan mt-2">
              ₹{metrics.totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Gym Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <input
              type="text"
              placeholder="Search gyms by name, slug, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input block w-full !pl-10 !pr-3 py-2 text-sm"
            />
          </div>

          <div className="text-black font-extrabold text-xs sm:text-sm uppercase bg-white border-2 border-black rounded px-3 py-1.5 shadow-[2px_2px_0px_0px_#000000]">
            Showing {filteredGyms.length} of {gyms.length} gyms
          </div>
        </div>

        {/* Gyms Table List (Brutalist border lines) */}
        <div className="neo-card overflow-hidden bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-3 border-black bg-[#fafafa] text-black text-xs font-black uppercase tracking-wider">
                  <th className="p-4 sm:p-5 border-r-2 border-black/10">
                    Gym Details
                  </th>
                  <th className="p-4 sm:p-5 border-r-2 border-black/10">
                    Contact Address
                  </th>
                  <th className="p-4 sm:p-5 border-r-2 border-black/10">
                    Created At
                  </th>
                  <th className="p-4 sm:p-5 border-r-2 border-black/10">
                    Status
                  </th>
                  <th className="p-4 sm:p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black text-sm">
                {filteredGyms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center font-bold text-slate-500 text-xs sm:text-sm"
                    >
                      No registered gyms matching the query.
                    </td>
                  </tr>
                ) : (
                  filteredGyms.map((gym) => {
                    const isSuspended = gym.is_suspended === true;
                    const createdDate = new Date(gym.created_at);
                    const formattedCreated = createdDate.toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    );

                    return (
                      <tr
                        key={gym.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 sm:p-5 border-r-2 border-black/10">
                          <div className="flex items-center gap-3">
                            {gym.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={gym.logo_url}
                                alt="Logo"
                                className="w-9 h-9 border-2 border-black rounded object-cover bg-white"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded bg-brutal-cyan border-2 border-black flex items-center justify-center text-black font-black text-xs">
                                {gym.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-extrabold uppercase text-black truncate max-w-[180px] sm:max-w-xs">
                                {gym.name}
                              </div>
                              <div className="text-slate-700 text-xs font-mono font-bold truncate max-w-[180px]">
                                {gym.slug}.mygymsaas.com
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 sm:p-5 border-r-2 border-black/10 font-bold">
                          <div className="text-slate-800 text-xs sm:text-sm">
                            {gym.phone || "No phone"}
                          </div>
                          <div className="text-slate-650 text-[10px] sm:text-xs truncate max-w-[180px] sm:max-w-xs">
                            {gym.address || "No address"}
                          </div>
                        </td>

                        <td className="p-4 sm:p-5 border-r-2 border-black/10 text-slate-800 font-mono text-xs font-bold">
                          {formattedCreated}
                        </td>

                        <td className="p-4 sm:p-5 border-r-2 border-black/10">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded border-2 border-black text-[10px] sm:text-xs font-black uppercase ${
                              isSuspended
                                ? "bg-brutal-red text-black"
                                : "bg-brutal-green text-black"
                            }`}
                          >
                            {isSuspended ? "Suspended" : "Active"}
                          </span>
                        </td>

                        <td className="p-4 sm:p-5 text-right space-x-1.5">
                          <button
                            onClick={() => handleToggleSuspend(gym)}
                            className={`neo-btn py-1 px-2.5 text-xs shadow-[2px_2px_0px_0px_#000000] border-2 ${
                              isSuspended ? "bg-brutal-green" : "bg-brutal-red"
                            }`}
                            title={
                              isSuspended
                                ? "Activate Gym Profile"
                                : "Suspend Gym Profile"
                            }
                          >
                            {isSuspended ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                                <span>Unsuspend</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                                <span>Suspend</span>
                              </>
                            )}
                          </button>

                          <Link
                            href={`/join/${gym.slug}`}
                            target="_blank"
                            className="inline-flex items-center p-1.5 border-2 border-black bg-white hover:bg-slate-50 text-black rounded transition"
                            title="Open Onboarding Page"
                          >
                            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                          </Link>

                          <button
                            onClick={() => handleDeleteGym(gym.id, gym.name)}
                            className="p-1.5 border-2 border-black bg-white hover:bg-rose-50 text-black hover:text-red-500 rounded transition"
                            title="Delete Gym Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
