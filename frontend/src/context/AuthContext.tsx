'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getToken, setToken, removeToken, getUser, setUser as saveUser } from '@/lib/auth';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
  cnic?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data.user);
          saveUser(response.data.user);
        } catch {
          removeToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Login attempt:', email);
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      const { token, user: userData } = response.data;
      setToken(token);
      saveUser(userData);
      setUser(userData);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    const { token, user: userData } = response.data;
    setToken(token);
    saveUser(userData);
    setUser(userData);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    saveUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
