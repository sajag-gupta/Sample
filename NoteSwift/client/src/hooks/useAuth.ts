import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return null;
      
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token is invalid, remove it
          localStorage.removeItem("auth_token");
          setToken(null);
          return null;
        }
        throw new Error("Failed to fetch user data");
      }

      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  const login = (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
  };

  // Check for token in URL (from Google OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    
    if (urlToken) {
      login(urlToken);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!token,
    token,
    login,
    logout,
    error,
  };
}
