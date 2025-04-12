// sw.js - Service Worker file for RR.space

// Cache names
const CACHE_NAME = 'hr-toolkit-cache-v2'; // Increment version to force refresh
const STATIC_CACHE = 'hr-toolkit-static-v2';
const DYNAMIC_CACHE = 'hr-toolkit-dynamic-v2';
const PDF_LIB_CACHE = 'hr-toolkit-pdf-lib-v2';

// Resources to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/apple-touch-icon.png',
];

// PDF library resources to cache separately
const PDF_LIB_ASSETS = [
    // PDF.js files
    'https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.min.mjs',
    'https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.worker.min.mjs',
    'https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.worker.mjs',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.5.207/pdf.worker.min.js',
    // Add other PDF.js related files as needed
];

// Worker files to cache
const WORKER_ASSETS = [
    '/assets/pdfWorker.js',
    '/assets/workers/pdfWorker.js',
    '/src/workers/pdfWorker.js'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force new service worker to become active immediately

    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),

            // Cache PDF library assets
            caches.open(PDF_LIB_CACHE).then(cache => {
                console.log('Caching PDF library assets');
                return cache.addAll(PDF_LIB_ASSETS);
            }),

            // Cache worker assets
            caches.open(DYNAMIC_CACHE).then(cache => {
                console.log('Caching worker assets');
                // We use individual fetch instead of addAll because some worker files
                // might not be available yet in development
                WORKER_ASSETS.forEach(asset => {
                    fetch(asset).then(response => {
                        if (response.ok) {
                            cache.put(asset, response);
                        }
                    }).catch(err => {
                        console.log(`Failed to cache worker asset ${asset}:`, err);
                    });
                });
            })
        ])
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    // Delete any cache that isn't in our defined caches
                    if (
                        cache !== STATIC_CACHE &&
                        cache !== DYNAMIC_CACHE &&
                        cache !== PDF_LIB_CACHE &&
                        cache.includes('hr-toolkit')
                    ) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            // Claim clients so the SW is in control immediately
            return self.clients.claim();
        }).then(() => {
            // Notify clients that the SW has been updated
            self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
            });
        })
    );
});

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
    const urlObj = new URL(url);
    return STATIC_ASSETS.some(asset => urlObj.pathname === asset);
};

// Helper function to determine if a request is for a PDF library asset
const isPdfLibAsset = (url) => {
    return PDF_LIB_ASSETS.some(asset => url.includes(asset));
};

// Helper function to determine if a request is for a worker file
const isWorkerAsset = (url) => {
    return url.includes('/workers/') ||
           url.includes('pdfWorker') ||
           url.includes('/assets/workers/') ||
           WORKER_ASSETS.some(asset => url.includes(asset));
};

// Helper function to determine if a request is for an API
const isApiRequest = (url) => {
    return url.includes('/api/');
};

// Helper function to determine if a request is for a file that should be network-first
const isNetworkFirstRequest = (url) => {
    return url.includes('hot-update') ||
        url.includes('sockjs-node') ||
        url.includes('dev-server') ||
        url.includes('webpack');
};

// Helper to check content type
const isJavaScriptContentType = (response) => {
    const contentType = response.headers.get('content-type');
    return contentType && (
        contentType.includes('javascript') ||
        contentType.includes('application/x-javascript') ||
        contentType.includes('text/javascript')
    );
};

// Fix MIME types for JavaScript files if needed
const fixMimeTypeIfNeeded = async (response, url) => {
    // If it's a JavaScript file but has wrong MIME type, fix it
    if (url.endsWith('.js') && !isJavaScriptContentType(response)) {
        // We need to clone and modify the response to fix the MIME type
        return response.blob().then(blob => {
            return new Response(blob, {
                status: response.status,
                statusText: response.statusText,
                headers: new Headers({
                    'Content-Type': 'application/javascript',
                    // Copy other headers
                    ...Array.from(response.headers.entries()).reduce((obj, [key, value]) => {
                        if (key.toLowerCase() !== 'content-type') {
                            obj[key] = value;
                        }
                        return obj;
                    }, {})
                })
            });
        });
    }
    return response;
};

