import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, ServerCrash } from 'lucide-react';
import { API_BASE_URL, SLOW_EVENT } from '../api/client';

const SHOW_AFTER_MS = 600; // don't flash the overlay when the server answers quickly
const RETRY_EVERY_MS = 3000;
const CHECK_TIMEOUT_MS = 15000;
const GIVE_UP_AFTER_MS = 3 * 60 * 1000;

async function pingServer() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal, cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function WakeScreen({ seconds, failed, onRetry }) {
  return (
    <div className="wake" role="status" aria-live="polite">
      <div className="wake__card">
        <div className="wake__logo">
          FIT<span>STORE</span>
        </div>
        {failed ? (
          <>
            <ServerCrash size={44} className="wake__icon wake__icon--error" aria-hidden="true" />
            <h1>Server is not responding</h1>
            <p>We couldn&apos;t reach the FitStore server. Please check your connection and try again.</p>
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              <RefreshCw size={18} /> Try again
            </button>
          </>
        ) : (
          <>
            <div className="wake__spinner" aria-hidden="true" />
            <h1>Waking up the server&hellip;</h1>
            <p>
              FitStore runs on a free server that sleeps when idle. Starting it again can take up to a minute.
              Thanks for your patience!
            </p>
            <div className="wake__bar" aria-hidden="true"><span /></div>
            {seconds > 0 && <small className="wake__time">{seconds}s</small>}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 1. Before the app renders, waits until GET /health succeeds (cold start on Render's free plan).
 * 2. Afterwards, shows the same centered loader whenever an API request is unusually slow
 *    (the server fell asleep during the visit).
 */
export default function ServerWakeGate({ children }) {
  const [ready, setReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [failed, setFailed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [slowRequests, setSlowRequests] = useState(0);
  const startedAt = useRef(Date.now());
  const attempt = useRef(0);

  const wake = useCallback(async () => {
    const myAttempt = ++attempt.current;
    startedAt.current = Date.now();
    setFailed(false);
    setSeconds(0);
    const showTimer = setTimeout(() => setShowOverlay(true), SHOW_AFTER_MS);

    while (myAttempt === attempt.current) {
      // eslint-disable-next-line no-await-in-loop
      if (await pingServer()) {
        clearTimeout(showTimer);
        if (myAttempt === attempt.current) {
          setReady(true);
          setShowOverlay(false);
        }
        return;
      }
      if (Date.now() - startedAt.current > GIVE_UP_AFTER_MS) {
        clearTimeout(showTimer);
        setShowOverlay(true);
        setFailed(true);
        return;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, RETRY_EVERY_MS));
    }
    clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    wake();
    return () => {
      attempt.current += 1; // stop the loop on unmount
    };
  }, [wake]);

  // Count slow in-flight requests reported by the API client.
  useEffect(() => {
    const onSlow = (e) => setSlowRequests(e.detail);
    window.addEventListener(SLOW_EVENT, onSlow);
    return () => window.removeEventListener(SLOW_EVENT, onSlow);
  }, []);

  const visible = (!ready && showOverlay) || (ready && slowRequests > 0);

  // Elapsed-seconds counter while the overlay is visible.
  useEffect(() => {
    if (!visible || failed) return undefined;
    const from = ready ? Date.now() : startedAt.current;
    setSeconds(Math.floor((Date.now() - from) / 1000));
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - from) / 1000)), 1000);
    return () => clearInterval(id);
  }, [visible, failed, ready]);

  return (
    <>
      {ready && children}
      {visible && <WakeScreen seconds={seconds} failed={failed} onRetry={wake} />}
    </>
  );
}
