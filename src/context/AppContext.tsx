import React, { createContext, useContext, useReducer, ReactNode } from 'react';

type AppState = {
  currentTool: string | null;
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
};

type AppAction =
  | { type: 'SET_CURRENT_TOOL'; payload: string }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' | 'warning' } }
  | { type: 'HIDE_TOAST' };

const initialState: AppState = {
  currentTool: null,
  toast: {
    show: false,
    message: '',
    type: 'info',
  },
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CURRENT_TOOL':
      return {
        ...state,
        currentTool: action.payload,
      };
    case 'SHOW_TOAST':
      return {
        ...state,
        toast: {
          show: true,
          message: action.payload.message,
          type: action.payload.type,
        },
      };
    case 'HIDE_TOAST':
      return {
        ...state,
        toast: {
          ...state.toast,
          show: false,
        },
      };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
