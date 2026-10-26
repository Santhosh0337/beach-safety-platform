import { useEffect, useState } from 'react';
import './styles/dashboard.css';
import { AppShell } from './components/layout/AppShell';
import { MonitoringPage } from './features/monitoring/MonitoringPage';
import { useApiHealth } from './hooks/useApiHealth';
import { LandingPage } from './landing';
import { TouristPage } from './tourist/TouristPage';

function getCurrentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

export default function App() {
  const [path, setPath] = useState(getCurrentPath);
  const health = useApiHealth();

  useEffect(() => {
    const handlePopState = () => setPath(getCurrentPath());

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Support navigation between the landing page, visitor UI, and dashboard.
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest('a');
      if (
        !link ||
        link.target === '_blank' ||
        link.origin !== window.location.origin
      ) {
        return;
      }

      const nextPath = link.pathname.replace(/\/+$/, '') || '/';

      if (
        nextPath !== '/' &&
        nextPath !== '/dashboard' &&
        nextPath !== '/tourist'
      ) {
        return;
      }

      // Leave in-page anchors to the browser.
      if (nextPath === getCurrentPath() && link.hash) return;

      event.preventDefault();

      if (nextPath !== getCurrentPath()) {
        window.history.pushState({}, '', nextPath + link.hash);
        setPath(nextPath);
      } else {
        window.scrollTo(0, 0);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Scroll to the requested anchor or the top after navigation.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const anchor = id ? document.getElementById(id) : null;

    if (anchor) {
      anchor.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [path]);

  useEffect(() => {
    document.title =
      path === '/dashboard'
        ? 'Coastal Command · Beach Safety Intelligence Platform'
        : path === '/tourist'
          ? 'Beach Conditions · Beach Safety'
          : 'Beach Safety Intelligence Platform';
  }, [path]);

  if (path === '/tourist') {
    return <TouristPage />;
  }

  if (path !== '/dashboard') {
    return (
      <LandingPage
        authSlot={
          <>
            <a className="bs-btn bs-btn--secondary" href="/tourist">
              Visitor Safety
            </a>

            <a className="bs-btn bs-btn--secondary" href="/dashboard">
              Authority dashboard
            </a>
          </>
        }
      />
    );
  }

  return (
    <AppShell health={health}>
      <MonitoringPage health={health} />
    </AppShell>
  );
}
