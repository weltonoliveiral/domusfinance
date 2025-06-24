import { useState, useEffect } from 'react';
import App from './App';
import PasswordResetPage from './components/PasswordResetPage';

export default function Router() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple navigation function
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    // Parse the search params from the new path
    const url = new URL(path, window.location.origin);
    setSearchParams(new URLSearchParams(url.search));
  };

  // Provide navigation context
  (window as any).navigate = navigate;

  // Check for reset password route
  if (currentPath === '/reset-password' || currentPath.startsWith('/reset-password')) {
    return <PasswordResetPage />;
  }

  return <App />;
}
