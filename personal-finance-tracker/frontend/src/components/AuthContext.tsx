import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "../api/finance";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

/**
 * AuthContext — global auth state using React Context API.
 * 
 * Pattern: Context + Provider wraps the app, any component can call
 * useAuth() to get auth state without prop drilling.
 * 
 * For larger apps, this would be replaced by Zustand or Redux Toolkit,
 * but Context is perfect for auth state at this scale.
 */
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Rehydrate auth state from localStorage on app load
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const login = async (email: string, password: string) => {
    const token = await apiLogin(email, password);
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await apiRegister({ email, password, full_name: fullName });
    await login(email, password); // Auto-login after register
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
