'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import QRGenerator from '@/components/QRGenerator';
import { db } from '@/lib/database';
import { Gym, Plan, Member, Payment, Membership } from '@/lib/mockDb';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  IndianRupee,
  LayoutDashboard,
  CreditCard,
  Settings,
  QrCode,
  FileText,
  Search,
  Plus,
  Trash2,
  Calendar,
  Check,
  X,
  LogOut,
  Clock,
  Phone,
  MapPin,
  ExternalLink,
  Sparkles,
  TrendingUp,
  UserPlus,
  Activity,
  Bell,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const router = useRouter();
  
  // Loading & Session States
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<(Payment & { memberName: string; phone: string })[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'payments' | 'plans' | 'profile' | 'qr'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [clearedNotifications, setClearedNotifications] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Filters (Members)
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'expired' | 'pending'>('all');

  // New Plan Form Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    duration_days: '30',
    description: '',
    is_active: true
  });

  // Edit Gym Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    address: '',
    phone: '',
    upi_id: '',
    description: '',
    operating_hours: '',
    logo_url: '' as string | null,
    upi_qr_url: '' as string | null
  });

  // Member Action Modal States
  const [showMemberModal, setShowMemberModal] = useState<{
    type: 'extend' | 'plan' | 'profile';
    member: Member;
  } | null>(null);
  const [extendExpiryDate, setExtendExpiryDate] = useState('');
  const [changePlanId, setChangePlanId] = useState('');

  // Payment Screenshot Modal State
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);

  // Authenticate user on load
  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await db.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        
        // Load gym
        const gymData = await db.getGymByOwner(currentUser.id);
        if (!gymData) {
          await db.signUp(currentUser.email, "My Fit Club", "my-fit-club");
          window.location.reload();
          return;
        }
        setGym(gymData);
        
        setProfileForm({
          name: gymData.name,
          address: gymData.address || '',
          phone: gymData.phone || '',
          upi_id: gymData.upi_id || '',
          description: gymData.description || '',
          operating_hours: gymData.operating_hours || '',
          logo_url: gymData.logo_url,
          upi_qr_url: gymData.upi_qr_url
        });

        // Load plans, members, payments, memberships
        const plansList = await db.getPlansByGym(gymData.id);
        setPlans(plansList);

        const membersList = await db.getMembersByGym(gymData.id);
        setMembers(membersList);

        const paymentsList = await db.getPaymentsByGym(gymData.id);
        setPayments(paymentsList);

        if (typeof window !== 'undefined') {
          const msList = JSON.parse(window.localStorage.getItem('memberships') || '[]');
          setMemberships(msList);
          const cleared = JSON.parse(window.localStorage.getItem('cleared_notifications') || '[]');
          setClearedNotifications(cleared);
        }

      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Refresh data helper
  const refreshDashboard = async () => {
    if (!gym) return;
    try {
      const plansList = await db.getPlansByGym(gym.id);
      setPlans(plansList);

      const membersList = await db.getMembersByGym(gym.id);
      setMembers(membersList);

      const paymentsList = await db.getPaymentsByGym(gym.id);
      setPayments(paymentsList);

      if (typeof window !== 'undefined') {
        const msList = JSON.parse(window.localStorage.getItem('memberships') || '[]');
        setMemberships(msList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Real-time synchronization for new signups and payments
  useEffect(() => {
    if (!gym) return;

    // Poll every 2 seconds
    const interval = setInterval(() => {
      refreshDashboard();
    }, 2000);

    // Listen to storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'members' || e.key === 'payments' || e.key === 'memberships') {
        refreshDashboard();
      }
      if (e.key === 'cleared_notifications') {
        const cleared = JSON.parse(e.newValue || '[]');
        setClearedNotifications(cleared);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [gym]);

  // Base64 File Uploader Helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'upi_qr') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileForm(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'upi_qr_url']: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym) return;
    try {
      setLoading(true);
      const updatedGym: Gym = {
        ...gym,
        name: profileForm.name,
        address: profileForm.address,
        phone: profileForm.phone,
        upi_id: profileForm.upi_id,
        description: profileForm.description,
        operating_hours: profileForm.operating_hours,
        logo_url: profileForm.logo_url,
        upi_qr_url: profileForm.upi_qr_url
      };
      await db.updateGym(updatedGym);
      setGym(updatedGym);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await db.logout();
    router.push('/');
  };

  // Create Plan Action
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym) return;
    try {
      const newPlan: Plan = {
        id: 'temp-' + Date.now(),
        gym_id: gym.id,
        name: planForm.name,
        price: parseFloat(planForm.price),
        duration_days: parseInt(planForm.duration_days),
        description: planForm.description,
        is_active: planForm.is_active
      };
      await db.savePlan(newPlan);
      setShowPlanModal(false);
      setPlanForm({ name: '', price: '', duration_days: '30', description: '', is_active: true });
      refreshDashboard();
    } catch (err) {
      alert('Failed to create plan.');
    }
  };

  // Toggle Plan Status Active/Inactive
  const handleTogglePlan = async (plan: Plan) => {
    try {
      const updatedPlan = { ...plan, is_active: !plan.is_active };
      await db.savePlan(updatedPlan);
      refreshDashboard();
    } catch (err) {
      alert('Failed to toggle plan status.');
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await db.deletePlan(planId);
      refreshDashboard();
    } catch (err) {
      alert('Failed to delete plan.');
    }
  };

  // Approve Payment Action
  const handleApprovePayment = async (paymentId: string) => {
    try {
      await db.updatePaymentStatus(paymentId, 'approved');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      refreshDashboard();
    } catch (err) {
      alert('Failed to approve payment.');
    }
  };

  // Reject Payment Action
  const handleRejectPayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to reject this payment?')) return;
    try {
      await db.updatePaymentStatus(paymentId, 'rejected');
      refreshDashboard();
    } catch (err) {
      alert('Failed to reject payment.');
    }
  };

  const handleClearAllNotifications = () => {
    const allIds = stats.activityFeed.map(e => e.id);
    const updated = Array.from(new Set([...clearedNotifications, ...allIds]));
    setClearedNotifications(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cleared_notifications', JSON.stringify(updated));
    }
  };

  const handleNotificationClick = (activity: any) => {
    setShowNotifications(false);
    if (activity.targetTab) {
      setActiveTab(activity.targetTab);
    }
    if (activity.memberId) {
      const memberObj = members.find(m => m.id === activity.memberId);
      if (memberObj) {
        setShowMemberModal({ type: 'profile', member: memberObj });
      }
    }
  };

  // Delete Member Action
  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this member? All their payment and membership histories will be removed.')) return;
    try {
      await db.deleteMember(memberId);
      refreshDashboard();
    } catch (err) {
      alert('Failed to delete member.');
    }
  };

  // Save Member Extension (Manual Expiry Date Override)
  const handleSaveMemberExtension = async () => {
    if (!showMemberModal || !extendExpiryDate) return;
    try {
      const m = showMemberModal.member;
      const updatedMember: Member = {
        ...m,
        expires_at: new Date(extendExpiryDate).toISOString(),
        status: new Date(extendExpiryDate).getTime() > Date.now() ? 'active' : 'expired'
      };
      await db.saveMember(updatedMember);
      setShowMemberModal(null);
      setExtendExpiryDate('');
      refreshDashboard();
    } catch (err) {
      alert('Failed to extend member.');
    }
  };

  // Save Member Plan Change (Recalculates expiry date)
  const handleSaveMemberPlanChange = async () => {
    if (!showMemberModal || !changePlanId) return;
    try {
      const m = showMemberModal.member;
      const plan = plans.find(p => p.id === changePlanId);
      if (!plan) return;

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(startDate.getDate() + plan.duration_days);

      // Create new active membership record
      const newMs: Omit<Membership, 'id'> = {
        member_id: m.id,
        plan_id: plan.id,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'active'
      };

      const updatedMember: Member = {
        ...m,
        expires_at: expiryDate.toISOString(),
        status: 'active'
      };

      await db.saveMember(updatedMember);
      await db.saveMembership({ id: 'temp-' + Date.now(), ...newMs });
      
      setShowMemberModal(null);
      setChangePlanId('');
      refreshDashboard();
    } catch (err) {
      alert('Failed to change plan.');
    }
  };

  // Trigger Expired status manually
  const handleMarkExpired = async (member: Member) => {
    if (!confirm(`Mark ${member.name} as expired?`)) return;
    try {
      const updated = {
        ...member,
        status: 'expired' as const,
        expires_at: new Date().toISOString()
      };
      await db.saveMember(updated);
      refreshDashboard();
    } catch (err) {
      alert('Failed to mark expired.');
    }
  };

  // Analytics Computation
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const expired = members.filter(m => m.status === 'expired').length;
    const pending = members.filter(m => m.status === 'pending').length;
    
    // Revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    
    const revenueThisMonth = payments
      .filter(p => p.status === 'approved' && new Date(p.created_at).getTime() >= startOfMonth.getTime())
      .reduce((sum, p) => sum + p.amount, 0);

    // Revenue last month (MoM revenue growth calculation)
    const firstDayOfCurrentMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 1);
    const firstDayOfLastMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1);
    
    const revenueLastMonth = payments
      .filter(p => {
        if (p.status !== 'approved') return false;
        const payDate = new Date(p.created_at);
        return payDate >= firstDayOfLastMonth && payDate < firstDayOfCurrentMonth;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    let revGrowth = 0;
    if (revenueLastMonth > 0) {
      revGrowth = Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100);
    } else if (revenueThisMonth > 0) {
      revGrowth = 100;
    }

    // Signups growth calculation
    const signupsThisMonth = members.filter(m => {
      const joinedDate = new Date(m.joined_at);
      return joinedDate.getMonth() === startOfMonth.getMonth() && joinedDate.getFullYear() === startOfMonth.getFullYear();
    }).length;
    
    const signupsLastMonth = members.filter(m => {
      const joinedDate = new Date(m.joined_at);
      const prevMonth = startOfMonth.getMonth() === 0 ? 11 : startOfMonth.getMonth() - 1;
      const prevYear = startOfMonth.getMonth() === 0 ? startOfMonth.getFullYear() - 1 : startOfMonth.getFullYear();
      return joinedDate.getMonth() === prevMonth && joinedDate.getFullYear() === prevYear;
    }).length;

    let momGrowth = 0;
    if (signupsLastMonth > 0) {
      momGrowth = Math.round(((signupsThisMonth - signupsLastMonth) / signupsLastMonth) * 100);
    } else if (signupsThisMonth > 0) {
      momGrowth = 100;
    }

    // Expiring soon in next 7 days
    const expiringSoonCount = members.filter(m => {
      if (m.status !== 'active' || !m.expires_at) return false;
      const diff = new Date(m.expires_at).getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length;

    // Revenue target settings
    const targetRevenue = 50000;
    const targetProgress = Math.min(Math.round((revenueThisMonth / targetRevenue) * 100), 100);

    // Plan distribution calculation
    const distribution: { [key: string]: number } = {};
    let membershipsList: Membership[] = [];
    if (typeof window !== 'undefined') {
      try {
        membershipsList = JSON.parse(window.localStorage.getItem('memberships') || '[]');
      } catch (e) {
        console.error('Error loading memberships distribution', e);
      }
    }
    
    const gymMemberIds = new Set(members.map(m => m.id));
    const gymMemberships = membershipsList.filter(ms => gymMemberIds.has(ms.member_id));
    
    gymMemberships.forEach(ms => {
      const plan = plans.find(p => p.id === ms.plan_id);
      if (plan) {
        distribution[plan.name] = (distribution[plan.name] || 0) + 1;
      }
    });

    const planDistribution = Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const events: { id: string; type: string; message: string; date: Date; iconType: string; color: string; memberId?: string; targetTab?: string }[] = [];

    members.forEach(m => {
      const joinedDate = new Date(m.joined_at);
      events.push({
        id: `join-${m.id}`,
        type: 'join',
        message: `New member joined: ${m.name}`,
        date: joinedDate,
        iconType: 'user-plus',
        color: 'bg-brutal-cyan',
        memberId: m.id,
        targetTab: 'members'
      });

      if (m.status === 'active' && m.expires_at) {
        const expiryDate = new Date(m.expires_at);
        const diff = expiryDate.getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days >= 0 && days <= 7) {
          events.push({
            id: `expire-warning-${m.id}`,
            type: 'expiry-warning',
            message: `Pass expiring: ${m.name} (in ${days} days)`,
            date: new Date(Date.now() - (7 - days) * 12 * 60 * 60 * 1000), // simulated alert trigger date
            iconType: 'alert',
            color: 'bg-brutal-yellow',
            memberId: m.id,
            targetTab: 'members'
          });
        }
      }
      if (m.status === 'expired') {
        events.push({
          id: `expired-${m.id}`,
          type: 'expired',
          message: `Pass expired: ${m.name}`,
          date: m.expires_at ? new Date(m.expires_at) : new Date(m.joined_at),
          iconType: 'clock',
          color: 'bg-brutal-red',
          memberId: m.id,
          targetTab: 'members'
        });
      }
    });

    payments.forEach(p => {
      const pDate = new Date(p.created_at);
      if (p.status === 'pending') {
        events.push({
          id: `pay-pending-${p.id}`,
          type: 'pay-pending',
          message: `Fee pending check: ${p.memberName} (₹${p.amount})`,
          date: pDate,
          iconType: 'payment',
          color: 'bg-brutal-yellow',
          memberId: p.member_id,
          targetTab: 'payments'
        });
      } else if (p.status === 'approved') {
        events.push({
          id: `pay-approved-${p.id}`,
          type: 'pay-approved',
          message: `Fee approved: ${p.memberName} (₹${p.amount})`,
          date: pDate,
          iconType: 'check',
          color: 'bg-brutal-green',
          memberId: p.member_id,
          targetTab: 'payments'
        });
      } else if (p.status === 'rejected') {
        events.push({
          id: `pay-rejected-${p.id}`,
          type: 'pay-rejected',
          message: `Fee rejected: ${p.memberName} (₹${p.amount})`,
          date: pDate,
          iconType: 'x',
          color: 'bg-brutal-red',
          memberId: p.member_id,
          targetTab: 'payments'
        });
      }
    });

    const activityFeed = events
      .filter(e => !clearedNotifications.includes(e.id))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    return { 
      total, 
      active, 
      expired, 
      pending, 
      revenueThisMonth,
      revenueLastMonth,
      revGrowth,
      signupsThisMonth,
      signupsLastMonth,
      momGrowth,
      expiringSoonCount,
      targetRevenue,
      targetProgress,
      planDistribution,
      activityFeed
    };
  }, [members, payments, plans, clearedNotifications]);

  // SVG Chart Data Computation
  const newMembersChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap: { [key: string]: number } = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      dataMap[label] = 0;
    }

    members.forEach(m => {
      const d = new Date(m.joined_at);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      if (label in dataMap) {
        dataMap[label] += 1;
      }
    });

    return Object.entries(dataMap).map(([name, count]) => ({ name, count }));
  }, [members]);

  const revenueChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap: { [key: string]: number } = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      dataMap[label] = 0;
    }

    payments.forEach(p => {
      if (p.status !== 'approved') return;
      const d = new Date(p.created_at);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      if (label in dataMap) {
        dataMap[label] += p.amount;
      }
    });

    return Object.entries(dataMap).map(([name, revenue]) => ({ name, revenue }));
  }, [payments]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.phone.includes(memberSearch);
      
      const matchesFilter = 
        memberFilter === 'all' ? true : m.status === memberFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [members, memberSearch, memberFilter]);

  // Generate subdomain join link
  const joinLink = useMemo(() => {
    if (typeof window === 'undefined' || !gym) return 'https://flexflow.com';
    const host = window.location.host;
    const protocol = window.location.protocol;
    
    const hostParts = host.split('.');
    let baseHost = host;
    if (hostParts.length > 2) {
      baseHost = hostParts.slice(-2).join('.');
    }
    return `${protocol}//${gym.slug}.${baseHost}`;
  }, [gym]);

  if (loading && !gym) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Logo className="scale-110 animate-bounce" />
          <p className="text-black font-extrabold text-sm uppercase">Loading Gym Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brutal-bg text-black font-sans">
      
      {/* Confetti canvas */}
      <canvas id="confetti-canvas" />

      {/* Mobile Top Bar */}
      <header className="flex md:hidden sticky top-0 z-50 w-full h-16 bg-white border-b-3 border-black items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          {gym?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gym.logo_url} alt="Logo" className="w-8 h-8 border-2 border-black rounded object-cover bg-white" />
          ) : (
            <div className="w-8 h-8 rounded bg-brutal-cyan border-2 border-black flex items-center justify-center text-black font-black text-xs">
              {gym?.name.charAt(0)}
            </div>
          )}
          <span className="font-black text-black text-xs uppercase truncate max-w-[140px] tracking-tight">{gym?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Bell Notifications (Mobile Position) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setMobileMenuOpen(false);
              }}
              className="p-2 bg-white border-2 border-black rounded-lg hover:bg-slate-50 transition cursor-pointer relative active:translate-x-0.5 active:translate-y-0.5"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-black stroke-[2.5]" />
              {stats.activityFeed.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brutal-orange text-white border-2 border-black rounded-full flex items-center justify-center text-[8px] font-black animate-bounce">
                  {stats.activityFeed.length}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown on Mobile */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] z-40 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-1">
                    <h4 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-black">
                      <Bell className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Alerts ({stats.activityFeed.length})</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      {stats.activityFeed.length > 0 && (
                        <button
                          onClick={handleClearAllNotifications}
                          className="text-[9px] font-black text-brutal-orange hover:underline cursor-pointer uppercase"
                        >
                          [Clear]
                        </button>
                      )}
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-[9px] font-black text-slate-500 hover:text-black uppercase hover:underline cursor-pointer"
                      >
                        [Close]
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {stats.activityFeed.length === 0 ? (
                      <p className="text-center py-6 text-xs font-bold text-slate-500 uppercase">No recent updates</p>
                    ) : (
                      stats.activityFeed.map((activity) => (
                        <button 
                          key={activity.id} 
                          onClick={() => handleNotificationClick(activity)}
                          className="flex gap-2 p-1.5 px-2 rounded-lg border-2 border-black bg-white hover:bg-slate-50 text-left w-full cursor-pointer transition-all shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${activity.color}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-black leading-tight">{activity.message}</p>
                            <span className="text-[8px] text-slate-500 font-mono font-bold block mt-0.5">
                              {new Date(activity.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hamburger Menu button */}
          <button
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setShowNotifications(false);
            }}
            className="p-2 bg-white border-2 border-black rounded-lg hover:bg-slate-50 transition cursor-pointer relative active:translate-x-0.5 active:translate-y-0.5"
          >
            {mobileMenuOpen ? (
              <X className="w-4.5 h-4.5 text-black stroke-[3]" />
            ) : (
              <svg className="w-4.5 h-4.5 text-black stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-black/60 z-45 flex flex-col justify-start">
          <div className="bg-white border-b-3 border-black p-5 space-y-4 shadow-[0_4px_10px_rgba(0,0,0,0.1)] flex flex-col max-h-[80vh] overflow-y-auto">
            
            <div className="flex items-center gap-3 p-3 bg-brutal-bg/40 border-2 border-black rounded-lg">
              {gym?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gym.logo_url} alt="Logo" className="w-8 h-8 border border-black rounded object-cover bg-white" />
              ) : (
                <div className="w-8 h-8 rounded bg-brutal-cyan border border-black flex items-center justify-center text-black font-black text-xs">
                  {gym?.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-black text-xs truncate uppercase tracking-tight">{gym?.name}</h4>
                <p className="text-slate-700 text-[9px] font-bold font-mono truncate">{gym?.slug}.mygymsaas.com</p>
              </div>
            </div>

            <nav className="space-y-2.5">
              {[
                { tab: 'overview', label: 'Gym Overview', icon: LayoutDashboard, color: 'bg-brutal-yellow' },
                { tab: 'members', label: 'Gym Members', icon: Users, color: 'bg-brutal-purple', count: stats.pending },
                { tab: 'payments', label: 'Verify Fees', icon: CreditCard, color: 'bg-brutal-cyan', count: payments.filter(p => p.status === 'pending').length },
                { tab: 'plans', label: 'Membership Plans', icon: FileText, color: 'bg-brutal-yellow' },
                { tab: 'qr', label: 'Join QR & Link', icon: QrCode, color: 'bg-brutal-purple' },
                { tab: 'profile', label: 'Settings', icon: Settings, color: 'bg-brutal-cyan' }
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase transition-all rounded-lg ${
                      isSelected 
                        ? `${item.color} border-2 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-1px] text-black` 
                        : 'text-black border border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 stroke-[2.5]" />
                    <span>{item.label}</span>
                    {item.count && item.count > 0 ? (
                      <span className="ml-auto bg-brutal-orange text-white border border-black text-[9px] px-1.5 py-0.5 rounded font-black">
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
              <div className="text-[9px] font-bold text-slate-700 truncate px-2">
                SIGNED IN: <span className="font-mono text-black">{user?.email}</span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-black uppercase text-rose-650 hover:bg-rose-50 border border-transparent hover:border-black transition"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar (Brutalist style) - Desktop only */}
      <aside className="hidden md:flex w-64 bg-white border-r-3 border-black flex-col shrink-0 min-h-screen">
        {/* Sidebar Header */}
        <div className="h-16 border-b-3 border-black flex items-center justify-between px-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        {/* Gym Preview Summary */}
        <div className="p-5 border-b-3 border-black bg-brutal-bg/40">
          <div className="flex items-center gap-3">
            {gym?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gym.logo_url} alt="Logo" className="w-9 h-9 border-2 border-black rounded object-cover bg-white" />
            ) : (
              <div className="w-9 h-9 rounded bg-brutal-cyan border-2 border-black flex items-center justify-center text-black font-black text-sm">
                {gym?.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-black text-sm truncate uppercase tracking-tight">{gym?.name}</h4>
              <p className="text-slate-700 text-[10px] font-bold font-mono truncate">{gym?.slug}.mygymsaas.com</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase transition-all rounded-lg ${
              activeTab === 'overview' 
                ? 'bg-brutal-yellow border-3 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-1px] text-black' 
                : 'text-black hover:bg-slate-100 hover:border-2 hover:border-black/35'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
            <span>Gym Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('members')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase transition-all rounded-lg ${
              activeTab === 'members' 
                ? 'bg-brutal-purple border-3 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-1px] text-black' 
                : 'text-black hover:bg-slate-100 hover:border-2 hover:border-black/35'
            }`}
          >
            <Users className="w-4 h-4 stroke-[2.5]" />
            <span>Gym Members</span>
            {stats.pending > 0 && (
              <span className="ml-auto bg-brutal-orange text-white border-2 border-black text-[10px] px-2 py-0.5 rounded font-black">
                {stats.pending}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase transition-all rounded-lg ${
              activeTab === 'payments' 
                ? 'bg-brutal-cyan border-3 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-1px] text-black' 
                : 'text-black hover:bg-slate-100 hover:border-2 hover:border-black/35'
            }`}
          >
            <CreditCard className="w-4 h-4 stroke-[2.5]" />
            <span>Verify Fees</span>
            {payments.filter(p => p.status === 'pending').length > 0 && (
              <span className="ml-auto bg-brutal-yellow border-2 border-black text-black text-[10px] px-2 py-0.5 rounded font-black animate-bounce">
                {payments.filter(p => p.status === 'pending').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase transition-all rounded-lg ${
              activeTab === 'plans' 
                ? 'bg-brutal-yellow border-3 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-1px] text-black' 
                : 'text-black hover:bg-slate-100 hover:border-2 hover:border-black/35'
            }`}
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>Membership Plans</span>
          </button>
          
          <button
            onClick={() => setActiveTab('qr')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase transition-all rounded-lg ${
              activeTab === 'qr' 
                ? 'bg-brutal-purple border-3 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-1px] text-black' 
                : 'text-black hover:bg-slate-100 hover:border-2 hover:border-black/35'
            }`}
          >
            <QrCode className="w-4 h-4 stroke-[2.5]" />
            <span>Join QR & Link</span>
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase transition-all rounded-lg ${
              activeTab === 'profile' 
                ? 'bg-brutal-cyan border-3 border-black shadow-[2px_2px_0px_0px_#000000] translate-y-[-1px] text-black' 
                : 'text-black hover:bg-slate-100 hover:border-2 hover:border-black/35'
            }`}
          >
            <Settings className="w-4 h-4 stroke-[2.5]" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t-3 border-black">
          <div className="text-[10px] font-bold text-slate-700 px-4 mb-3 truncate">
            SIGNED IN: <span className="font-mono text-black">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-black uppercase text-rose-650 hover:bg-rose-50 border-2 border-transparent hover:border-black transition"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] md:max-h-screen">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-40">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black">
              {activeTab === 'overview' && 'Gym Overview'}
              {activeTab === 'members' && 'Members Directory'}
              {activeTab === 'payments' && 'Verify Payments'}
              {activeTab === 'plans' && 'Membership Plans'}
              {activeTab === 'qr' && 'Gym Joining Link & QR'}
              {activeTab === 'profile' && 'Gym Settings'}
            </h1>
            <p className="text-slate-700 text-xs sm:text-sm font-bold">
              {activeTab === 'overview' && `Quick summary of gym performance and income status.`}
              {activeTab === 'members' && `View list of all gym members, expiry dates, and statuses.`}
              {activeTab === 'payments' && `Verify member fee payments (UPI transaction checks or cash approvals).`}
              {activeTab === 'plans' && `Create and manage membership plans and fee packages.`}
              {activeTab === 'qr' && `Display this QR at your counter desk so new members can join directly.`}
              {activeTab === 'profile' && `Edit gym contact details, address, and UPI payments receiver settings.`}
            </p>
          </div>
          
          <div className="flex items-center gap-3.5 self-end sm:self-auto">
            {activeTab === 'overview' && (
              <Link 
                href={`/join/${gym?.slug}`}
                target="_blank"
                className="neo-btn neo-btn-cyan text-xs sm:text-sm shadow-[3px_3px_0px_0px_#000000]"
              >
                <span>Open Member Join Screen</span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            )}

            {/* Bell Notifications Dropdown */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-white border-3 border-black rounded-xl hover:bg-slate-50 transition cursor-pointer relative shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_0px_#000000]"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-black stroke-[2.5]" />
                {stats.activityFeed.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 bg-brutal-orange text-white border-2 border-black rounded-full flex items-center justify-center text-[9px] font-black animate-bounce">
                    {stats.activityFeed.length}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifications && (
                <>
                  {/* Backdrop click dismiss overlay */}
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                  
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border-3 border-black rounded-xl shadow-[5px_5px_0px_0px_#000000] z-40 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-1">
                      <h4 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-black">
                        <Bell className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Alerts ({stats.activityFeed.length})</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        {stats.activityFeed.length > 0 && (
                          <button
                            onClick={handleClearAllNotifications}
                            className="text-[9px] font-black text-brutal-orange hover:underline cursor-pointer uppercase"
                          >
                            [Clear All]
                          </button>
                        )}
                        <button 
                          onClick={() => setShowNotifications(false)}
                          className="text-[9px] font-black text-slate-500 hover:text-black uppercase hover:underline cursor-pointer"
                        >
                          [Close]
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {stats.activityFeed.length === 0 ? (
                        <p className="text-center py-6 text-xs font-bold text-slate-500 uppercase">No recent updates</p>
                      ) : (
                        stats.activityFeed.map((activity) => (
                          <button 
                            key={activity.id} 
                            onClick={() => handleNotificationClick(activity)}
                            className="flex gap-2.5 p-2 px-2.5 rounded-lg border-2 border-black bg-white hover:bg-slate-50 text-left w-full cursor-pointer transition-all shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                          >
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activity.color}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-black leading-tight">{activity.message}</p>
                              <span className="text-[8px] text-slate-500 font-mono font-bold block mt-1">
                                {new Date(activity.date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })} - {new Date(activity.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="neo-card p-6 bg-white shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-black"><Users className="w-16 h-16" /></div>
                <p className="text-slate-650 text-xs font-black uppercase tracking-wider">Total Members</p>
                <p className="text-3xl font-extrabold text-black mt-2">{stats.total}</p>
              </div>

              <div className="neo-card p-6 bg-white border-l-brutal-green shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-black"><CheckCircle className="w-16 h-16" /></div>
                <p className="text-slate-650 text-xs font-black uppercase tracking-wider">Active Members</p>
                <p className="text-3xl font-extrabold text-brutal-green mt-2">{stats.active}</p>
              </div>

              <div className="neo-card p-6 bg-white border-l-brutal-red shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-black"><AlertTriangle className="w-16 h-16" /></div>
                <p className="text-slate-650 text-xs font-black uppercase tracking-wider">Expired Members</p>
                <p className="text-3xl font-extrabold text-brutal-red mt-2">{stats.expired}</p>
              </div>

              <div className="neo-card p-6 bg-white border-l-brutal-purple shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-black"><IndianRupee className="w-16 h-16" /></div>
                <p className="text-slate-650 text-xs font-black uppercase tracking-wider">Revenue (Month)</p>
                <p className="text-3xl font-extrabold text-brutal-purple mt-2">₹{stats.revenueThisMonth.toLocaleString('en-IN')}</p>
              </div>

            </div>

            {/* Custom SVG Charts (Minimalist outline brutalist style) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Member Chart */}
              <div className="neo-card p-6 bg-white shadow-[4px_4px_0px_0px_#000000]">
                <h3 className="text-lg font-black uppercase text-black mb-6 border-b-3 border-black pb-2">New Members Registered</h3>
                <div className="h-64 flex flex-col justify-between">
                  <div className="flex-1 flex items-end gap-3 justify-around pt-4 pb-2 px-4 border-b-3 border-black relative bg-[#fafafa]">
                    
                    {/* Y Axis Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                      <div className="border-t-2 border-black w-full h-0"></div>
                      <div className="border-t-2 border-black w-full h-0"></div>
                      <div className="border-t-2 border-black w-full h-0"></div>
                    </div>

                    {newMembersChartData.map((d, idx) => {
                      const maxCount = Math.max(...newMembersChartData.map(item => item.count), 5);
                      const heightPercent = `${(d.count / maxCount) * 100}%`;
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group/bar z-10">
                          <div className="text-[10px] text-black font-black mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                            {d.count}
                          </div>
                          
                          {/* Brutalist Shadow & outlined Bar */}
                          <div className="relative w-full max-w-[28px] h-full flex items-end">
                            <div 
                              style={{ height: heightPercent }} 
                              className="w-full bg-brutal-yellow border-3 border-black rounded shadow-[2px_2px_0px_0px_#000000] group-hover/bar:translate-x-[-1px] group-hover/bar:translate-y-[-1px] group-hover/bar:shadow-[3px_3px_0px_0px_#000000] transition-all min-h-[6px]"
                            ></div>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                  
                  {/* Labels */}
                  <div className="flex justify-around mt-2 text-black font-bold text-xs uppercase">
                    {newMembersChartData.map((d, idx) => (
                      <span key={idx}>{d.name}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="neo-card p-6 bg-white shadow-[4px_4px_0px_0px_#000000]">
                <h3 className="text-lg font-black uppercase text-black mb-6 border-b-3 border-black pb-2">Revenue Growth (₹)</h3>
                <div className="h-64 flex flex-col justify-between">
                  <div className="flex-1 flex items-end gap-3 justify-around pt-4 pb-2 px-4 border-b-3 border-black relative bg-[#fafafa]">
                    
                    {/* Gridlines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                      <div className="border-t-2 border-black w-full h-0"></div>
                      <div className="border-t-2 border-black w-full h-0"></div>
                      <div className="border-t-2 border-black w-full h-0"></div>
                    </div>

                    {revenueChartData.map((d, idx) => {
                      const maxRev = Math.max(...revenueChartData.map(item => item.revenue), 10000);
                      const heightPercent = `${(d.revenue / maxRev) * 100}%`;
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group/bar z-10">
                          <div className="text-[9px] text-black font-black mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                            ₹{d.revenue.toLocaleString()}
                          </div>
                          
                          <div className="relative w-full max-w-[28px] h-full flex items-end">
                            <div 
                              style={{ height: heightPercent }} 
                              className="w-full bg-brutal-purple border-3 border-black rounded shadow-[2px_2px_0px_0px_#000000] group-hover/bar:translate-x-[-1px] group-hover/bar:translate-y-[-1px] group-hover/bar:shadow-[3px_3px_0px_0px_#000000] transition-all min-h-[6px]"
                            ></div>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                  
                  {/* Labels */}
                  <div className="flex justify-around mt-2 text-black font-bold text-xs uppercase">
                    {revenueChartData.map((d, idx) => (
                      <span key={idx}>{d.name}</span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Grid 3: Advanced Business Analytics (Full Width) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Target Achievement & Progress bar */}
              <div className="neo-card p-6 bg-white shadow-[4px_4px_0px_0px_#000000] relative">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Target Achievement</h4>
                    <h3 className="text-lg font-black uppercase text-black">Monthly Sales Goal</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-650">₹{stats.revenueThisMonth} / ₹{stats.targetRevenue}</span>
                    <span className="block text-lg font-black text-brutal-purple">{stats.targetProgress}%</span>
                  </div>
                </div>
                
                {/* Brutalist Outlined Progress bar */}
                <div className="w-full bg-[#f4f2ed] border-3 border-black rounded-lg h-7 overflow-hidden relative shadow-[2px_2px_0px_0px_#000000]">
                  <div 
                    style={{ width: `${stats.targetProgress}%` }}
                    className="bg-brutal-yellow h-full border-r-3 border-black transition-all duration-555"
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold uppercase text-black mix-blend-difference pointer-events-none">
                    {stats.targetProgress >= 100 ? '🎉 Goal Achieved!' : `${100 - stats.targetProgress}% to target`}
                  </span>
                </div>
              </div>

              {/* Popular Plan Distribution ratios */}
              <div className="neo-card p-6 bg-white shadow-[4px_4px_0px_0px_#000000]">
                <h3 className="text-lg font-black uppercase text-black mb-4 border-b-3 border-black pb-2">Plan Preferences Ratios</h3>
                
                {stats.planDistribution.length === 0 ? (
                  <p className="text-slate-650 text-xs font-bold">No plan purchase history available yet.</p>
                ) : (
                  <div className="space-y-3.5 pt-2">
                    {stats.planDistribution.map((dist, idx) => {
                      const totalMemberships = stats.planDistribution.reduce((acc, curr) => acc + curr.value, 0);
                      const ratio = totalMemberships > 0 ? Math.round((dist.value / totalMemberships) * 100) : 0;
                      
                      const colors = ['bg-brutal-cyan', 'bg-brutal-purple', 'bg-brutal-yellow', 'bg-brutal-orange'];
                      const colorClass = colors[idx % colors.length];

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-black uppercase">
                            <span className="truncate max-w-[200px]">{dist.name}</span>
                            <span>{dist.value} members ({ratio}%)</span>
                          </div>
                          <div className="w-full bg-[#f4f2ed] border-2 border-black rounded-md h-4 overflow-hidden relative">
                            <div 
                              style={{ width: `${ratio}%` }}
                              className={`${colorClass} h-full border-r-2 border-black`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Row 4: Growth Metrics Cards & Expiration risk info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Monthly Signups growth */}
              <div className="neo-card p-5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000]">
                <span className="block text-xs text-slate-500 font-black uppercase tracking-wider">MoM Signups</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-black">{stats.signupsThisMonth}</span>
                  <span className={`text-[10px] font-black border border-black px-1.5 py-0.5 rounded ${
                    stats.momGrowth >= 0 ? 'bg-brutal-green/20 text-emerald-800' : 'bg-brutal-red/20 text-red-800'
                  }`}>
                    {stats.momGrowth >= 0 ? `+${stats.momGrowth}%` : `${stats.momGrowth}%`}
                  </span>
                </div>
                <span className="block text-[10px] text-slate-650 font-bold mt-1.5 uppercase">vs. {stats.signupsLastMonth} last month</span>
              </div>

              {/* Revenue Growth */}
              <div className="neo-card p-5 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000]">
                <span className="block text-xs text-slate-500 font-black uppercase tracking-wider">Sales growth</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-black">₹{stats.revenueThisMonth}</span>
                  <span className={`text-[10px] font-black border border-black px-1.5 py-0.5 rounded ${
                    stats.revGrowth >= 0 ? 'bg-brutal-green/20 text-emerald-800' : 'bg-brutal-red/20 text-red-800'
                  }`}>
                    {stats.revGrowth >= 0 ? `+${stats.revGrowth}%` : `${stats.revGrowth}%`}
                  </span>
                </div>
                <span className="block text-[10px] text-slate-650 font-bold mt-1.5 uppercase">vs. ₹{stats.revenueLastMonth} last month</span>
              </div>

              {/* Expiry Risk Warning Box */}
              <div className={`neo-card p-5 border-3 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-center ${
                stats.expiringSoonCount > 0 ? 'bg-brutal-orange/15 text-black' : 'bg-white text-black'
              }`}>
                <span className="block text-xs text-slate-500 font-black uppercase tracking-wider">Passes Expiring Soon</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-black">{stats.expiringSoonCount}</span>
                  <span className="text-xs font-bold text-slate-650">Active members</span>
                </div>
                <span className="block text-[10px] text-slate-650 font-bold mt-1.5 uppercase">
                  {stats.expiringSoonCount > 0 ? '⚠️ Renewal nudge needed' : '✅ Good standing'}
                </span>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: MEMBERS DATABASE */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-5 h-5 stroke-[2.5]" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="neo-input block w-full !pl-10 !pr-3 py-2 text-sm"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_#000000] overflow-x-auto">
                {(['all', 'active', 'expired', 'pending'] as const).map((filter) => {
                  let label = '';
                  if (filter === 'all') label = 'All Members';
                  else if (filter === 'active') label = 'Active Members';
                  else if (filter === 'expired') label = 'Expired Members';
                  else if (filter === 'pending') label = 'Pending Approval';

                  return (
                    <button
                      key={filter}
                      onClick={() => setMemberFilter(filter)}
                      className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-tight transition cursor-pointer ${
                        memberFilter === filter 
                          ? 'bg-brutal-cyan border-2 border-black text-black' 
                          : 'text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Members List Table (Brutalist style) */}
            <div className="neo-card overflow-hidden bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-3 border-black bg-[#fafafa] text-black text-xs font-black uppercase tracking-wider">
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Name / Contact</th>
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Active Plan</th>
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Validity Expiry</th>
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Status</th>
                      <th className="p-4 sm:p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black text-sm">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center font-bold text-slate-500 text-xs sm:text-sm">
                          No gym members found matching the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => {
                        const expiryDate = member.expires_at ? new Date(member.expires_at) : null;
                        const formattedExpiry = expiryDate ? expiryDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A';

                        // Lookup plan details for this member
                        const memberMembership = memberships
                          .filter(ms => ms.member_id === member.id)
                          .sort((a, b) => new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime())[0];

                        const memberPlanName = memberMembership
                          ? plans.find(p => p.id === memberMembership.plan_id)?.name || 'Custom Plan'
                          : 'No Plan';
                        
                        return (
                          <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                            <td 
                              onClick={() => setShowMemberModal({ type: 'profile', member })}
                              className="p-4 sm:p-5 border-r-2 border-black/10 cursor-pointer hover:bg-slate-100 group/cell"
                            >
                              <div className="font-extrabold text-black uppercase group-hover/cell:underline flex items-center gap-1.5">
                                <span>{member.name}</span>
                                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/cell:opacity-100 transition-opacity text-slate-700" />
                              </div>
                              <div className="text-slate-700 text-xs font-mono font-bold">{member.phone}</div>
                            </td>
                            <td className="p-4 sm:p-5 border-r-2 border-black/10 font-bold text-xs uppercase text-slate-800">
                              {memberPlanName}
                            </td>
                            <td className="p-4 sm:p-5 border-r-2 border-black/10 font-mono text-xs font-bold text-slate-800">
                              {formattedExpiry}
                            </td>
                            <td className="p-4 sm:p-5 border-r-2 border-black/10">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded border-2 border-black text-[10px] sm:text-xs font-black uppercase ${
                                member.status === 'active' 
                                  ? 'bg-brutal-green text-black' 
                                  : member.status === 'expired'
                                  ? 'bg-brutal-red text-black'
                                  : 'bg-brutal-yellow text-black'
                              }`}>
                                {member.status === 'active' ? 'Active Member' : member.status === 'expired' ? 'Expired Member' : 'Pending Approval'}
                              </span>
                            </td>
                            <td className="p-4 sm:p-5 text-right space-x-1.5">
                              
                              <button
                                onClick={() => {
                                  setShowMemberModal({ type: 'extend', member });
                                  if (member.expires_at) {
                                    setExtendExpiryDate(member.expires_at.split('T')[0]);
                                  }
                                }}
                                className="neo-btn py-1 px-2.5 text-xs shadow-[2px_2px_0px_0px_#000000] border-2 bg-brutal-cyan cursor-pointer"
                              >
                                Extend Date
                              </button>

                              <button
                                onClick={() => {
                                  setShowMemberModal({ type: 'plan', member });
                                }}
                                className="neo-btn py-1 px-2.5 text-xs shadow-[2px_2px_0px_0px_#000000] border-2 bg-brutal-purple cursor-pointer"
                              >
                                Change Plan
                              </button>

                              {member.status === 'active' && (
                                <button
                                  onClick={() => handleMarkExpired(member)}
                                  className="neo-btn py-1 px-2.5 text-xs shadow-[2px_2px_0px_0px_#000000] border-2 bg-brutal-red cursor-pointer"
                                >
                                  Stop Pass
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1.5 border-2 border-black bg-white hover:bg-rose-50 text-black hover:text-red-500 rounded transition"
                                title="Delete Member"
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

          </div>
        )}

        {/* Tab 3: PAYMENT VERIFICATION QUEUE */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            
            <div className="neo-card overflow-hidden bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-3 border-black bg-[#fafafa] text-black text-xs font-black uppercase tracking-wider">
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Member Name</th>
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Transaction Proof</th>
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Amt Paid</th>
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Submitted</th>
                      <th className="p-4 sm:p-5 border-r-2 border-black/10">Status</th>
                      <th className="p-4 sm:p-5 text-right">Verify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black text-sm">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center font-bold text-slate-500 text-xs sm:text-sm">
                          No payment transactions recorded in the system.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => {
                        const paymentDate = new Date(p.created_at);
                        const formattedDate = paymentDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 sm:p-5 border-r-2 border-black/10">
                              <div className="font-extrabold text-black uppercase">{p.memberName}</div>
                              <div className="text-slate-700 text-xs font-mono font-bold">{p.phone}</div>
                            </td>
                            
                            <td className="p-4 sm:p-5 border-r-2 border-black/10">
                              <div className="flex items-center gap-2">
                                {p.utr ? (
                                  p.utr.startsWith('CASH') ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border-2 border-black text-xs font-black bg-brutal-yellow text-black uppercase shadow-[1.5px_1.5px_0px_0px_#000000]">
                                      💵 Cash
                                    </span>
                                  ) : (
                                    <div className="font-mono text-black font-extrabold text-xs bg-slate-100 border-2 border-black rounded px-2 py-0.5">
                                      {p.utr}
                                    </div>
                                  )
                                ) : (
                                  <span className="text-slate-500 text-xs italic">No UTR</span>
                                )}
                                
                                {p.screenshot_url && (
                                  <button
                                    onClick={() => setViewScreenshotUrl(p.screenshot_url)}
                                    className="text-xs text-brutal-orange font-black hover:underline cursor-pointer"
                                  >
                                    [View slip]
                                  </button>
                                )}
                              </div>
                            </td>
                            
                            <td className="p-4 sm:p-5 border-r-2 border-black/10 font-mono text-xs font-extrabold text-black">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </td>
                            
                            <td className="p-4 sm:p-5 border-r-2 border-black/10 text-slate-800 font-mono text-xs">
                              {formattedDate}
                            </td>
                            
                            <td className="p-4 sm:p-5 border-r-2 border-black/10">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded border-2 border-black text-[10px] sm:text-xs font-black uppercase ${
                                p.status === 'approved' 
                                  ? 'bg-brutal-green text-black' 
                                  : p.status === 'rejected'
                                  ? 'bg-brutal-red text-black'
                                  : 'bg-brutal-yellow text-black'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            
                            <td className="p-4 sm:p-5 text-right">
                              {p.status === 'pending' ? (
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => handleApprovePayment(p.id)}
                                    className="p-1.5 bg-brutal-green border-2 border-black hover:bg-emerald-600 rounded cursor-pointer transition shadow-[2px_2px_0px_0px_#000000]"
                                    title="Approve Member Access"
                                  >
                                    <Check className="w-4 h-4 text-black stroke-[3]" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(p.id)}
                                    className="p-1.5 bg-brutal-red border-2 border-black hover:bg-rose-600 rounded cursor-pointer transition shadow-[2px_2px_0px_0px_#000000]"
                                    title="Reject Payment"
                                  >
                                    <X className="w-4 h-4 text-black stroke-[3]" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs italic font-bold">Reviewed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: MEMBERSHIP PLANS */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            
            {/* Create Action */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowPlanModal(true)}
                className="neo-btn neo-btn-cyan shadow-[3px_3px_0px_0px_#000000]"
              >
                <Plus className="w-4 h-4 mr-2 stroke-[2.5]" />
                <span>Create Custom Plan</span>
              </button>
            </div>

            {/* Plans List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div 
                  key={p.id} 
                  className={`neo-card p-6 bg-white flex flex-col justify-between border-3 border-black shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden transition ${
                    p.is_active ? 'opacity-100' : 'opacity-60'
                  }`}
                >
                  {/* Solid accent banner */}
                  {p.is_active && (
                    <div className="absolute top-0 inset-x-0 h-2 bg-brutal-orange border-b-2 border-black"></div>
                  )}

                  <div className="pt-2">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h3 className="font-extrabold text-black text-lg uppercase tracking-tight truncate">{p.name}</h3>
                      <button
                        onClick={() => handleTogglePlan(p)}
                        className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded border-2 border-black transition cursor-pointer ${
                          p.is_active 
                            ? 'bg-brutal-green text-black' 
                            : 'bg-slate-200 text-slate-650'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <p className="text-slate-800 text-xs sm:text-sm font-semibold mb-6 line-clamp-2">{p.description || 'No description.'}</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t-2 border-black">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-700 font-extrabold uppercase">Price / Validity</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-black">₹{p.price.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-800 font-mono font-bold ml-1">/{p.duration_days}d</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between gap-2">
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        className="neo-btn text-xs py-2 bg-white hover:bg-rose-50 hover:text-red-500 border-2"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleTogglePlan(p)}
                        className="neo-btn neo-btn-cyan text-xs py-2 border-2"
                      >
                        {p.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tab 5: ONBOARDING QR CODE */}
        {activeTab === 'qr' && (
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <p className="text-slate-800 font-bold text-sm">
              Branded onboarding QR code. Display it at the counter for seamless membership access.
            </p>
            {gym && (
              <QRGenerator 
                value={joinLink} 
                gymName={gym.name} 
                gymSlug={gym.slug} 
              />
            )}
            <p className="text-xs text-slate-500 font-bold italic mt-4">
              Tip: Print this QR in large high contrast format, laminate it, and place it at your billing desk.
            </p>
          </div>
        )}

        {/* Tab 6: GYM PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto neo-card p-6 sm:p-8 bg-white shadow-[6px_6px_0px_0px_#000000]">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Gym Name */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Gym Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="neo-input block w-full text-sm"
                  />
                </div>

                {/* Gym Phone */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Contact Number</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="neo-input block w-full text-sm"
                  />
                </div>

                {/* Gym Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Address</label>
                  <input
                    type="text"
                    required
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="neo-input block w-full text-sm"
                  />
                </div>

                {/* Merchant UPI ID */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Merchant UPI ID (for billing)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. merchant@upi"
                    value={profileForm.upi_id}
                    onChange={(e) => setProfileForm({ ...profileForm, upi_id: e.target.value })}
                    className="neo-input block w-full text-sm font-mono text-brutal-orange"
                  />
                  <p className="mt-1.5 text-[10px] text-slate-650 font-bold">Payments will settle directly into this address.</p>
                </div>

                {/* Operating Hours */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Operating Hours</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05:00 AM - 10:00 PM"
                    value={profileForm.operating_hours}
                    onChange={(e) => setProfileForm({ ...profileForm, operating_hours: e.target.value })}
                    className="neo-input block w-full text-sm"
                  />
                </div>

                {/* Gym Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Gym Description</label>
                  <textarea
                    rows={3}
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="neo-input block w-full text-sm resize-none"
                  />
                </div>

                {/* Logo Image Upload */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Upload Gym Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="block w-full text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-3 file:border-black file:text-xs file:font-black file:bg-white file:text-black file:cursor-pointer hover:file:bg-slate-100 transition"
                  />
                  {profileForm.logo_url && (
                    <div className="mt-3 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={profileForm.logo_url} alt="Logo preview" className="w-12 h-12 border-2 border-black rounded object-cover bg-white" />
                      <button 
                        type="button" 
                        onClick={() => setProfileForm(prev => ({ ...prev, logo_url: null }))}
                        className="text-[10px] text-red-500 font-bold underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    </div>
                  )}
                </div>

                {/* UPI QR Code Image Upload */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Upload UPI QR Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'upi_qr')}
                    className="block w-full text-xs text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-3 file:border-black file:text-xs file:font-black file:bg-white file:text-black file:cursor-pointer hover:file:bg-slate-100 transition"
                  />
                  {profileForm.upi_qr_url && (
                    <div className="mt-3 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={profileForm.upi_qr_url} alt="UPI QR preview" className="w-12 h-12 border-2 border-black rounded object-contain bg-white p-0.5" />
                      <button 
                        type="button" 
                        onClick={() => setProfileForm(prev => ({ ...prev, upi_qr_url: null }))}
                        className="text-[10px] text-red-500 font-bold underline cursor-pointer"
                      >
                        Remove QR
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Submit */}
              <div className="pt-4 border-t-3 border-black flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="neo-btn neo-btn-orange text-white px-6 py-2.5 shadow-[3px_3px_0px_0px_#000000]"
                >
                  Save Profile Settings
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* PLAN CREATION MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4">
          <div className="neo-card w-full max-w-md p-8 bg-white border-3 border-black shadow-[8px_8px_0px_0px_#000000] relative">
            <button 
              onClick={() => setShowPlanModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 border-2 border-black rounded cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
            
            <h3 className="text-xl font-extrabold uppercase mb-6 border-b-3 border-black pb-2">Create Custom Plan</h3>
            
            <form onSubmit={handleCreatePlan} className="space-y-4">
              
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Cardio"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="neo-input block w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="1500"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="neo-input block w-full text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    placeholder="30"
                    value={planForm.duration_days}
                    onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                    className="neo-input block w-full text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  rows={2}
                  placeholder="Cardio floor access + steam..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="neo-input block w-full text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 neo-btn neo-btn-orange text-white py-3.5 px-4 font-black uppercase shadow-[3px_3px_0px_0px_#000000]"
              >
                Create Plan Options
              </button>

            </form>
          </div>
        </div>
      )}

      {/* MEMBER EXTEND / PLAN CHANGE MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4">
          <div className="neo-card w-full max-w-md p-8 bg-white border-3 border-black shadow-[8px_8px_0px_0px_#000000] relative">
            <button 
              onClick={() => {
                setShowMemberModal(null);
                setExtendExpiryDate('');
                setChangePlanId('');
              }}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 border-2 border-black rounded cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>

            {showMemberModal.type === 'profile' ? (
              <div className="space-y-6">
                
                {/* Header Profile Info */}
                <div className="flex items-center gap-4 border-b-3 border-black pb-4">
                  {/* Brutalist Avatar */}
                  <div className="w-16 h-16 rounded-xl bg-brutal-cyan border-3 border-black flex items-center justify-center text-black font-black text-2xl shadow-[3px_3px_0px_0px_#000000]">
                    {showMemberModal.member.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substr(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-extrabold uppercase text-black leading-tight truncate">
                      {showMemberModal.member.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                      {showMemberModal.member.phone}
                    </p>
                    {/* Status Badge */}
                    <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded border-2 border-black text-[10px] font-black uppercase ${
                      showMemberModal.member.status === 'active' 
                        ? 'bg-brutal-green text-black' 
                        : showMemberModal.member.status === 'expired'
                        ? 'bg-brutal-red text-black'
                        : 'bg-brutal-yellow text-black'
                    }`}>
                      {showMemberModal.member.status === 'active' ? 'Active Member' : showMemberModal.member.status === 'expired' ? 'Expired Member' : 'Pending Approval'}
                    </span>
                  </div>
                </div>

                {/* Gym Journey Stats */}
                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="p-3 bg-white border-2 border-black rounded-lg shadow-[2.5px_2.5px_0px_0px_#000000]">
                    <span className="block text-[10px] text-slate-500 font-black uppercase">First Joined</span>
                    <span className="block text-sm font-extrabold text-black font-mono mt-0.5">
                      {new Date(showMemberModal.member.joined_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="p-3 bg-white border-2 border-black rounded-lg shadow-[2.5px_2.5px_0px_0px_#000000]">
                    <span className="block text-[10px] text-slate-500 font-black uppercase">Gym Tenure</span>
                    <span className="block text-xs font-extrabold text-brutal-orange mt-0.5 truncate">
                      {(() => {
                        const joinedDate = new Date(showMemberModal.member.joined_at);
                        const diffMs = Date.now() - joinedDate.getTime();
                        const daysJoined = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                        return daysJoined === 0 ? 'Joined Today' : `${daysJoined} Day${daysJoined > 1 ? 's' : ''}`;
                      })()}
                    </span>
                  </div>

                  <div className="p-3 bg-white border-2 border-black rounded-lg shadow-[2.5px_2.5px_0px_0px_#000000]">
                    <span className="block text-[10px] text-slate-500 font-black uppercase">Current Plan</span>
                    <span className="block text-xs font-black text-black uppercase truncate mt-1">
                      {(() => {
                        const m = showMemberModal.member;
                        const memberMembership = memberships
                          .filter(ms => ms.member_id === m.id)
                          .sort((a, b) => new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime())[0];
                        return memberMembership
                          ? plans.find(p => p.id === memberMembership.plan_id)?.name || 'Custom Plan'
                          : 'No Plan';
                      })()}
                    </span>
                  </div>

                  <div className="p-3 bg-white border-2 border-black rounded-lg shadow-[2.5px_2.5px_0px_0px_#000000]">
                    <span className="block text-[10px] text-slate-500 font-black uppercase">Valid Until</span>
                    <span className="block text-sm font-extrabold text-black font-mono mt-0.5">
                      {showMemberModal.member.expires_at ? new Date(showMemberModal.member.expires_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>

                </div>

                {/* Billing Logs */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Payment Verification History</h4>
                  
                  {payments.filter(p => p.member_id === showMemberModal.member.id).length === 0 ? (
                    <p className="text-xs font-bold text-slate-700 bg-brutal-bg p-3 border-2 border-black rounded">No payment history recorded.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {payments
                        .filter(p => p.member_id === showMemberModal.member.id)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((p) => (
                          <div key={p.id} className="flex justify-between items-center p-3 border-2 border-black rounded bg-[#fafafa]">
                            <div>
                              <div className="text-xs font-black">₹{p.amount}</div>
                              <div className="text-[10px] text-slate-600 font-mono font-bold mt-0.5">
                                {p.utr.startsWith('CASH') ? 'CASH PAYMENT' : `UTR: ${p.utr}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded border border-black text-[9px] font-black uppercase ${
                                p.status === 'approved'
                                  ? 'bg-brutal-green/20 text-emerald-800'
                                  : p.status === 'rejected'
                                  ? 'bg-brutal-red/20 text-red-800'
                                  : 'bg-brutal-yellow/20 text-amber-800'
                              }`}>
                                {p.status}
                              </span>
                              <span className="block text-[8px] text-slate-500 font-mono font-bold mt-1">
                                {new Date(p.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Actions Shortcut */}
                <div className="flex gap-3.5 pt-4 border-t-2 border-dashed border-black mt-2">
                  <button
                    onClick={() => {
                      const member = showMemberModal.member;
                      setShowMemberModal({ type: 'plan', member });
                    }}
                    className="flex-1 py-2.5 bg-brutal-purple hover:bg-brutal-purple/90 border-2 border-black text-black rounded-lg text-xs font-black uppercase transition shadow-[2.5px_2.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={() => {
                      const member = showMemberModal.member;
                      setShowMemberModal({ type: 'extend', member });
                      if (member.expires_at) {
                        setExtendExpiryDate(member.expires_at.split('T')[0]);
                      }
                    }}
                    className="flex-1 py-2.5 bg-brutal-cyan hover:bg-brutal-cyan/90 border-2 border-black text-black rounded-lg text-xs font-black uppercase transition shadow-[2.5px_2.5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
                  >
                    Extend Date
                  </button>
                </div>

              </div>
            ) : (
              <>
                <h3 className="text-xl font-extrabold uppercase mb-1 border-b-3 border-black pb-2">
                  {showMemberModal.type === 'extend' ? 'Change Expiry Date' : 'Change Member Plan'}
                </h3>
                <p className="text-xs font-bold text-slate-700 mb-6">
                  Change membership options for <span className="text-brutal-orange font-black uppercase">{showMemberModal.member.name}</span>
                </p>

                {showMemberModal.type === 'extend' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Select New Expiry Date</label>
                      <input
                        type="date"
                        required
                        value={extendExpiryDate}
                        onChange={(e) => setExtendExpiryDate(e.target.value)}
                        className="neo-input block w-full text-sm font-mono font-bold"
                      />
                    </div>
                    <button
                      onClick={handleSaveMemberExtension}
                      className="w-full mt-4 neo-btn neo-btn-orange text-white py-3.5 px-4 font-black uppercase shadow-[3px_3px_0px_0px_#000000]"
                    >
                      Save Expiry Date
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Select Membership Plan</label>
                      <select
                        value={changePlanId}
                        onChange={(e) => setChangePlanId(e.target.value)}
                        className="neo-input block w-full text-sm bg-white font-bold cursor-pointer"
                      >
                        <option value="">-- Choose Plan --</option>
                        {plans.filter(p => p.is_active).map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price} / {p.duration_days} days)
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-[10px] text-slate-550 font-bold">
                        Changes start from today.
                      </p>
                    </div>
                    <button
                      onClick={handleSaveMemberPlanChange}
                      disabled={!changePlanId}
                      className="w-full mt-4 neo-btn neo-btn-orange text-white py-3.5 px-4 font-black uppercase shadow-[3px_3px_0px_0px_#000000] disabled:opacity-50"
                    >
                      Save Plan Change
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* VIEW PAYMENT SCREENSHOT SLIP MODAL */}
      {viewScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex justify-center items-center p-4">
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button 
              onClick={() => setViewScreenshotUrl(null)}
              className="absolute -top-12 right-0 p-2 bg-white border-3 border-black text-black rounded-full cursor-pointer hover:bg-slate-100 transition shadow-[2px_2px_0px_0px_#000000]"
              title="Close Image"
            >
              <X className="w-6 h-6 stroke-[3]" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={viewScreenshotUrl} 
              alt="Payment Transaction Slip" 
              className="max-h-[80vh] rounded-xl object-contain bg-white border-3 border-black p-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            />
            <p className="mt-4 text-xs font-bold text-white uppercase tracking-wider bg-black/50 px-3 py-1 rounded">Transaction Slip Proof</p>
          </div>
        </div>
      )}

    </div>
  );
}
