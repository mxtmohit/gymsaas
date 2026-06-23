// LocalStorage-based Mock Database for Gym Membership SaaS MVP

export interface Gym {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string;
  phone: string;
  upi_id: string;
  upi_qr_url: string | null;
  owner_id: string;
  description: string;
  operating_hours: string;
  created_at: string;
}

export interface Plan {
  id: string;
  gym_id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string;
  is_active: boolean;
}

export interface Member {
  id: string;
  gym_id: string;
  name: string;
  phone: string;
  joined_at: string;
  expires_at: string | null;
  status: 'active' | 'expired' | 'pending';
}

export interface Membership {
  id: string;
  member_id: string;
  plan_id: string;
  start_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'pending';
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  utr: string;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// Initial Mock Data
const MOCK_OWNER_ID = 'mock-owner-uuid-12345';

const DEFAULT_GYMS: Gym[] = [
  {
    id: 'gym-gold-bilaspur',
    name: "Gold's Gym Bilaspur",
    slug: 'gold-gym-bilaspur',
    logo_url: null, // will fall back to beautiful initials or SVG logo
    address: 'Vyapar Vihar Road, Near High Court, Bilaspur, Chhattisgarh - 495001',
    phone: '+91 98765 43210',
    upi_id: 'goldsgymbilaspur@upi',
    upi_qr_url: null,
    owner_id: MOCK_OWNER_ID,
    description: 'Premium fitness facility featuring world-class strength equipment, cardiovascular machines, personal trainers, and steam room facilities.',
    operating_hours: '05:00 AM - 10:00 PM (Mon-Sat), 06:00 AM - 12:00 PM (Sun)',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan-monthly',
    gym_id: 'gym-gold-bilaspur',
    name: 'Monthly Cardio + Strength',
    price: 1500,
    duration_days: 30,
    description: 'Access to Gym floor, cardio section and standard group classes.',
    is_active: true,
  },
  {
    id: 'plan-quarterly',
    gym_id: 'gym-gold-bilaspur',
    name: 'Quarterly Premium Plan',
    price: 4000,
    duration_days: 90,
    description: 'Save 11%! Includes 1 body composition scan and custom diet chart.',
    is_active: true,
  },
  {
    id: 'plan-half-yearly',
    gym_id: 'gym-gold-bilaspur',
    name: 'Half-Yearly Elite Plan',
    price: 7500,
    duration_days: 180,
    description: 'Save 17%! Includes 3 personal training sessions and lockers.',
    is_active: true,
  },
  {
    id: 'plan-yearly',
    gym_id: 'gym-gold-bilaspur',
    name: 'Yearly Ultimate Plan',
    price: 13500,
    duration_days: 365,
    description: 'Best Value! Full 1-year access, unlimited group classes, steam room, and 6 personal training sessions.',
    is_active: true,
  }
];

const now = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'member-rahul',
    gym_id: 'gym-gold-bilaspur',
    name: 'Rahul Sharma',
    phone: '+91 99887 76655',
    joined_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // expires in 5 days
    status: 'active'
  },
  {
    id: 'member-priya',
    gym_id: 'gym-gold-bilaspur',
    name: 'Priya Patel',
    phone: '+91 91234 56789',
    joined_at: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(), // expires in 45 days
    status: 'active'
  },
  {
    id: 'member-amit',
    gym_id: 'gym-gold-bilaspur',
    name: 'Amit Singh',
    phone: '+91 98989 89898',
    joined_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // expired 30 days ago
    status: 'expired'
  },
  {
    id: 'member-vikram',
    gym_id: 'gym-gold-bilaspur',
    name: 'Vikram Rathore',
    phone: '+91 88776 65544',
    joined_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending'
  }
];

const DEFAULT_MEMBERSHIPS: Membership[] = [
  {
    id: 'ms-rahul',
    member_id: 'member-rahul',
    plan_id: 'plan-monthly',
    start_date: formatDate(new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)),
    expiry_date: formatDate(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
    status: 'active'
  },
  {
    id: 'ms-priya',
    member_id: 'member-priya',
    plan_id: 'plan-quarterly',
    start_date: formatDate(new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)),
    expiry_date: formatDate(new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)),
    status: 'active'
  },
  {
    id: 'ms-amit',
    member_id: 'member-amit',
    plan_id: 'plan-monthly',
    start_date: formatDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)),
    expiry_date: formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
    status: 'expired'
  },
  {
    id: 'ms-vikram',
    member_id: 'member-vikram',
    plan_id: 'plan-monthly',
    start_date: formatDate(now),
    expiry_date: formatDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
    status: 'pending'
  }
];

