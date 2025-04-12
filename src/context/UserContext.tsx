import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

// Types
type Theme = 'light' | 'dark';

export type UserPreferences = {
  theme: Theme;
  sidebarCollapsed: boolean;
  recentTools: string[];
};

type UserState = {
  preferences: UserPreferences;
};

type UserAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_RECENT_TOOL'; payload: string }
  | { type: 'CLEAR_RECENT_TOOLS' }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences };

const defaultPreferences: UserPreferences = {
  theme: 'light',
  sidebarCollapsed: false,
  recentTools: [],
};

// Initial state
const initialState: UserState = {
  preferences: defaultPreferences,
};

// Create context
const UserContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Reducer
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          theme: action.payload,
        },
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          sidebarCollapsed: !state.preferences.sidebarCollapsed,
        },
      };
    case 'ADD_RECENT_TOOL': {
      const recentTools = state.preferences.recentTools.filter(
        (tool) => tool !== action.payload
      );
      recentTools.unshift(action.payload);
      if (recentTools.length > 5) recentTools.pop();
      
      return {
        ...state,
        preferences: {
          ...state.preferences,
          recentTools,
        },
      };
    }
    case 'CLEAR_RECENT_TOOLS':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          recentTools: [],
        },
      };
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: action.payload,
      };
    default:
      return state;
  }
};

// Provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Load preferences from localStorage on initial render
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        dispatch({
          type: 'SET_PREFERENCES',
          payload: parsedPreferences,
        });
      } catch (error) {
        console.error('Error parsing user preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
  }, [state.preferences]);
  
  // Apply theme class to document body
  useEffect(() => {
    const { theme } = state.preferences;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.preferences.theme]);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook
export const useUser = () => useContext(UserContext);
