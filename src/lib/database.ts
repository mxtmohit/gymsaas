import { createClient } from '@supabase/supabase-js';
import { mockDb, Gym, Plan, Member, Membership, Payment } from './mockDb';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Determine if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const db = {
  // Auth Operations
  getCurrentUser: async () => {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      return user ? { id: user.id, email: user.email! } : null;
    }
    return mockDb.getCurrentUser();
  },

  login: async (email: string, password?: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'default-password-123',
      });
      if (error) throw error;
      return { id: data.user!.id, email: data.user!.email! };
    }
    return mockDb.login(email);
  },

  signUp: async (email: string, gymName: string, slug: string, password?: string) => {
    if (supabase) {
      const pswd = password || 'default-password-123';
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pswd,
      });
      if (error) throw error;
      const user = data.user!;

      // Create Gym record
      const newGym: Omit<Gym, 'id' | 'created_at'> = {
        name: gymName,
        slug: slug,
        logo_url: null,
        address: 'Enter Gym Address',
        phone: 'Enter Contact Number',
        upi_id: 'merchant@upi',
        upi_qr_url: null,
        owner_id: user.id,
        description: `Welcome to ${gymName}!`,
        operating_hours: '06:00 AM - 10:00 PM',
      };

      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert(newGym)
        .select()
        .single();

      if (gymError) throw gymError;

      // Create default plans for new gym
      const defaultPlans = [
        {
          gym_id: gymData.id,
          name: 'Monthly Plan',
          price: 1500,
          duration_days: 30,
          description: 'Standard 1-month access.',
          is_active: true,
        },
        {
          gym_id: gymData.id,
          name: 'Yearly Plan',
          price: 12000,
          duration_days: 365,
          description: 'Standard 1-year access.',
          is_active: true,
        }
      ];

      const { error: plansError } = await supabase
        .from('plans')
        .insert(defaultPlans);

      if (plansError) throw plansError;

      return { id: user.id, email: user.email! };
    }

    return mockDb.signUp(email, gymName, slug);
  },

  logout: async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return;
    }
    return mockDb.logout();
  },

  // Gyms Operations
  getGymByOwner: async (ownerId: string): Promise<Gym | null> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    return mockDb.getGymByOwner(ownerId);
  },

  getGymBySlug: async (slug: string): Promise<Gym | null> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    return mockDb.getGymBySlug(slug);
  },

  getGymsList: async (): Promise<Gym[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
    return mockDb.getGymsList();
  },

  updateGym: async (gym: Gym): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('gyms')
        .update({
          name: gym.name,
          slug: gym.slug,
          logo_url: gym.logo_url,
          address: gym.address,
          phone: gym.phone,
          upi_id: gym.upi_id,
          upi_qr_url: gym.upi_qr_url,
          description: gym.description,
          operating_hours: gym.operating_hours
        })
        .eq('id', gym.id);
      if (error) throw error;
      return;
    }
    return mockDb.updateGym(gym);
  },

  deleteGym: async (gymId: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('gyms')
        .delete()
        .eq('id', gymId);
      if (error) throw error;
      return;
    }
    return mockDb.deleteGym(gymId);
  },

  // Plans Operations
  getPlansByGym: async (gymId: string): Promise<Plan[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('gym_id', gymId)
        .order('price', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return mockDb.getPlansByGym(gymId);
  },

  savePlan: async (plan: Plan): Promise<void> => {
    if (supabase) {
      const planData = {
        gym_id: plan.gym_id,
        name: plan.name,
        price: plan.price,
        duration_days: plan.duration_days,
        description: plan.description,
        is_active: plan.is_active,
      };

      if (plan.id.startsWith('temp-') || plan.id.length < 10) {
        // New Plan
        const { error } = await supabase.from('plans').insert(planData);
        if (error) throw error;
      } else {
        // Update Plan
        const { error } = await supabase.from('plans').update(planData).eq('id', plan.id);
        if (error) throw error;
      }
      return;
    }
    return mockDb.savePlan(plan);
  },

  deletePlan: async (planId: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
      return;
    }
    return mockDb.deletePlan(planId);
  },

  // Members Operations
  getMembersByGym: async (gymId: string): Promise<Member[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('gym_id', gymId)
        .order('name');
      if (error) throw error;
      return data || [];
    }
    return mockDb.getMembersByGym(gymId);
  },

  getMemberById: async (id: string): Promise<Member | null> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    return mockDb.getMemberById(id);
  },

  saveMember: async (member: Member): Promise<void> => {
    if (supabase) {
      const memberData = {
        gym_id: member.gym_id,
        name: member.name,
        phone: member.phone,
        joined_at: member.joined_at,
        expires_at: member.expires_at,
        status: member.status,
      };

      if (member.id.startsWith('temp-') || member.id.length < 10) {
        const { error } = await supabase.from('members').insert(memberData);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('members').update(memberData).eq('id', member.id);
        if (error) throw error;
      }
      return;
    }
    return mockDb.saveMember(member);
  },

  deleteMember: async (memberId: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      return;
    }
    return mockDb.deleteMember(memberId);
  },

  // Memberships Operations
  getMembershipsByMember: async (memberId: string): Promise<Membership[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('member_id', memberId)
        .order('expiry_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return mockDb.getMembershipsByMember(memberId);
  },

  saveMembership: async (membership: Membership): Promise<void> => {
    if (supabase) {
      const membershipData = {
        member_id: membership.member_id,
        plan_id: membership.plan_id,
        start_date: membership.start_date,
        expiry_date: membership.expiry_date,
        status: membership.status,
      };

      if (membership.id.startsWith('temp-') || membership.id.length < 10) {
        const { error } = await supabase.from('memberships').insert(membershipData);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('memberships').update(membershipData).eq('id', membership.id);
        if (error) throw error;
      }
      return;
    }
    return mockDb.saveMembership(membership);
  },

  // Payments Operations
  getPaymentsByGym: async (gymId: string): Promise<(Payment & { memberName: string; phone: string })[]> => {
    if (supabase) {
      // Perform join
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members!inner (
            name,
            phone,
            gym_id
          )
        `)
        .eq('members.gym_id', gymId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        member_id: p.member_id,
        amount: p.amount,
        utr: p.utr,
        screenshot_url: p.screenshot_url,
        status: p.status,
        created_at: p.created_at,
        memberName: p.members.name,
        phone: p.members.phone,
      }));
    }
    return mockDb.getPaymentsByGym(gymId);
  },

  submitPayment: async (payment: Payment): Promise<void> => {
    if (supabase) {
      const paymentData = {
        member_id: payment.member_id,
        amount: payment.amount,
        utr: payment.utr,
        screenshot_url: payment.screenshot_url,
        status: payment.status,
      };
      const { error } = await supabase.from('payments').insert(paymentData);
      if (error) throw error;
      return;
    }
    return mockDb.submitPayment(payment);
  },

  updatePaymentStatus: async (paymentId: string, status: 'approved' | 'rejected'): Promise<void> => {
    if (supabase) {
      // Fetch payment to get details
      const { data: payment, error: fetchErr } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      if (fetchErr) throw fetchErr;

      // Update payment
      const { error: payErr } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', paymentId);
      if (payErr) throw payErr;

      // Handle status side-effects in Supabase
      if (status === 'approved') {
        // Fetch member
        const { data: member, error: memErr } = await supabase
          .from('members')
          .select('*')
          .eq('id', payment.member_id)
          .single();
        if (memErr) throw memErr;

        // Approve pending memberships
        const { data: memberships, error: msErr } = await supabase
          .from('memberships')
          .select('*')
          .eq('member_id', payment.member_id)
          .eq('status', 'pending');
        if (msErr) throw msErr;

        if (memberships && memberships.length > 0) {
          for (const ms of memberships) {
            // Fetch plan details
            const { data: plan } = await supabase
              .from('plans')
              .select('*')
              .eq('id', ms.plan_id)
              .maybeSingle();

            // Multiplier calculation
            let multiplier = 1;
            if (plan && plan.price > 0) {
              multiplier = Math.max(1, Math.round(payment.amount / plan.price));
            }
            const durationDays = plan ? plan.duration_days * multiplier : 30 * multiplier;

            // Cumulative start date logic
            let start = new Date();
            if (member.status === 'active' && member.expires_at && new Date(member.expires_at).getTime() > Date.now()) {
              start = new Date(member.expires_at);
            }
            const expiry = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

            await supabase
              .from('memberships')
              .update({ 
                status: 'active',
                start_date: start.toISOString().split('T')[0],
                expiry_date: expiry.toISOString().split('T')[0]
              })
              .eq('id', ms.id);

            await supabase
              .from('members')
              .update({
                status: 'active',
                expires_at: expiry.toISOString()
              })
              .eq('id', payment.member_id);
          }
        } else {
          // General status update
          let start = new Date();
          if (member.expires_at && new Date(member.expires_at).getTime() > Date.now()) {
            start = new Date(member.expires_at);
          }
          const expiry = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
          await supabase.from('members').update({
            status: 'active',
            expires_at: expiry.toISOString()
          }).eq('id', payment.member_id);
        }
      } else {
        // Rejected
        await supabase.from('members').update({ status: 'expired' }).eq('id', payment.member_id);
        await supabase.from('memberships').update({ status: 'expired' }).eq('member_id', payment.member_id).eq('status', 'pending');
      }

      return;
    }
    return mockDb.updatePaymentStatus(paymentId, status);
  }
};
