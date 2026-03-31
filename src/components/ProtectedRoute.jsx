import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps any content that requires an authenticated session.
 * - Shows a full-screen loader while Keycloak is still initialising.
 * - Redirects to Keycloak login if the user is not authenticated.
 * - Renders children once authentication is confirmed.
 */
export default function ProtectedRoute({ children }) {
  const { authenticated, loading, keycloak } = useAuth();

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!authenticated) {
    keycloak.login();
    return null;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

const styles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '5px solid #e0e0e0',
    borderTop: '5px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
};
