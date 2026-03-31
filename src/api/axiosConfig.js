import axios from 'axios';
import keycloak from '../keycloak';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

apiClient.interceptors.request.use(
  async (config) => {
    if (!keycloak.authenticated) return config;

    try {
      // Refresh the token if it expires within the next 30 seconds.
      await keycloak.updateToken(30);
    } catch {
      // Token refresh failed — force a new login.
      keycloak.login();
      throw new Error('Session expired. Redirecting to login.');
    }

    config.headers.Authorization = `Bearer ${keycloak.token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

export default apiClient;
