"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "@/lib/api";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (savedToken) {
          setToken(savedToken);

          try {
            // Verify the token
            await authService.verifyToken(savedToken);

            // Get user data
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (verifyError) {
            // Token is invalid, try refresh if available
            if (refreshToken) {
              try {
                const refreshResponse = await authService.refreshToken(
                  refreshToken
                );
                setToken(refreshResponse.access);

                // Get user data with new token
                const userData = await authService.getCurrentUser();
                setUser(userData);
              } catch (refreshError) {
                throw refreshError; // Failed to refresh, throw to clear auth
              }
            } else {
              throw verifyError; // No refresh token, throw to clear auth
            }
          }
        }
      } catch (error) {
        // Clear all auth if something goes wrong
        authService.logout();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password);
      // Token is set in authService.login
      setToken(response.access);

      const userData = await authService.getCurrentUser();
      setUser(userData);
      router.push("/dashboard");
    } catch (error) {
      setError("Invalid username or password");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const contextValue: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
