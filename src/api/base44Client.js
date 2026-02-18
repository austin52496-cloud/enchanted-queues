import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Compatibility layer — makes old base44 calls work with Supabase
export const base44 = {
  auth: {
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return { ...user, email: user.email, full_name: user.user_metadata?.full_name };
    },
    logout: async (redirectUrl) => {
      await supabase.auth.signOut();
      window.location.href = redirectUrl || '/';
    },
    redirectToLogin: async (redirectUrl) => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl || window.location.href }
      });
    },
    updateMe: async (data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await supabase.from('user_profiles').update(data).eq('id', user.id);
      return { ...user, ...data };
    },
    deleteAccount: async () => {
      await supabase.auth.signOut();
    },
  },
  entities: {
    Park: {
      list: async () => { const { data } = await supabase.from('parks').select('*').eq('is_hidden', false); return data || []; },
      filter: async (filters) => { let q = supabase.from('parks').select('*'); Object.entries(filters).forEach(([k,v]) => q = q.eq(k,v)); const { data } = await q; return data || []; },
      update: async (id, updates) => { const { data } = await supabase.from('parks').update(updates).eq('id', id); return data; },
    },
    Ride: {
      list: async () => { const { data } = await supabase.from('rides').select('*'); return data || []; },
      filter: async (filters) => { let q = supabase.from('rides').select('*'); Object.entries(filters).forEach(([k,v]) => q = q.eq(k,v)); const { data } = await q; return data || []; },
      update: async (id, updates) => { const { data } = await supabase.from('rides').update(updates).eq('id', id); return data; },
    },
    Subscription: {
      list: async () => { const { data } = await supabase.from('subscriptions').select('*'); return data || []; },
      filter: async (filters) => { let q = supabase.from('subscriptions').select('*'); Object.entries(filters).forEach(([k,v]) => q = q.eq(k,v)); const { data } = await q; return data || []; },
      update: async (id, updates) => { const { data } = await supabase.from('subscriptions').update(updates).eq('id', id); return data; },
    },
    Favorite: {
      list: async () => { const { data } = await supabase.from('favorites').select('*'); return data || []; },
      filter: async (filters) => { let q = supabase.from('favorites').select('*'); Object.entries(filters).forEach(([k,v]) => q = q.eq(k,v)); const { data } = await q; return data || []; },
      create: async (obj) => { const { data } = await supabase.from('favorites').insert(obj).select().single(); return data; },
      update: async (id, updates) => { const { data } = await supabase.from('favorites').update(updates).eq('id', id); return data; },
      delete: async (id) => { await supabase.from('favorites').delete().eq('id', id); },
    },
    Notification: {
      filter: async (filters) => { let q = supabase.from('notifications').select('*'); Object.entries(filters).forEach(([k,v]) => q = q.eq(k,v)); const { data } = await q; return data || []; },
      update: async (id, updates) => { await supabase.from('notifications').update(updates).eq('id', id); },
      subscribe: () => () => {},
    },
    ParkHours: {
      list: async () => { const { data } = await supabase.from('park_hours').select('*'); return data || []; },
      filter: async (filters) => { let q = supabase.from('park_hours').select('*'); Object.entries(filters).forEach(([k,v]) => q = q.eq(k,v)); const { data } = await q; return data || []; },
    },
    WaitTimeHistory: {
      list: async (order, limit) => { const { data } = await supabase.from('wait_time_history').select('*').order('recorded_at', { ascending: false }).limit(limit || 500); return data || []; },
      filter: async (filters, order, limit) => { let q = supabase.from('wait_time_history').select('*'); Object.entries(filters).forEach(([k,v]) => q = q.eq(k,v)); q = q.order('recorded_at', { ascending: false }).limit(limit || 500); const { data } = await q; return data || []; },
    },
    SystemMessage: {
	list: async () => { const { data } = await supabase.from('system_messages').select('*').order('created_at', { ascending: false }); return { data: data || [] }; },
	create: async (obj) => { const { data } = await supabase.from('system_messages').insert(obj).select().single(); return { data }; },
	update: async (id, updates) => { const { data } = await supabase.from('system_messages').update(updates).eq('id', id).select().single(); return { data }; },
	delete: async (id) => { await supabase.from('system_messages').delete().eq('id', id); return { data: null }; },
},
    PricingConfig: {
      list: async () => { const { data } = await supabase.from('pricing_config').select('*'); return data || []; },
    },
    HomeTheme: {
      list: async () => { const { data } = await supabase.from('home_themes').select('*'); return data || []; },
      create: async (obj) => { const { data } = await supabase.from('home_themes').insert(obj).select().single(); return data; },
      update: async (id, updates) => { await supabase.from('home_themes').update(updates).eq('id', id); },
    },
    Resort: {
      list: async () => { const { data } = await supabase.from('resorts').select('*'); return data || []; },
      create: async (obj) => { const { data } = await supabase.from('resorts').insert(obj).select().single(); return data; },
      update: async (id, updates) => { await supabase.from('resorts').update(updates).eq('id', id); },
      delete: async (id) => { await supabase.from('resorts').delete().eq('id', id); },
    },
    NewsSource: {
      list: async () => { const { data } = await supabase.from('news_sources').select('*'); return data || []; },
      create: async (obj) => { const { data } = await supabase.from('news_sources').insert(obj).select().single(); return data; },
      update: async (id, updates) => { await supabase.from('news_sources').update(updates).eq('id', id); },
      delete: async (id) => { await supabase.from('news_sources').delete().eq('id', id); },
    },
    User: {
      list: async () => { const { data } = await supabase.from('user_profiles').select('*'); return data || []; },
    },
  },
 functions: {
    invoke: async (name, params) => {
      const functionMap = {
        'createCheckoutSession': '/api/create-checkout-session',
        'cancelSubscription': '/api/cancel-subscription',
      };
      
      const endpoint = functionMap[name];
      if (!endpoint) {
        console.log(`Function ${name} not implemented yet`);
        return { data: null };
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            userId: user?.id,
            userEmail: user?.email
          })
        });
        const data = await response.json();
        return { data };
      } catch (error) {
        console.error(`Function ${name} error:`, error);
        return { data: null, error };
      }
    },
  },
  appLogs: {
    logUserInApp: async () => {},
  },
};