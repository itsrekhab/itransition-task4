import {
  useState,
  useEffect,
  type ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router";
import { setLogoutFn } from "../utils/api.ts"; // Import fetchWithAuth
import { AuthContext, type User } from "./useAuth.ts";

interface AuthStatusProviderProps {
  children: ReactNode;
}

export function AuthStatusProvider({ children }: AuthStatusProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetchWithAuth(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed on server:", error);
    } finally {
      setUser(null);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/auth/check`,
          {
            credentials: "include",
          },
        );
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null);
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to check auth status:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
    setLogoutFn(logout);
  }, [navigate, logout]);

  const isAuthenticated = !!user;

  const fetchWithAuth = async (
    url: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    options.credentials = "include";

    let response = await fetch(url, options);

    if (response.status === 401 && !url.includes("/auth/refresh")) {
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (refreshResponse.ok) {
        response = await fetch(url, options);
      } else {
        setUser(null);
        throw new Response("Unauthorized: Refresh token expired or invalid", {
          status: 401,
        });
      }
    }

    return response;
  };

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      login,
      logout,
      fetchWithAuth,
      isLoading,
    }),
    [user, isAuthenticated, login, logout, isLoading],
  );

  return <AuthContext value={contextValue}>{children}</AuthContext>;
}
