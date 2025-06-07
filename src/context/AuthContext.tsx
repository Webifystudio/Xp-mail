
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface User extends FirebaseUser {
  username?: string | null;
}

export interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  error: AuthError | null | Error;
  registerUser: (usernameValue: string, emailValue: string, passwordValue: string) => Promise<void>;
  loginUser: (emailValue: string, passwordValue: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null | Error>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const enhancedUser: User = {
          ...firebaseUser,
          username: firebaseUser.displayName,
        };
        setUser(enhancedUser);
        setUsername(firebaseUser.displayName);
      } else {
        setUser(null);
        setUsername(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerUser = async (usernameValue: string, emailValue: string, passwordValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailValue, passwordValue);
      await updateProfile(userCredential.user, { displayName: usernameValue });
      // Re-fetch or update user state to include displayName
      const updatedUser: User = {
        ...userCredential.user,
        username: usernameValue,
      };
      setUser(updatedUser);
      setUsername(usernameValue);
      router.push('/');
    } catch (e) {
      setError(e as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (emailValue: string, passwordValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailValue, passwordValue);
      const loggedInUser: User = {
        ...userCredential.user,
        username: userCredential.user.displayName,
      };
      setUser(loggedInUser);
      setUsername(userCredential.user.displayName);
      router.push('/');
    } catch (e) {
      setError(e as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setUsername(null);
      router.push('/login');
    } catch (e) {
      setError(e as AuthError);
    } finally {
      setLoading(false);
    }
  };
  
  const contextValue: AuthContextType = {
    user,
    username,
    loading,
    error,
    registerUser,
    loginUser,
    logoutUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
