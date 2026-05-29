/**
 * context/AuthContext.tsx — Authentification connectée à l'API backend
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';

export type Role = 'patient' | 'usager' | 'medecin' | 'technicien' | 'admin';

export interface AuthUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  statut: string;
  photo_profil?: string;
  fullName: string; // compatibilité avec l'UI existante
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, mot_de_passe: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>; // Nouvelle méthode pour recharger l'utilisateur depuis l'API
  // Compatibilité avec l'ancien mock
  switchRole?: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(raw: any): AuthUser {
  return {
    ...raw,
    fullName: `${raw.prenom} ${raw.nom}`,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restaurer la session au chargement
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res: any = await authService.getMe();
          const normalized = normalizeUser(res?.data?.user || res?.data);
          setUser(normalized);
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, mot_de_passe: string): Promise<AuthUser> => {
    const res: any = await authService.login({ email, mot_de_passe });
    const { user: rawUser, accessToken, refreshToken } = res?.data || res;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const normalized = normalizeUser(rawUser);
    setUser(normalized);
    setIsAuthenticated(true);
    return normalized;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || undefined;
      await authService.logout(refreshToken);
    } catch {
      // Ignorer les erreurs de logout
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => prev ? { ...prev, ...data, fullName: `${data.prenom || prev.prenom} ${data.nom || prev.nom}` } : null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res: any = await authService.getMe();
      const normalized = normalizeUser(res?.data?.user || res?.data);
      setUser(normalized);
    } catch (error) {
      console.error('Erreur lors du rechargement de l\'utilisateur:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
