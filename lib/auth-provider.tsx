"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthOptimized } from '@/hooks/use-auth-optimized';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshAuth: () => void;
  clearAuthCache: () => void;
  getCurrentSession: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthOptimized({
    enableCache: true,
    debounceTime: 300,
    enableBackgroundRefresh: true
  });

  // Log de debug para monitorar instância única
  useEffect(() => {
    console.log('🏗️ [AUTH-PROVIDER] Instância única do hook de autenticação criada');
    
    return () => {
      console.log('🔥 [AUTH-PROVIDER] Instância do hook de autenticação destruída');
    };
  }, []);

  // Log de mudanças de estado
  useEffect(() => {
    console.log('🔄 [AUTH-PROVIDER] Estado de autenticação atualizado:', {
      hasUser: !!auth.user,
      userId: auth.user?.id || 'N/A',
      isLoading: auth.loading,
      isInitialized: auth.initialized
    });
  }, [auth.user, auth.loading, auth.initialized]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. Wrap your app with <AuthProvider>');
  }
  
  return context;
}