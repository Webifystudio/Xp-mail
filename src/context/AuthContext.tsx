
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile // Import updateProfile
} from 'firebase/auth';
import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase'; // Firebase auth instance
import { useRouter } from 'next/navigation';

// Extend FirebaseUser to include our custom username field (displayName)
export interface User extends FirebaseUser {
  username?: string | null; // Corresponds to displayName
}

// Define the shape of the authentication context
export interface AuthContextType {
  user: User | null;
  username: string | null; // Convenience accessor for displayName
  loading: boolean;
  error: AuthError | Error | null; // Allow general Error type
  registerUser: (usernameValue: string, emailValue: string, passwordValue: string) => Promise<void>;
  loginUser: (emailValue: string, passwordValue: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUserProfilePhoto: (photoURL: string) => Promise<void>; // New function
}

// Create the authentication context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const enhancedUser: User = {
          ...firebaseUser,
          // Ensure all properties of FirebaseUser are spread
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
          metadata: firebaseUser.metadata,
          providerData: firebaseUser.providerData,
          refreshToken: firebaseUser.refreshToken,
          tenantId: firebaseUser.tenantId,
          delete: firebaseUser.delete,
          getIdToken: firebaseUser.getIdToken,
          getIdTokenResult: firebaseUser.getIdTokenResult,
          reload: firebaseUser.reload,
          toJSON: firebaseUser.toJSON,
          // custom field
          username: firebaseUser.displayName, 
          photoURL: firebaseUser.photoURL, // Make sure photoURL is included
        };
        setUser(enhancedUser);
        setUsername(firebaseUser.displayName); // Set username from displayName
      } else {
        setUser(null);
        setUsername(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const registerUser = async (usernameValue: string, emailValue: string, passwordValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailValue, passwordValue);
      await updateProfile(userCredential.user, { displayName: usernameValue });
      // User state will be updated by onAuthStateChanged, which will pick up displayName
      // No need to manually set user here if onAuthStateChanged handles it
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
      await signInWithEmailAndPassword(auth, emailValue, passwordValue);
      // User state will be updated by onAuthStateChanged
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
      // User state will be set to null by onAuthStateChanged
      router.push('/login');
    } catch (e) {
      setError(e as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfilePhoto = async (photoURL: string) => {
    if (!auth.currentUser) {
      setError(new Error("No user logged in to update profile photo."));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateProfile(auth.currentUser, { photoURL });
      // onAuthStateChanged will pick up the change and update the user state
      // Force a reload of the user object in context if needed, or trust onAuthStateChanged
      if (user) {
         setUser(prevUser => prevUser ? {...prevUser, photoURL } : null);
      }
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
    updateUserProfilePhoto,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
