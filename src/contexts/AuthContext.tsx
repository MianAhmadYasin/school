import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { mockSignIn, mockSignOut, type MockUser } from '../lib/mockAuth';

export type UserRole = 'admin' | 'teacher' | 'student' | 'manager' | 'parent' | 'accountant' | 'librarian';

export type Permission = 
  | 'manage_users'
  | 'manage_students'
  | 'manage_teachers'
  | 'manage_finances'
  | 'manage_attendance'
  | 'manage_grades'
  | 'manage_inventory'
  | 'view_reports'
  | 'manage_curriculum'
  | 'manage_exams'
  | 'manage_library';

interface UserProfile {
  id: string;
  role: UserRole;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  designation?: string;
  joining_date?: string;
  permissions?: Permission[];
}

interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isManager: boolean;
  isParent: boolean;
  isAccountant: boolean;
  isLibrarian: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [useMockAuth, setUseMockAuth] = useState(false);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase not configured, using mock authentication');
      setUseMockAuth(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('Profile query result:', { data, error });

      if (error) {
        console.error('Profile query error:', error);
        throw error;
      }

      if (!data) {
        console.warn('No profile found for user:', userId);
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (useMockAuth) {
        const { user: mockUser, error } = await mockSignIn(email, password);
        if (error) {
          return { error: new Error(error) };
        }
        if (mockUser) {
          setUser({ id: mockUser.id, email: mockUser.email } as User);
          setProfile(mockUser as UserProfile);
        }
        return { error: null };
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error };
      }
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (useMockAuth) {
      await mockSignOut();
      setUser(null);
      setProfile(null);
    } else {
      await supabase.auth.signOut();
      setProfile(null);
    }
  };

  const createUser = async (data: CreateUserData) => {
    // Check if user has admin permission
    if (profile?.role !== 'admin') {
      throw new Error('Only administrators can create new users');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        phone: data.phone || null,
        role: data.role,
      });

    if (profileError) {
      // If profile creation fails, attempt to delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('id', user.id);

    if (error) throw error;
    await loadProfile(user.id);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;

    const defaultPermissions: Record<UserRole, Permission[]> = {
      admin: ['manage_users', 'manage_students', 'manage_teachers', 'manage_finances', 'manage_attendance', 'manage_grades', 'manage_inventory', 'view_reports', 'manage_curriculum', 'manage_exams', 'manage_library'],
      teacher: ['manage_grades', 'manage_attendance', 'view_reports', 'manage_curriculum'],
      student: ['view_reports'],
      manager: ['manage_inventory', 'view_reports'],
      parent: ['view_reports'],
      accountant: ['manage_finances', 'view_reports'],
      librarian: ['manage_library', 'view_reports']
    };

    return profile.permissions?.includes(permission) || 
           defaultPermissions[profile.role]?.includes(permission) || 
           false;
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    createUser,
    updateProfile,
    hasPermission,
    isAdmin: profile?.role === 'admin',
    isTeacher: profile?.role === 'teacher',
    isStudent: profile?.role === 'student',
    isManager: profile?.role === 'manager',
    isParent: profile?.role === 'parent',
    isAccountant: profile?.role === 'accountant',
    isLibrarian: profile?.role === 'librarian',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
