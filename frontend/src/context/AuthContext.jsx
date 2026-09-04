import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getToken,
  setToken as persistToken,
  clearToken,
  registerUnauthorizedHandler,
  login as loginRequest
} from "../services/api";

// Minimal, dependency-free JWT payload decode (no verification — the
// backend is the only thing that verifies signatures; this is purely
// so the UI can show "logged in as x@y.com" and detect an already-
// expired token before even making a request).
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isExpired(claims) {
  if (!claims?.exp) return false; // no exp claim -> can't tell, assume valid
  return Date.now() >= claims.exp * 1000;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => {
    const stored = getToken();
    if (stored) {
      const claims = decodeJwt(stored);
      if (claims && isExpired(claims)) {
        clearToken();
        return null;
      }
    }
    return stored;
  });
  const [ready, setReady] = useState(true);

  const user = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  // Any 401 from any protected API call routes through here.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setTokenState(null);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const jwt = await loginRequest(email, password);
    persistToken(jwt);
    setTokenState(jwt);
    return jwt;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      ready,
      login,
      logout
    }),
    [token, user, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
