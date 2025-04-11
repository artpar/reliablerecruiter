import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export type FileInfo = {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer | null;
  processedData?: any;
};

type FileState = {
  files: Record<string, FileInfo>;
  currentFile: string | null;
  isProcessing: boolean;
  error: string | null;
};

type FileAction =
  | { type: 'ADD_FILE'; payload: FileInfo }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_CURRENT_FILE'; payload: string }
  | { type: 'SET_PROCESSED_DATA'; payload: { id: string; data: any } }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_FILES' };

const initialState: FileState = {
  files: {},
  currentFile: null,
  isProcessing: false,
  error: null,
};

// Create context
const FileContext = createContext<{
  state: FileState;
  dispatch: React.Dispatch<FileAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Reducer
const fileReducer = (state: FileState, action: FileAction): FileState => {
  switch (action.type) {
    case 'ADD_FILE':
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.id]: action.payload,
        },
        currentFile: action.payload.id,
        error: null,
      };
    case 'REMOVE_FILE':
      const newFiles = { ...state.files };
      delete newFiles[action.payload];
      return {
        ...state,
        files: newFiles,
        currentFile: state.currentFile === action.payload ? null : state.currentFile,
      };
    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFile: action.payload,
      };
    case 'SET_PROCESSED_DATA':
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.id]: {
            ...state.files[action.payload.id],
            processedData: action.payload.data,
          },
        },
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_FILES':
      return {
        ...initialState,
      };
    default:
      return state;
  }
};

// Provider component
export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(fileReducer, initialState);

  return (
    <FileContext.Provider value={{ state, dispatch }}>
      {children}
    </FileContext.Provider>
  );
};

// Custom hook
export const useFile = () => useContext(FileContext);
