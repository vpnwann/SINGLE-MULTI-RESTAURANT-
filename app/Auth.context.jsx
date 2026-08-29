"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../app/authapi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ask the backend who (if anyone) the current cookie belongs to.
  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setUser(res.data);
    return res.data;
  };

  const register = async (name, email, password) => {
    return authApi.register({ name, email, password });
  };

  const verifyEmail = async (email, otp) => {
    const res = await authApi.verifyEmail({ email, otp });
    if (res.data) setUser(res.data);
    return res.data;
  };

  const resendVerification = async (email) => {
    return authApi.resendVerification({ email });
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        verifyEmail,
        resendVerification,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}