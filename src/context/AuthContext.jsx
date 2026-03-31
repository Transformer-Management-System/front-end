import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import keycloak from '../keycloak';

const AuthContext = createContext(null);

// Module-level flag prevents double-initialization under React Strict Mode,
// which intentionally mounts/unmounts effects twice in development.
let keycloakInitialized = false;

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (keycloakInitialized) return;
    keycloakInitialized = true;

    keycloak
      .init({
        onLoad: 'login-required',
        checkLoginIframe: false, // avoids iframe CSP issues in dev
      })
      .then((auth) => {
        setAuthenticated(auth);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Keycloak initialization failed:', err);
        setLoading(false);
      });
  }, []);

  const logout = () =>
    keycloak.logout({ redirectUri: globalThis.location.origin });

  const value = useMemo(
    () => ({ authenticated, loading, keycloak, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authenticated, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
