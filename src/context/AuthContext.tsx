import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.ts";

interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "teacher";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.post("/auth/login", credentials);
    if (res.data.success) {
      localStorage.setItem("accessToken", res.data.accessToken);
      setUser(res.data.user);
    }
  };

  const register = async (data: any) => {
    const res = await api.post("/auth/register", data);
    if (res.data.success) {
      localStorage.setItem("accessToken", res.data.accessToken);
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
