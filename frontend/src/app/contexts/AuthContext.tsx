import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

type UserRole = 'MANAGER' | 'INSTRUCTOR' | 'STUDENT' | null;

interface User {
  id: string;
  email: string;
  nom: string; // Utilisé par le backend au lieu de 'name'
  role: UserRole;
  isActive?: boolean;
  /** true si l'utilisateur peut accéder à l'espace de cours (instructeur/manager, ou étudiant ayant payé). */
  hasActiveAccess?: boolean;
  activeAccesses?: string[];
  pendingAccesses?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, nom: string) => Promise<any>;
  logout: () => void;
  /** Rafraîchit la session (droits d'accès inclus) — à appeler après un paiement. */
  refreshSession: () => Promise<User | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Session stockée (affichage immédiat)
    const storedUser = localStorage.getItem('tower_user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
    }
    setIsLoading(false);

    // Puis on rafraîchit en arrière-plan (droits d'accès à jour après paiement, etc.)
    if (localStorage.getItem('tower_token')) {
      refreshSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySession = (u: User, token: string) => {
    setUser(u);
    localStorage.setItem('tower_user', JSON.stringify(u));
    localStorage.setItem('tower_token', token);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // Le backend retourne 'accessToken' (et non 'token')
      const { user, accessToken: token } = response.data;

      applySession(user, token);
      return { success: true, user };
    } catch (error: any) {
      if (error.response?.data?.requirePasswordChange) {
        return {
          requirePasswordChange: true,
          email: error.response.data.email
        };
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // Aucune réponse du serveur : backend arrêté, mauvaise URL d'API, ou CORS bloqué
      throw new Error(
        `Impossible de joindre le serveur (${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}). ` +
        'Vérifiez que le backend est démarré.'
      );
    }
  };

  const register = async (email: string, password: string, nom: string) => {
    try {
      await api.post('/auth/register', { email, password, nom });
      // Connexion automatique juste après l'inscription (le compte n'a AUCUN accès aux cours
      // tant qu'un paiement n'a pas été effectué / validé).
      const res = await login(email, password);
      return res;
    } catch (error: any) {
      if (error.response?.data?.message) throw new Error(error.response.data.message);
      throw error instanceof Error ? error : new Error("Erreur lors de l'inscription");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tower_user');
    localStorage.removeItem('tower_token');
  };

  const refreshSession = async (): Promise<User | null> => {
    try {
      const res = await api.post('/auth/refresh');
      const { user: u, accessToken } = res.data;
      if (u && accessToken) {
        applySession(u, accessToken);
        return u;
      }
    } catch {
      /* le refresh peut échouer si la session a expiré — on ne casse rien */
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshSession, isLoading }}>
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