// Fetch event - Handle requests with different strategies
self.addEventListener('fetch', (event) => {
    const requestUrl = event.request.url;

    // Skip non-GET requests and browser extensions
    if (
        event.request.method !== 'GET' ||
        requestUrl.startsWith('chrome-extension') ||
        requestUrl.startsWith('moz-extension')
    ) {
        return;
    }

    // Worker files - Network First strategy with MIME type correction
    if (isWorkerAsset(requestUrl)) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // Ensure correct MIME type for worker files
                    return fixMimeTypeIfNeeded(networkResponse, requestUrl)
                        .then(fixedResponse => {
                            // Cache the response with proper MIME type
                            const responseToCache = fixedResponse.clone();
                            caches.open(DYNAMIC_CACHE).then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                            return fixedResponse;
                        });
                })
                .catch(() => {
                    // Fallback to cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // PDF library assets - Cache First strategy
    if (isPdfLibAsset(requestUrl)) {
        event.respondWith(
            caches.open(PDF_LIB_CACHE).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // If not in cache, fetch from network
                    return fetch(event.request).then(networkResponse => {
                        // Cache the fresh version
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(err => {
                        console.error('Failed to fetch PDF library asset:', err);
                        // Fallback could be provided here
                    });
                });
            })
        );
        return;
    }

    // Static assets - Cache First strategy
    if (isStaticAsset(requestUrl)) {
        event.respondWith(
            caches.open(STATIC_CACHE).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // If not in cache, fetch from network
                    return fetch(event.request).then(networkResponse => {
                        // Cache the fresh version
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // API requests - Network Only strategy
    if (isApiRequest(requestUrl)) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Development server requests - Network Only
    if (isNetworkFirstRequest(requestUrl)) {
        event.respondWith(fetch(event.request));
        return;
    }

    // All other requests - Network First, falling back to cache
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Cache successful responses
                if (networkResponse.ok) {
                    const clonedResponse = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(event.request, clonedResponse);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Fallback to cache when network fails
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Return the offline page if we can't fetch the resource
                    // and it's a navigation request (HTML document)
                    if (event.request.headers.get('accept') &&
                        event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }

                    // No cache fallback for other resources
                    return new Response('Network error occurred', {
                        status: 408,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
            })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Handle background sync for offline operations
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-jd-analysis') {
        event.waitUntil(syncJDAnalysis());
    }
});

// Function to process pending JD analyses when back online
async function syncJDAnalysis() {
    try {
        // Retrieve pending analyses from IndexedDB
        const db = await openDatabase();
        const pendingAnalyses = await getStoredItems(db, 'pendingAnalyses');

        // Process each pending analysis
        for (const analysis of pendingAnalyses) {
            // Process the analysis
            const result = await processJDOffline(analysis.text);

            // Store the result
            await storeItem(db, 'analysisResults', {
                id: analysis.id,
                timestamp: Date.now(),
                result
            });

            // Remove from pending queue
            await removeItem(db, 'pendingAnalyses', analysis.id);

            // Notify clients about the completed analysis
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'ANALYSIS_COMPLETE',
                        analysisId: analysis.id
                    });
                });
            });
        }

        db.close();
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Function to process JD offline using cached bias detection
async function processJDOffline(text) {
    // Simplified bias detection that can work offline
    // In a real app, this would use the same algorithm as the main app
    const biasedTerms = [];

    // Example basic detection
    const biasedWords = [
        { term: 'rockstar', category: 'gender' },
        { term: 'ninja', category: 'gender' },
        { term: 'young', category: 'age' },
        { term: 'veteran', category: 'age' }
    ];

    biasedWords.forEach(biasedWord => {
        let index = text.toLowerCase().indexOf(biasedWord.term);
        while (index !== -1) {
            biasedTerms.push({
                term: text.substring(index, index + biasedWord.term.length),
                index,
                category: biasedWord.category,
                alternatives: []  // Would need proper alternatives
            });

            index = text.toLowerCase().indexOf(biasedWord.term, index + 1);
        }
    });

    // Calculate a simple bias score
    const wordCount = text.split(/\s+/).length;
    const biasScore = Math.min(
        100,
        Math.round((biasedTerms.length / Math.max(1, wordCount)) * 1000)
    );

    return {
        biasedTerms,
        score: biasScore
    };
}

// IndexedDB helper functions
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('hr-toolkit-db', 1);

        request.onupgradeneeded = e => {
            const db = e.target.result;

            // Create stores if they don't exist
            if (!db.objectStoreNames.contains('pendingAnalyses')) {
                db.createObjectStore('pendingAnalyses', { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains('analysisResults')) {
                db.createObjectStore('analysisResults', { keyPath: 'id' });
            }
        };

        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject(e.target.error);
    });
}

function getStoredItems(db, storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject(e.target.error);
    });
}

function storeItem(db, storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = e => reject(e.target.error);
    });
}

function removeItem(db, storeName, itemId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(itemId);

        request.onsuccess = () => resolve();
        request.onerror = e => reject(e.target.error);
    });
}
