'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email?: string, password?: string, provider?: 'google' | 'mock') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for mock session
    const storedUser = localStorage.getItem("mock_user");
    if (storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(storedUser));
    }

    // Listen to real Firebase Auth state
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const newUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "Google User",
            email: firebaseUser.email || "google@example.com",
          };
          setUser(newUser);
          localStorage.setItem("mock_user", JSON.stringify(newUser)); // Sync to local storage for persistence consistency
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const login = async (email?: string, password?: string, provider: 'google' | 'mock' = 'mock') => {
    if (provider === 'google' && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const newUser = {
           id: firebaseUser.uid,
           name: firebaseUser.displayName || "Google User",
           email: firebaseUser.email || "google@example.com",
        };
        setUser(newUser);
        localStorage.setItem("mock_user", JSON.stringify(newUser));
        router.push("/dashboard");
        return;
      } catch (error) {
        console.error("Google Sign In Error", error);
        alert("Google Sign In failed. Falling back to mock.");
      }
    }

    // Fallback Mock Login
    const mockUser: User = { 
      id: "123", 
      name: "Alex Doe", 
      email: email || "alex@example.com" 
    };
    setUser(mockUser);
    localStorage.setItem("mock_user", JSON.stringify(mockUser));
    
    // Check for redirect URL in query params (client-side only trick, or just push dashboard)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    router.push(redirectUrl || "/dashboard");
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    localStorage.removeItem("mock_user");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
