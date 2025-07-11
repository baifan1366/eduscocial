import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isAuthenticated = status === "authenticated" && !!session;
  const isLoading = status === "loading";

  // Login with credentials
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
        return false;
      }

      return true;
    } catch (error) {
      setError("An unexpected error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn("google", { callbackUrl: "/" });
      return true;
    } catch (error) {
      setError("Failed to sign in with Google");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register a new user
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    username?: string;
    university?: string;
    studyField?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return false;
      }

      // Auto-login after registration
      return await login(userData.email, userData.password);
    } catch (error) {
      setError("An unexpected error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout the user
  const logout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Check if an email is educational
  const checkEducationalEmail = async (email: string) => {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data.isEducational === true;
    } catch (error) {
      return false;
    }
  };

  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    error,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    checkEducationalEmail,
  };
} 