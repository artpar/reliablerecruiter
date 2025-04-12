// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AppProvider } from './context/AppContext';
import { FileProvider } from './context/FileContext';
import Toast from './components/common/Toast';
import { registerServiceWorker, isPWA } from './registerServiceWorker';

const App: React.FC = () => {
    const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
    const [isInstallPromptShown, setIsInstallPromptShown] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // Register service worker for PWA functionality
    useEffect(() => {
        registerServiceWorker();

        // Listen for the beforeinstallprompt event to enable PWA installation
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            setInstallPrompt(e);
            // Only show install prompt if not already installed and not shown before
            if (!isPWA() && !isInstallPromptShown) {
                setIsInstallPromptShown(true);
            }
        });

        // Handle service worker updates
        window.addEventListener('sw-updated', () => {
            setToast({
                message: 'New content available! Refresh the page to update.',
                type: 'info'
            });
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', () => {});
            window.removeEventListener('sw-updated', () => {});
        };
    }, [isInstallPromptShown]);

    // Handle PWA installation
    const handleInstallPWA = () => {
        if (!installPrompt) return;

        // Show the prompt
        installPrompt.prompt();

        // Wait for the user to respond to the prompt
        installPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            // Clear the saved prompt since it can't be used again
            setInstallPrompt(null);
            setIsInstallPromptShown(false);
        });
    };

    return (
        <AppProvider>
            <FileProvider>
                <Router>
                    <div className="min-h-screen bg-neutral-50">
                        <AppRoutes />

                        {/* PWA Install Prompt */}
                        {isInstallPromptShown && installPrompt && (
                            <div className="fixed bottom-4 right-4 z-40 p-4 bg-white shadow-lg rounded-lg border border-neutral-200">
                                <div className="flex items-center">
                                    <div className="mr-3">
                                        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-neutral-900">Install ReliableRecruiter.Space</h3>
                                        <p className="text-xs text-neutral-600">Install this app to your device for offline use</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end space-x-2">
                                    <button
                                        className="text-xs text-neutral-600
                                        hover:text-neutral-900 border border-black rounded px-3 py-1"
                                        onClick={() => setIsInstallPromptShown(false)}
                                    >
                                        Not now
                                    </button>
                                    <button
                                        className="text-xs bg-primary-600 text-black border border-black rounded
                                         px-3 py-1 rounded-md hover:bg-primary-700"
                                        onClick={handleInstallPWA}
                                    >
                                        Install
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Toast notifications */}
                        {toast && (
                            <Toast
                                message={toast.message}
                                type={toast.type as 'success' | 'error' | 'info' | 'warning'}
                                onClose={() => setToast(null)}
                            />
                        )}
                    </div>
                </Router>
            </FileProvider>
        </AppProvider>
    );
};

export default App;
