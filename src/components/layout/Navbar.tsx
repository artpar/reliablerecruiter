import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useUser } from '../../context/UserContext';

const toolsData = [
  { id: 'jd-checker', name: 'Inclusive JD Checker', path: '/tools/jd-checker' },
  { id: 'resume-anonymizer', name: 'Resume Anonymizer', path: '/tools/resume-anonymizer' },
  { id: 'diverse-panel-planner', name: 'Diverse Panel Planner', path: '/tools/diverse-panel-planner' },
  { id: 'layoff-impact-analyzer', name: 'Layoff Impact Analyzer', path: '/tools/layoff-impact-analyzer' },
  { id: 'boomerang-talent-finder', name: 'Boomerang Talent Finder', path: '/tools/boomerang-talent-finder' },
  { id: 'ai-outreach-personalizer', name: 'AI Outreach Personalizer', path: '/tools/ai-outreach-personalizer' },
  { id: 'interview-load-balancer', name: 'Interview Load Balancer', path: '/tools/interview-load-balancer' },
  { id: 'candidate-experience-pulse', name: 'Candidate Experience Pulse', path: '/tools/candidate-experience-pulse' },
  { id: 'hybrid-office-day-planner', name: 'Hybrid Office Day Planner', path: '/tools/hybrid-office-day-planner' },
  { id: 'offer-comparator', name: 'Offer Comparator', path: '/tools/offer-comparator' },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const { dispatch } = useApp();
  const { state: userState, dispatch: userDispatch } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = userState.preferences.theme === 'light' ? 'dark' : 'light';
    userDispatch({ type: 'SET_THEME', payload: newTheme });
  };

  const handleToolClick = (toolId: string) => {
    dispatch({ type: 'SET_CURRENT_TOOL', payload: toolId });
    userDispatch({ type: 'ADD_RECENT_TOOL', payload: toolId });
    setMobileMenuOpen(false);
    setToolsMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600 flex items-center">
                <img src="/logo144.png" className="h-10 w-auto mr-2" alt="ReliableRecruiter.Space Logo"/>
                <span className="hidden md:block">ReliableRecruiter.Space</span>
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {userState.preferences.theme === 'light' ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`${
                location.pathname === '/'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <div>
              <button
                type="button"
                className={`${
                  location.pathname.startsWith('/tools')
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800'
                } w-full flex items-center justify-between pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              >
                Tools
                <svg
                  className={`ml-2 h-5 w-5 transform ${toolsMenuOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {toolsMenuOpen && (
                <div className="pl-4">
                  {toolsData.map((tool) => (
                    <Link
                      key={tool.id}
                      to={tool.path}
                      className={`${
                        location.pathname === tool.path
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                      } block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium`}
                      onClick={() => handleToolClick(tool.id)}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile theme toggle */}
          <div className="pt-4 pb-3 border-t border-neutral-200">
            <div className="flex items-center px-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="ml-auto p-2 rounded-full text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {userState.preferences.theme === 'light' ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
