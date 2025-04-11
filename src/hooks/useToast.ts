import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface UseToastReturn {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

/**
 * Custom hook for showing toast notifications
 */
function useToast(): UseToastReturn {
  const { dispatch } = useApp();

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message, type },
      });
      
      // Automatically hide toast after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 5000);
    },
    [dispatch]
  );

  const hideToast = useCallback(() => {
    dispatch({ type: 'HIDE_TOAST' });
  }, [dispatch]);

  return { showToast, hideToast };
}

export default useToast;
