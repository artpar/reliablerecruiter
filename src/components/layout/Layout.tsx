import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useApp } from '../../context/AppContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Toast from '../common/Toast';

const Layout: React.FC = () => {
  const location = useLocation();
  const { state: userState } = useUser();
  const { state: appState, dispatch } = useApp();
  const { sidebarCollapsed } = userState.preferences;

  // Update document HTML element with theme class
  useEffect(() => {
    // Apply dark class to html element for Tailwind dark mode
    if (userState.preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Also update body with appropriate background and text colors
    document.body.className = userState.preferences.theme === 'dark'
      ? 'bg-neutral-900 text-white'
      : 'bg-neutral-50 ';
  }, [userState.preferences.theme]);

  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname;
    let title = 'RR.Space';

    if (path !== '/') {
      const pathSegments = path.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const toolPath = pathSegments[pathSegments.length - 1];
        const formattedToolName = toolPath
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        title = `${formattedToolName} | RR.Space`;
      }
    }

    document.title = title;
  }, [location]);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (appState.toast.show) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [appState.toast.show, dispatch]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - only show on larger screens */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out`}>
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />

      {/* Toast notification */}
      {appState.toast.show && (
        <Toast
          message={appState.toast.message}
          type={appState.toast.type}
          onClose={() => dispatch({ type: 'HIDE_TOAST' })}
        />
      )}
    </div>
  );
};

export default Layout;
