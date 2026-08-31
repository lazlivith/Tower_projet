import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

type UserRole = 'MANAGER' | 'INSTRUCTOR' | 'STUDENT' | null;

interface User {
  id: string;
  email: string;
  nom: string; // Utilisé par le backend au lieu de 'name'
  role: UserRole;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, nom: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('tower_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // Le backend retourne 'accessToken' (et non 'token')
      const { user, accessToken: token } = response.data;
      
      setUser(user);
      localStorage.setItem('tower_user', JSON.stringify(user));
      localStorage.setItem('tower_token', token);
      return { success: true };
    } catch (error: any) {
      if (error.response?.data?.requirePasswordChange) {
        return { 
          requirePasswordChange: true, 
          email: error.response.data.email 
        };
      }
      throw new Error(error.response?.data?.message || 'Erreur lors de la connexion');
    }
  };

  const register = async (email: string, password: string, nom: string) => {
    try {
      const response = await api.post('/auth/register', { email, password, nom });
      const { user } = response.data;
      
      // Après inscription, on peut soit connecter l'utilisateur automatiquement,
      // soit demander de se connecter. On choisit de ne pas le connecter si on n'a pas de token renvoyé.
      // Mais on peut au moins stocker l'info qu'il existe.
      // Pour être propre, on va simuler un auto-login ou l'obliger à repasser par login
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tower_user');
    localStorage.removeItem('tower_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
