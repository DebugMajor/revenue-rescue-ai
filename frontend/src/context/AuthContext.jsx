import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getToken,
  setToken as persistToken,
  clearToken,
  registerUnauthorizedHandler,
  login as loginRequest,
  register as registerRequest
} from "../services/api";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(
      payload.replace(/-/g, "+").replace(/_/g, "/")
    );

    return JSON.parse(json);
  }
  catch {
    return null;
  }
}

function isExpired(claims) {
  if (!claims?.exp) return false;
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

  const user = useMemo(
    () => (token ? decodeJwt(token) : null),
    [token]
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearToken();
      setTokenState(null);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const jwt = await loginRequest(email, password);

    persistToken(jwt);
    setTokenState(jwt);

    return jwt;
  }, []);

  const register = useCallback(async (email, password) => {
    const result = await registerRequest(email, password);
    return result;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      ready,
      login,
      register,
      logout
    }),
    [token, user, ready, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}