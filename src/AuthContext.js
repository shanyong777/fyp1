import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, reload } from "firebase/auth";
import { auth } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = {
    user,
    loading,
    signOut: () => signOut(auth),
    refreshUser: async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        setUser(auth.currentUser);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

