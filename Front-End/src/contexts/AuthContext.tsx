import React, { createContext, useContext, useState, ReactNode } from 'react';
import { dataService } from '@/services/dataService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  const login = async (email: string, name: string = 'User') => {
    setIsAuthenticated(true);
    setUser({ email, name });
    
    // Initialize user data in background
    try {
      await dataService.initializeUserData(email);
      console.log('User data initialized for:', email);
    } catch (error) {
      console.error('Failed to initialize user data:', error);
    }
  };

  const logout = () => {
    if (user?.email) {
      // Clear user cache on logout
      dataService.clearUserCache(user.email);
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};