const DEFAULT_PAYMENTS: Payment[] = [
  {
    id: 'pay-rahul',
    member_id: 'member-rahul',
    amount: 1500,
    utr: 'UTR887766551',
    screenshot_url: null,
    status: 'approved',
    created_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'pay-priya',
    member_id: 'member-priya',
    amount: 4000,
    utr: 'UTR998877223',
    screenshot_url: null,
    status: 'approved',
    created_at: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'pay-amit',
    member_id: 'member-amit',
    amount: 1500,
    utr: 'UTR554433221',
    screenshot_url: null,
    status: 'approved',
    created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'pay-vikram',
    member_id: 'member-vikram',
    amount: 1500,
    utr: 'UTR1122334455',
    screenshot_url: null,
    status: 'pending',
    created_at: now.toISOString()
  }
];

// LocalStorage Helper wrapper
const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading localStorage key ' + key, error);
    return defaultValue;
  }
};

const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting localStorage key ' + key, error);
  }
};

export const mockDb = {
  // DB initialization helper
  init: () => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem('gyms')) {
      setLocalStorageItem('gyms', DEFAULT_GYMS);
      setLocalStorageItem('plans', DEFAULT_PLANS);
      setLocalStorageItem('members', DEFAULT_MEMBERS);
      setLocalStorageItem('memberships', DEFAULT_MEMBERSHIPS);
      setLocalStorageItem('payments', DEFAULT_PAYMENTS);
    }
  },

  // Auth Operations
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const session = getLocalStorageItem<{ id: string; email: string } | null>('mock_session', null);
    if (!session && !window.localStorage.getItem('mock_session')) {
      // Auto log in with mock owner for initial convenience
      const defaultSession = { id: MOCK_OWNER_ID, email: 'owner@goldsgym.com' };
      setLocalStorageItem('mock_session', defaultSession);
      return defaultSession;
    }
    return session;
  },

  login: async (email: string): Promise<{ id: string; email: string }> => {
    // Find gym for this email (or default MOCK_OWNER_ID)
    let ownerId = MOCK_OWNER_ID;
    if (email !== 'owner@goldsgym.com') {
      ownerId = 'owner-' + email.replace(/[@.]/g, '-');
    }
    const session = { id: ownerId, email };
    setLocalStorageItem('mock_session', session);
    return session;
  },

  signUp: async (email: string, gymName: string, slug: string): Promise<{ id: string; email: string }> => {
    mockDb.init();
    const ownerId = 'owner-' + email.replace(/[@.]/g, '-');
    const session = { id: ownerId, email };
    setLocalStorageItem('mock_session', session);

    // Create a default gym
    const gyms = getLocalStorageItem<Gym[]>('gyms', []);
    const newGym: Gym = {
      id: 'gym-' + slug,
      name: gymName,
      slug: slug,
      logo_url: null,
      address: 'Enter Address Here',
      phone: 'Enter Contact Number',
      upi_id: 'upi@id',
      upi_qr_url: null,
      owner_id: ownerId,
      description: 'Welcome to ' + gymName,
      operating_hours: '06:00 AM - 10:00 PM',
      created_at: new Date().toISOString(),
    };
    gyms.push(newGym);
    setLocalStorageItem('gyms', gyms);

    // Add default plans for new gym
    const plans = getLocalStorageItem<Plan[]>('plans', []);
    const defaultPlansForNewGym: Plan[] = [
      {
        id: 'plan-monthly-' + slug,
        gym_id: newGym.id,
        name: 'Monthly Plan',
        price: 1500,
        duration_days: 30,
        description: 'Standard 1-month access.',
        is_active: true,
      },
      {
        id: 'plan-yearly-' + slug,
        gym_id: newGym.id,
        name: 'Yearly Plan',
        price: 12000,
        duration_days: 365,
        description: 'Standard 1-year access.',
        is_active: true,
      }
    ];

    // Filter out plans that already exist in localStorage to prevent duplicates
    const newPlans = defaultPlansForNewGym.filter(
      dp => !plans.some(p => p.id === dp.id)
    );
    setLocalStorageItem('plans', [...plans, ...newPlans]);

    return session;
  },

  logout: async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('mock_session');
  },

  // Gyms Operations
  getGymByOwner: (ownerId: string): Gym | null => {
    mockDb.init();
    const gyms = getLocalStorageItem<Gym[]>('gyms', []);
    return gyms.find(g => g.owner_id === ownerId) || null;
  },

  getGymBySlug: (slug: string): Gym | null => {
    mockDb.init();
    const gyms = getLocalStorageItem<Gym[]>('gyms', []);
    return gyms.find(g => g.slug === slug) || null;
  },

  getGymsList: (): Gym[] => {
    mockDb.init();
    return getLocalStorageItem<Gym[]>('gyms', []);
  },

  updateGym: (updatedGym: Gym): void => {
    mockDb.init();
    const gyms = getLocalStorageItem<Gym[]>('gyms', []);
    const idx = gyms.findIndex(g => g.id === updatedGym.id);
    if (idx !== -1) {
      gyms[idx] = updatedGym;
      setLocalStorageItem('gyms', gyms);
    }
  },

  deleteGym: (gymId: string): void => {
    mockDb.init();
    const gyms = getLocalStorageItem<Gym[]>('gyms', []);
    setLocalStorageItem('gyms', gyms.filter(g => g.id !== gymId));
  },

  // Plans Operations
  getPlansByGym: (gymId: string): Plan[] => {
    mockDb.init();
    const plans = getLocalStorageItem<Plan[]>('plans', []);
    const filtered = plans.filter(p => p.gym_id === gymId);
    
    // Deduplicate by ID to prevent warning on duplicate keys
    const seen = new Set<string>();
    return filtered.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  },

  savePlan: (plan: Plan): void => {
    mockDb.init();
    const plans = getLocalStorageItem<Plan[]>('plans', []);
    const idx = plans.findIndex(p => p.id === plan.id);
    if (idx !== -1) {
      plans[idx] = plan;
    } else {
      plans.push(plan);
    }
    setLocalStorageItem('plans', plans);
  },

  deletePlan: (planId: string): void => {
    mockDb.init();
    const plans = getLocalStorageItem<Plan[]>('plans', []);
    setLocalStorageItem('plans', plans.filter(p => p.id !== planId));
  },

  // Members Operations
  getMembersByGym: (gymId: string): Member[] => {
    mockDb.init();
    const members = getLocalStorageItem<Member[]>('members', []);
    return members.filter(m => m.gym_id === gymId);
  },

  getMemberById: (id: string): Member | null => {
    mockDb.init();
    const members = getLocalStorageItem<Member[]>('members', []);
    return members.find(m => m.id === id) || null;
  },

  saveMember: (member: Member): void => {
    mockDb.init();
    const members = getLocalStorageItem<Member[]>('members', []);
    const idx = members.findIndex(m => m.id === member.id);
    if (idx !== -1) {
      members[idx] = member;
    } else {
      members.push(member);
    }
    setLocalStorageItem('members', members);
  },

  deleteMember: (memberId: string): void => {
    mockDb.init();
    const members = getLocalStorageItem<Member[]>('members', []);
    const memberships = getLocalStorageItem<Membership[]>('memberships', []);
    const payments = getLocalStorageItem<Payment[]>('payments', []);

    setLocalStorageItem('members', members.filter(m => m.id !== memberId));
    setLocalStorageItem('memberships', memberships.filter(ms => ms.member_id !== memberId));
    setLocalStorageItem('payments', payments.filter(p => p.member_id !== memberId));
  },

  // Memberships Operations
  getMembershipsByMember: (memberId: string): Membership[] => {
    mockDb.init();
    const memberships = getLocalStorageItem<Membership[]>('memberships', []);
    return memberships.filter(ms => ms.member_id === memberId);
  },

  saveMembership: (membership: Membership): void => {
    mockDb.init();
    const memberships = getLocalStorageItem<Membership[]>('memberships', []);
    const idx = memberships.findIndex(ms => ms.id === membership.id);
    if (idx !== -1) {
      memberships[idx] = membership;
    } else {
      memberships.push(membership);
    }
    setLocalStorageItem('memberships', memberships);
  },

  // Payments Operations
  getPaymentsByMember: (memberId: string): Payment[] => {
    mockDb.init();
    const payments = getLocalStorageItem<Payment[]>('payments', []);
    return payments.filter(p => p.member_id === memberId);
  },

  getPaymentsByGym: (gymId: string): (Payment & { memberName: string; phone: string })[] => {
    mockDb.init();
    const payments = getLocalStorageItem<Payment[]>('payments', []);
    const members = getLocalStorageItem<Member[]>('members', []);
    const gymMembers = members.filter(m => m.gym_id === gymId);
    const gymMemberIds = gymMembers.map(m => m.id);

    return payments
      .filter(p => gymMemberIds.includes(p.member_id))
      .map(p => {
        const member = gymMembers.find(m => m.id === p.member_id)!;
        return {
          ...p,
          memberName: member?.name || 'Unknown Member',
          phone: member?.phone || 'N/A',
        };
      });
  },

  submitPayment: (payment: Payment): void => {
    mockDb.init();
    const payments = getLocalStorageItem<Payment[]>('payments', []);
    payments.push(payment);
    setLocalStorageItem('payments', payments);
  },

  updatePaymentStatus: (paymentId: string, status: 'approved' | 'rejected'): void => {
    mockDb.init();
    const payments = getLocalStorageItem<Payment[]>('payments', []);
    const idx = payments.findIndex(p => p.id === paymentId);
    if (idx !== -1) {
      payments[idx].status = status;
      setLocalStorageItem('payments', payments);

      // Handle Membership status side-effects
      const members = getLocalStorageItem<Member[]>('members', []);
      const memberships = getLocalStorageItem<Membership[]>('memberships', []);
      const payment = payments[idx];

      const memberIdx = members.findIndex(m => m.id === payment.member_id);
      if (memberIdx !== -1) {
        const member = members[memberIdx];

        if (status === 'approved') {
          // Find the member's pending memberships and approve them
          const memberMss = memberships.filter(ms => ms.member_id === member.id && ms.status === 'pending');
          const plans = getLocalStorageItem<Plan[]>('plans', []);
          
          if (memberMss.length > 0) {
            memberMss.forEach(ms => {
              const plan = plans.find(p => p.id === ms.plan_id);
              
              // Multiplier calculation (e.g. paid ₹3000 for ₹1500 plan = 2x duration)
              let multiplier = 1;
              if (plan && plan.price > 0) {
                multiplier = Math.max(1, Math.round(payment.amount / plan.price));
              }
              const durationDays = plan ? plan.duration_days * multiplier : 30 * multiplier;
              
              // Cumulative starting date (if already active, start from existing expiration)
              let start = new Date();
              if (member.status === 'active' && member.expires_at && new Date(member.expires_at).getTime() > Date.now()) {
                start = new Date(member.expires_at);
              }
              
              const expiry = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
              
              ms.status = 'active';
              ms.start_date = start.toISOString().split('T')[0];
              ms.expiry_date = expiry.toISOString().split('T')[0];
              
              member.status = 'active';
              member.expires_at = expiry.toISOString();
            });
          } else {
            // General status update if no pending membership record found
            member.status = 'active';
            const now = new Date();
            let start = now;
            if (member.expires_at && new Date(member.expires_at).getTime() > now.getTime()) {
              start = new Date(member.expires_at);
            }
            const expiry = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days
            member.expires_at = expiry.toISOString();
          }
        } else {
          // Rejected
          member.status = 'expired';
          const memberMss = memberships.filter(ms => ms.member_id === member.id && ms.status === 'pending');
          memberMss.forEach(ms => {
            ms.status = 'expired';
          });
        }
        
        setLocalStorageItem('members', members);
        setLocalStorageItem('memberships', memberships);
      }
    }
  }
};
