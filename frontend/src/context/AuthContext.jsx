import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  changePasswordRequest,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
} from '../services/authService';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from '../utils/authStorage';
import { ROLE_HOME } from '../constants/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(Boolean(getStoredToken()));

  const applySession = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    setAuthSession({ token: nextToken, user: nextUser });
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    clearAuthSession();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!getStoredToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchCurrentUser();
        if (!cancelled) {
          setUser(response.data);
          setAuthSession({ token: getStoredToken(), user: response.data });
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(
    async ({ loginId, password }) => {
      const response = await loginRequest({ loginId, password });
      const nextUser = response.data.user;
      const nextToken = response.data.accessToken;
      applySession(nextUser, nextToken);
      return {
        user: nextUser,
        redirectTo: ROLE_HOME[nextUser.role] || '/',
      };
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) {
        await logoutRequest();
      }
    } catch {
      // Client discard still proceeds for access-token strategy.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const changePassword = useCallback(
    async ({ currentPassword, newPassword }) => {
      const response = await changePasswordRequest({ currentPassword, newPassword });
      const nextUser = response.data;
      setUser(nextUser);
      setAuthSession({ token: getStoredToken(), user: nextUser });
      return nextUser;
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
      changePassword,
    }),
    [user, token, isLoading, login, logout, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
