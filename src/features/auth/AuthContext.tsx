import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getDemoUsers,
  loginDemo,
} from '../../services/authService';
import {
  clearSession,
  loadSession,
  saveSession,
} from '../../storage/sessionStorage';
import type {
  DemoSession,
  UserRole,
} from '../../types/auth';

type AuthContextValue = {
  session: DemoSession | null;
  sessionReady: boolean;
  authenticating: boolean;
  authError: string | null;
  signInDemo: (email: string) => Promise<boolean>;
  switchDemoRole: (role: UserRole) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<DemoSession | null>(null);

  const [
    sessionReady,
    setSessionReady,
  ] = useState(false);

  const [
    authenticating,
    setAuthenticating,
  ] = useState(false);

  const [
    authError,
    setAuthError,
  ] = useState<string | null>(null);

  useEffect(() => {
    async function hydrateSession() {
      try {
        const storedSession =
          await loadSession();

        setSession(storedSession);
      } catch (error) {
        console.error(
          'Failed to restore session:',
          error,
        );

        setSession(null);
        setAuthError(
          'Saved session could not be restored.',
        );
      } finally {
        setSessionReady(true);
      }
    }

    void hydrateSession();
  }, []);

  async function signInDemo(
    email: string,
  ): Promise<boolean> {
    setAuthenticating(true);
    setAuthError(null);

    try {
      const nextSession =
        await loginDemo(email);

      await saveSession(nextSession);

      setSession(nextSession);

      return true;
    } catch (error) {
      console.error(
        'Demo login failed:',
        error,
      );

      setAuthError(
        'Demo account could not be accessed.',
      );

      return false;
    } finally {
      setAuthenticating(false);
    }
  }

  async function switchDemoRole(
    role: UserRole,
  ): Promise<boolean> {
    const targetUser =
      getDemoUsers().find(
        (user) => user.role === role,
      );

    if (!targetUser) {
      setAuthError(
        'Demo role could not be found.',
      );

      return false;
    }

    return signInDemo(
      targetUser.email,
    );
  }

  async function signOut() {
    setAuthError(null);

    try {
      await clearSession();
      setSession(null);
    } catch (error) {
      console.error(
        'Failed to clear session:',
        error,
      );

      setAuthError(
        'Session could not be closed.',
      );
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        sessionReady,
        authenticating,
        authError,
        signInDemo,
        switchDemoRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    );
  }

  return context;
}
