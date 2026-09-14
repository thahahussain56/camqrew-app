import { supabase } from './supabaseClient';
import { User, UserRole } from '../types/auth';

export const authApi = {
  // Mobile OTP is natively supported by Supabase via OTP or we can mock it here if Twilio isn't set up
  sendOTP: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    const { error } = await supabase.auth.signInWithOtp({
      phone: '+91' + cleanedPhone,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      success: true,
      message: `OTP sent via Supabase to +91 ${cleanedPhone}.`,
    };
  },

  verifyOTP: async (phone: string, otp: string): Promise<{ token: string; user: User }> => {
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: '+91' + cleanedPhone,
      token: otp,
      type: 'sms',
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Invalid OTP code.');
    }

    // Fetch user profile from Supabase
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    return {
      token: data.session.access_token,
      user: {
        id: data.user?.id || '',
        name: userProfile?.name || 'User',
        email: userProfile?.email || '',
        phone: userProfile?.phone || `+91 ${cleanedPhone}`,
        role: (userProfile?.role as UserRole) || 'customer',
        avatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
        subscription_tier: userProfile?.subscription_tier || 'free',
        subscription_status: userProfile?.subscription_status || 'inactive',
        subscription_end_date: userProfile?.subscription_end_date,
        createdAt: userProfile?.created_at || new Date().toISOString(),
      },
    };
  },

  login: async (email: string, pass: string): Promise<{ token: string; user: User }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Invalid credentials');
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
       console.warn('Profile fetch error', profileError);
    }

    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        name: userProfile?.name || email.split('@')[0],
        email: email,
        phone: userProfile?.phone || '',
        role: (userProfile?.role as UserRole) || 'customer',
        avatar: userProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
        subscription_tier: userProfile?.subscription_tier || 'free',
        subscription_status: userProfile?.subscription_status || 'inactive',
        subscription_end_date: userProfile?.subscription_end_date,
        createdAt: userProfile?.created_at || new Date().toISOString(),
      },
    };
  },

  registerCustomer: async (data: { name: string; email: string; phone: string; password: string }): Promise<{ token: string; user: User }> => {
    // Check if phone already exists
    const { data: existingPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', data.phone)
      .single();
    if (existingPhone) {
      throw new Error('This phone number is already registered. Please Sign In instead.');
    }

    // 1. Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          role: 'customer'
        }
      }
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Registration failed.');
    }

    return {
      token: authData.session?.access_token || '',
      user: {
        id: authData.user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
        subscription_tier: 'free',
        subscription_status: 'inactive',
        createdAt: new Date().toISOString(),
      },
    };
  },

  registerProfessional: async (data: any): Promise<{ token: string; user: User }> => {
    // Check if phone already exists
    const { data: existingPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', data.phone)
      .single();
    if (existingPhone) {
      throw new Error('This phone number is already registered. Please Sign In instead.');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          role: 'professional'
        }
      }
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Pro Registration failed.');
    }

    // Create professional record
    await supabase.from('professional_profiles').insert([{
      id: authData.user.id,
      title: data.title,
      bio: data.bio,
      experience_years: data.experienceYears,
      state: data.state,
      district: data.district || data.city,
      city: data.city,
      rate_per_day: data.ratePerDay,
    }]);

    return {
      token: authData.session?.access_token || '',
      user: {
        id: authData.user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'professional',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
        subscription_tier: 'free',
        subscription_status: 'inactive',
        createdAt: new Date().toISOString(),
      },
    };
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, message: 'Password reset link sent to ' + email };
  },
};
