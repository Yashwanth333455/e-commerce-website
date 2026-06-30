// ─── AuthContext.jsx — Clerk-based Auth (replaces Firebase Auth) ─────────────
// This context bridges the old useAuth() API to Clerk so existing components
// that call openSignIn / openSignUp / signOut / user still work unchanged.
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { openSignIn, openSignUp, signOut: clerkSignOut } = useClerk();

  // Modal state — kept for compatibility with any legacy code that reads it
  const [isAuthOpen,  setIsAuthOpen]  = useState(false);
  const [authMode,    setAuthMode]    = useState('signin');

  // Build a normalised user object that matches the old Firebase user shape
  const user = isSignedIn && clerkUser
    ? {
        uid:      clerkUser.id,
        name:     clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
        email:    clerkUser.primaryEmailAddress?.emailAddress || null,
        phone:    clerkUser.primaryPhoneNumber?.phoneNumber || null,
        photoURL: clerkUser.imageUrl || null,
      }
    : null;

  useEffect(() => {
    if (!isSignedIn || !clerkUser) return;
    
    async function syncLoginToDB() {
      try {
        await fetch(`${API_BASE_URL}/api/users/sync-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            name: clerkUser.fullName || clerkUser.username
          })
        });
      } catch (err) {
        console.error('Failed to sync login session to DB:', err);
      }
    }
    
    syncLoginToDB();
  }, [isSignedIn, clerkUser]);

  // ── Modal helpers (Clerk opens its own hosted modal) ────────────────────
  const openSignInModal = useCallback(() => {
    openSignIn();
  }, [openSignIn]);

  const openSignUpModal = useCallback(() => {
    openSignUp();
  }, [openSignUp]);

  // ── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await clerkSignOut();
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  }, [clerkSignOut]);

  // loading = Clerk hasn't resolved the session yet
  const loading = !isLoaded;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSignedIn: !!isSignedIn,
        isAuthOpen,
        authMode,
        setAuthMode,
        setIsAuthOpen,
        openSignIn: openSignInModal,
        openSignUp: openSignUpModal,
        signOut,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
