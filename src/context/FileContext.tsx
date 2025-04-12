import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface FileInfo {
    id: string;
    name: string;
    type: string;
    size: number;
    content: string | ArrayBuffer;
    contentType?: string; // Added for specifying content type when different from file type
    metadata?: Record<string, any>; // Additional metadata about the file
    editedContent?: string | ArrayBuffer; // To store edited content
}

interface FileState {
    files: FileInfo[];
}

type FileAction =
    | { type: 'ADD_FILE'; payload: FileInfo }
    | { type: 'REMOVE_FILE'; payload: { id: string } }
    | { type: 'UPDATE_FILE_CONTENT'; payload: { id: string; content: string | ArrayBuffer; contentType?: string } }
    | { type: 'UPDATE_FILE_METADATA'; payload: { id: string; metadata: Record<string, any> } }
    | { type: 'CLEAR_FILES' };

interface FileContextType {
    files: FileInfo[];
    dispatch: React.Dispatch<FileAction>;
    getFile: (id: string) => FileInfo | undefined;
    saveEditedContent: (id: string, content: string | ArrayBuffer, contentType?: string) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

const fileReducer = (state: FileState, action: FileAction): FileState => {
    switch (action.type) {
        case 'ADD_FILE':
            return {
                ...state,
                files: [...state.files, action.payload],
            };
        case 'REMOVE_FILE':
            return {
                ...state,
                files: state.files.filter((file) => file.id !== action.payload.id),
            };
        case 'UPDATE_FILE_CONTENT':
            return {
                ...state,
                files: state.files.map((file) =>
                    file.id === action.payload.id
                        ? {
                            ...file,
                            content: action.payload.content,
                            contentType: action.payload.contentType || file.contentType || file.type
                        }
                        : file
                ),
            };
        case 'UPDATE_FILE_METADATA':
            return {
                ...state,
                files: state.files.map((file) =>
                    file.id === action.payload.id
                        ? { ...file, metadata: { ...file.metadata, ...action.payload.metadata } }
                        : file
                ),
            };
        case 'CLEAR_FILES':
            return {
                ...state,
                files: [],
            };
        default:
            return state;
    }
};

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(fileReducer, { files: [] });

    const getFile = (id: string) => {
        return state.files.find(file => file.id === id);
    };

    const saveEditedContent = (id: string, content: string | ArrayBuffer, contentType?: string) => {
        dispatch({
            type: 'UPDATE_FILE_CONTENT',
            payload: { id, content, contentType }
        });
    };

    return (
        <FileContext.Provider value={{ files: state.files, dispatch, getFile, saveEditedContent }}>
            {children}
        </FileContext.Provider>
    );
};

export const useFile = (): FileContextType => {
    const context = useContext(FileContext);
    if (context === undefined) {
        throw new Error('useFile must be used within a FileProvider');
    }
    return context;
};
