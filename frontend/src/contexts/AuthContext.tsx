import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, Profile, Company } from '../types';
import { mockProfiles, mockCompany } from '../services/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  company: Company | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error?: string }>;
  signUpCompany: (formData: {
    companyName: string;
    adminName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  switchMockRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to John Doe (Employee) or Mithilesh (Admin) for instant development preview
  const [profile, setProfile] = useState<Profile | null>(mockProfiles[1]); // John Doe (Employee)
  const [company, setCompany] = useState<Company | null>(mockCompany);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile from Supabase
            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (dbProfile) {
              setProfile(dbProfile as Profile);
              const { data: dbCompany } = await supabase
                .from('companies')
                .select('*')
                .eq('id', dbProfile.company_id)
                .single();
              if (dbCompany) setCompany(dbCompany as Company);
            }
          }
        } catch (err) {
          console.warn('Supabase session load error, falling back to mock state:', err);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // If identifier is an email
        const isEmail = identifier.includes('@');
        let emailToAuth = identifier;

        if (!isEmail) {
          // Lookup email by login_id
          const { data } = await supabase
            .from('profiles')
            .select('email')
            .eq('login_id', identifier.toUpperCase().trim())
            .single();
          if (!data?.email) {
            setIsLoading(false);
            return { error: 'Invalid Login ID. Please check and try again.' };
          }
          emailToAuth = data.email;
        }

        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: emailToAuth,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        if (authData.user) {
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          if (dbProfile) setProfile(dbProfile as Profile);
        }
        setIsLoading(false);
        return {};
      } else {
        // Mock sign-in logic
        const found = mockProfiles.find(
          (p) =>
            (p.email.toLowerCase() === identifier.toLowerCase().trim() ||
              p.login_id.toLowerCase() === identifier.toLowerCase().trim())
        );

        if (found) {
          setProfile(found);
          setIsLoading(false);
          return {};
        } else {
          // Allow login as Admin by default if admin typed
          if (identifier.toLowerCase().includes('admin')) {
            setProfile(mockProfiles[0]);
          } else {
            setProfile(mockProfiles[1]);
          }
          setIsLoading(false);
          return {};
        }
      }
    } catch {
      setIsLoading(false);
      return { error: 'Authentication failed. Please try again.' };
    }
  };

  const signUpCompany = async (formData: {
    companyName: string;
    adminName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              company_name: formData.companyName,
              full_name: formData.adminName,
              phone: formData.phone,
              role: 'admin',
            },
          },
        });
        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }
        if (authData.user) {
          // Wait for profile trigger or create profile
        }
        setIsLoading(false);
        return {};
      } else {
        // Mock sign-up creates new admin profile
        const newAdmin: Profile = {
          ...mockProfiles[0],
          id: `u-${Date.now()}`,
          first_name: formData.adminName.split(' ')[0] || 'Admin',
          last_name: formData.adminName.split(' ').slice(1).join(' ') || 'User',
          email: formData.email,
          phone: formData.phone,
          role: 'admin',
          login_id: 'OIADMI20260001',
        };
        const newComp: Company = {
          ...mockCompany,
          name: formData.companyName,
          email: formData.email,
          phone: formData.phone,
        };
        setProfile(newAdmin);
        setCompany(newComp);
        setIsLoading(false);
        return {};
      }
    } catch {
      setIsLoading(false);
      return { error: 'Sign up failed. Please try again.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setProfile(null);
  };

  const switchMockRole = (targetRole: UserRole) => {
    if (targetRole === 'admin') {
      setProfile(mockProfiles[0]); // Mithilesh (Admin)
    } else {
      setProfile(mockProfiles[1]); // John Doe (Employee)
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile ? { id: profile.id, email: profile.email } : null,
        profile,
        company,
        role: profile?.role || 'employee',
        isAuthenticated: Boolean(profile),
        isLoading,
        signIn,
        signUpCompany,
        signOut,
        switchMockRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
