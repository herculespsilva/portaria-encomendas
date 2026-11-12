import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Estado = { session: Session | null; carregando: boolean };
const AuthContext = createContext<Estado>({ session: null, carregando: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ session: null, carregando: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEstado({ session: data.session, carregando: false }));
    const { data } = supabase.auth.onAuthStateChange((_evento, session) =>
      setEstado({ session, carregando: false }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={estado}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
