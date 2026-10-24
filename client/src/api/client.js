import axios from 'axios';

/**
 * VITE_API_URL is the exact server URL, e.g. http://localhost:5050 (local)
 * or https://fitstore-api.onrender.com (production). Routes are called on it as-is
 * (e.g. /products, /cart), so only a trailing slash is removed.
 */
export function resolveBaseURL(raw) {
  return (raw || 'http://localhost:5050').trim().replace(/\/+$/, '');
}

/**
 * One configured Axios instance for the whole app.
 * - withCredentials: sends the HttpOnly session cookie
 * - X-FitStore-Client: custom header required by the server's CSRF guard
 * The response interceptor unwraps `{ success, data, ... }` and normalises errors.
 */
export const API_BASE_URL = resolveBaseURL(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // Long enough to survive a cold start of the free Render server (~30-60 s).
  timeout: 90000,
  headers: { 'X-FitStore-Client': 'web' },
});

/**
 * Requests slower than SLOW_AFTER_MS are reported with a "fitstore:server-slow"
 * event (detail = number of slow requests still pending). ServerWakeGate listens
 * and shows the centered "waking up the server" loader.
 */
export const SLOW_EVENT = 'fitstore:server-slow';
const SLOW_AFTER_MS = 4000;
let slowCount = 0;
const reportSlow = (delta) => {
  slowCount = Math.max(0, slowCount + delta);
  window.dispatchEvent(new CustomEvent(SLOW_EVENT, { detail: slowCount }));
};

api.interceptors.request.use((config) => {
  const tracker = { slow: false };
  tracker.timer = setTimeout(() => {
    tracker.slow = true;
    reportSlow(1);
  }, SLOW_AFTER_MS);
  return { ...config, slowTracker: tracker };
});

const finishTracking = (config) => {
  const tracker = config?.slowTracker;
  if (!tracker) return;
  clearTimeout(tracker.timer);
  if (tracker.slow) reportSlow(-1);
};

api.interceptors.response.use(
  (response) => {
    finishTracking(response.config);
    return response.data;
  },
  (error) => {
    finishTracking(error.config);
    const status = error.response?.status;
    let message = error.response?.data?.message;
    if (!message) {
      message = error.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : 'Cannot reach the FitStore server. Is the backend running?';
    }
    const err = new Error(message);
    err.status = status;
    err.details = error.response?.data?.details;

    if (status === 401) window.dispatchEvent(new Event('fitstore:unauthorized'));
    return Promise.reject(err);
  },
);

export default api;
