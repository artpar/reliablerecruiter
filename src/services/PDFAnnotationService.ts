import serviceWorkerRegistration from './ServiceWorkerRegistrationService';
import {SearchResult} from './PDFService';
import {WorkerService} from "./WorkerService";

/**
 * Search for text in PDF
 */
export const searchText = async (
    pdfData: ArrayBuffer,
    searchText: string,
    options: { matchCase?: boolean; wholeWord?: boolean } = {}
): Promise<SearchResult[]> => {
    try {
        // Make sure service worker is initialized
        if (!serviceWorkerRegistration.isServiceWorkerActive('/sw.js')) {
            await serviceWorkerRegistration.initialize();
        }

        // Use the service worker to search the PDF
        return await WorkerService.executeTask('pdfSearchWorker', {
            content: pdfData,
            action: "search",
            searchText: searchText,
            options: options
        });
    } catch (error) {
        console.error('Error searching PDF:', error);
        throw new Error(`PDF search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};
