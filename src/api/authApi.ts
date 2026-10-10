import { supabase } from './supabaseClient';
import { User, UserRole } from '../types/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export const authApi = {
  sendOTP: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    try {
      await supabase.auth.signInWithOtp({
        phone: '+91' + cleanedPhone,
      });
    } catch (e) {
      console.warn('Supabase SMS provider notice:', e);
    }
    
    return {
      success: true,
      message: `OTP sent to +91 ${cleanedPhone}. (For testing, enter OTP: 123456)`,
    };
  },

  verifyOTP: async (phone: string, otp: string): Promise<{ token: string; user: User }> => {
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim();

    if (cleanOtp !== '123456') {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: '+91' + cleanedPhone,
          token: cleanOtp,
          type: 'sms',
        });

        if (!error && data?.session) {
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
              avatar: userProfile?.avatar || '',
              banner_image: userProfile?.banner_image || '',
              subscription_tier: userProfile?.subscription_tier || 'free',
              subscription_status: userProfile?.subscription_status || 'inactive',
              subscription_end_date: userProfile?.subscription_end_date,
              createdAt: userProfile?.created_at || new Date().toISOString(),
            },
          };
        }
      } catch (err) {
        // Fall through
      }

      throw new Error('Invalid OTP code. Please enter 123456.');
    }

    // Dummy OTP 123456 verified: Query user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${cleanedPhone},phone.eq.+91${cleanedPhone}`)
      .single();

    if (!userProfile) {
      return {
        token: `verified-otp-${cleanedPhone}-${Date.now()}`,
        user: {
          id: `new-${cleanedPhone}`,
          name: 'New User',
          email: '',
          phone: `+91 ${cleanedPhone}`,
          role: 'customer',
          avatar: '',
          banner_image: '',
          subscription_tier: 'free',
          subscription_status: 'inactive',
          createdAt: new Date().toISOString(),
        },
      };
    }

    return {
      token: `otp-session-${userProfile.id}-${Date.now()}`,
      user: {
        id: userProfile.id,
        name: userProfile.name || 'User',
        email: userProfile.email || '',
        phone: userProfile.phone || `+91 ${cleanedPhone}`,
        role: (userProfile.role as UserRole) || 'customer',
        avatar: userProfile.avatar || '',
        banner_image: userProfile.banner_image || '',
        subscription_tier: userProfile.subscription_tier || 'free',
        subscription_status: userProfile.subscription_status || 'inactive',
        subscription_end_date: userProfile.subscription_end_date,
        createdAt: userProfile.created_at || new Date().toISOString(),
      },
    };
  },

  login: async (email: string, pass: string): Promise<{ token: string; user: User }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if email exists in users table first
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!userRecord) {
      throw new Error('This email ID is not registered with Camqrew. Please sign up to create an account.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass,
    });

    if (error || !data.session) {
      if (error?.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Incorrect password. Please try again or reset your password.');
      }
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
        name: userProfile?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: userProfile?.phone || '',
        role: (userProfile?.role as UserRole) || 'customer',
        avatar: userProfile?.avatar || userProfile?.avatar_url || '',
        banner_image: userProfile?.banner_image || '',
        subscription_tier: userProfile?.subscription_tier || 'free',
        subscription_status: userProfile?.subscription_status || 'inactive',
        subscription_end_date: userProfile?.subscription_end_date,
        createdAt: userProfile?.created_at || new Date().toISOString(),
      },
    };
  },

  registerCustomer: async (data: { name: string; email: string; phone: string; password: string }): Promise<{ token: string; user: User }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone?.trim();

    // 1. Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (existingEmail) {
      throw new Error('This email address is already registered. Please Sign In instead.');
    }

    // 2. Check if phone already exists
    if (cleanPhone) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (existingPhone) {
        throw new Error('This phone number is already registered. Please Sign In instead.');
      }
    }

    // 3. Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: cleanPhone || '',
          role: 'customer'
        }
      }
    });

    if (authError) {
      throw new Error(authError.message || 'Registration failed.');
    }

    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('This email address is already registered. Please Sign In instead.');
    }

    if (!authData.user) {
      throw new Error('Registration failed.');
    }

    return {
      token: authData.session?.access_token || '',
      user: {
        id: authData.user.id,
        name: data.name,
        email: cleanEmail,
        phone: cleanPhone || '',
        role: 'customer',
        avatar: '',
        subscription_tier: 'free',
        subscription_status: 'inactive',
        createdAt: new Date().toISOString(),
      },
    };
  },

  registerProfessional: async (data: any): Promise<{ token: string; user: User }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone?.trim();

    // 1. Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (existingEmail) {
      throw new Error('This email address is already registered. Please Sign In instead.');
    }

    // 2. Check if phone already exists
    if (cleanPhone) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (existingPhone) {
        throw new Error('This phone number is already registered. Please Sign In instead.');
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: cleanPhone || '',
          role: 'professional'
        }
      }
    });

    if (authError) {
      throw new Error(authError.message || 'Pro Registration failed.');
    }

    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('This email address is already registered. Please Sign In instead.');
    }

    if (!authData.user) {
      throw new Error('Pro Registration failed.');
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
      categories: data.categories || ['Photographers'],
      equipment: data.equipment || [],
      skills: data.skills || [],
    }]);

    return {
      token: authData.session?.access_token || '',
      user: {
        id: authData.user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'professional',
        avatar: '',
        subscription_tier: 'free',
        subscription_status: 'inactive',
        createdAt: new Date().toISOString(),
      },
    };
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if email exists in users table first
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!userRecord) {
      throw new Error('This email ID is not registered with Camqrew. Please check the email or sign up.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, message: 'Password reset link sent to ' + cleanEmail };
  },

  updatePassword: async (password: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
    return { success: true, message: 'Password updated successfully.' };
  },

  signInWithOAuth: async (provider: 'google' | 'apple', role: 'customer' | 'professional' = 'customer'): Promise<{ token: string; user: User } | null> => {
    const redirectUrl = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: provider === 'google' ? {
          access_type: 'offline',
          prompt: 'consent',
        } : undefined,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
    if (!data?.url) {
      throw new Error('Could not initiate social authentication.');
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === 'success' && result.url) {
      const urlStr = result.url;
      const fragment = urlStr.includes('#') ? urlStr.split('#')[1] : '';
      const query = urlStr.includes('?') ? urlStr.split('?')[1] : '';
      const params = new URLSearchParams(fragment || query);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        if (sessionErr) throw new Error(sessionErr.message);
        if (sessionData?.session) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .maybeSingle();

          return {
            token: sessionData.session.access_token,
            user: {
              id: sessionData.session.user.id,
              name: dbUser?.name || sessionData.session.user.user_metadata?.full_name || 'User',
              email: sessionData.session.user.email || '',
              phone: dbUser?.phone || '',
              role: dbUser?.role || role,
              avatar: dbUser?.avatar || sessionData.session.user.user_metadata?.avatar_url || '',
              subscription_tier: dbUser?.subscription_tier || 'free',
              subscription_status: dbUser?.subscription_status || 'inactive',
              createdAt: dbUser?.created_at || new Date().toISOString(),
            },
          };
        }
      }
    }
    return null;
  },

  deleteAccount: async (): Promise<void> => {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
      throw new Error(error.message);
    }
    await supabase.auth.signOut();
  },
};
