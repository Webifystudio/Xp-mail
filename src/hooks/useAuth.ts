"use client";

import { useContext } from 'react';
// Adjust the import path if AuthContext is in a different location
// For example, if AuthContext is in 'src/context/AuthContext.tsx'
// and this file is in 'src/hooks/useAuth.ts'
import { AuthContext } from '@/context/AuthContext'; 
import type { AuthContextType } from '@/context/AuthContext'; // Ensure this type is exported from AuthContext.tsx

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
