/**
 * Service for registering and managing service workers
 */

// Service worker registration status
export type ServiceWorkerStatus = 'pending' | 'registered' | 'failed';

// Service worker registration options
export interface ServiceWorkerRegistrationOptions {
  scope?: string;
  updateViaCache?: ServiceWorkerUpdateViaCache;
}

/**
 * Service Worker Registration Service
 * Provides a centralized way to register and manage service workers
 */
class ServiceWorkerRegistrationService {
  private registrations: Map<string, ServiceWorkerRegistration> = new Map();
  private registrationStatus: Map<string, ServiceWorkerStatus> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize the service worker system
   * This should be called once at application startup
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser');
      return false;
    }

    // Register the main service worker
    try {
      const registration = await this.registerServiceWorker('/sw.js');
      this.isInitialized = true;
      
      // Set up message handling for the main service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize service worker system:', error);
      return false;
    }
  }

  /**
   * Register a service worker
   * 
   * @param scriptUrl URL to the service worker script
   * @param options Registration options
   * @returns ServiceWorkerRegistration if successful
   */
  async registerServiceWorker(
    scriptUrl: string,
    options: ServiceWorkerRegistrationOptions = {}
  ): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    this.registrationStatus.set(scriptUrl, 'pending');

    try {
      const registration = await navigator.serviceWorker.register(scriptUrl, options);
      this.registrations.set(scriptUrl, registration);
      this.registrationStatus.set(scriptUrl, 'registered');
      
      console.log(`Service worker registered: ${scriptUrl}`);
      
      // Set up update checking
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log(`Service worker state changed: ${newWorker.state}`);
          });
        }
      });
      
      return registration;
    } catch (error) {
      this.registrationStatus.set(scriptUrl, 'failed');
      console.error(`Service worker registration failed for ${scriptUrl}:`, error);
      throw error;
    }
  }

  /**
   * Get the status of a service worker registration
   * 
   * @param scriptUrl URL of the service worker script
   * @returns Current registration status
   */
  getRegistrationStatus(scriptUrl: string): ServiceWorkerStatus {
    return this.registrationStatus.get(scriptUrl) || 'pending';
  }

  /**
   * Get a service worker registration
   * 
   * @param scriptUrl URL of the service worker script
   * @returns ServiceWorkerRegistration if found
   */
  getRegistration(scriptUrl: string): ServiceWorkerRegistration | undefined {
    return this.registrations.get(scriptUrl);
  }

  /**
   * Check if a service worker is active
   * 
   * @param scriptUrl URL of the service worker script
   * @returns true if the service worker is active
   */
  isServiceWorkerActive(scriptUrl: string): boolean {
    const registration = this.registrations.get(scriptUrl);
    return !!registration && !!registration.active;
  }

  /**
   * Update a service worker
   * 
   * @param scriptUrl URL of the service worker script
   * @returns true if update was triggered
   */
  async updateServiceWorker(scriptUrl: string): Promise<boolean> {
    const registration = this.registrations.get(scriptUrl);
    if (!registration) {
      return false;
    }

    try {
      await registration.update();
      return true;
    } catch (error) {
      console.error(`Failed to update service worker ${scriptUrl}:`, error);
      return false;
    }
  }

  /**
   * Unregister a service worker
   * 
   * @param scriptUrl URL of the service worker script
   * @returns true if unregistration was successful
   */
  async unregisterServiceWorker(scriptUrl: string): Promise<boolean> {
    const registration = this.registrations.get(scriptUrl);
    if (!registration) {
      return false;
    }

    try {
      const success = await registration.unregister();
      if (success) {
        this.registrations.delete(scriptUrl);
        this.registrationStatus.delete(scriptUrl);
      }
      return success;
    } catch (error) {
      console.error(`Failed to unregister service worker ${scriptUrl}:`, error);
      return false;
    }
  }

  /**
   * Handle messages from service workers
   */
  private handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, payload } = event.data || {};
    
    switch (type) {
      case 'SW_UPDATED':
        console.log('Service worker has been updated');
        // You can dispatch an event or update UI to notify the user
        window.dispatchEvent(new CustomEvent('serviceWorkerUpdated'));
        break;
      
      case 'CACHE_COMPLETE':
        console.log('Service worker has finished caching assets');
        break;
      
      default:
        // Handle other message types as needed
        break;
    }
  };
}

// Create a singleton instance
export const serviceWorkerRegistration = new ServiceWorkerRegistrationService();

export default serviceWorkerRegistration;
