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

  // Step 1: send a one-time code to this email (works for both new and existing users).
  const requestOtp = async (email) => {
    return authApi.requestOtp({ email });
  };

  // Step 2: verify the code; on success the backend sets the auth cookie and returns the user.
  const verifyOtp = async (email, otp) => {
    const res = await authApi.verifyOtp({ email, otp });
    if (res.data) setUser(res.data);
    return res.data;
  };

  const resendOtp = async (email) => {
    return authApi.resendOtp({ email });
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
        requestOtp,
        verifyOtp,
        resendOtp,
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