/**
 * PDF Worker Manager
 * Centralizes communication with PDF-related workers
 */

// PDF worker task types
export type PDFTaskType = 'extract' | 'search' | 'extractAnnotations' | 'saveAnnotations';

// PDF worker task payload
export interface PDFTaskPayload {
    action: PDFTaskType;
    content: ArrayBuffer;
    options?: Record<string, any>;
}

// PDF worker response
export interface PDFWorkerResponse {
    success: boolean;
    result?: any;
    error?: string;
}

/**
 * Execute a PDF task using the service worker
 *
 * @param taskType Type of task ('PDF_TASK' or 'PDF_ANNOTATION_TASK')
 * @param payload Task payload
 * @returns Promise with the result
 */
export async function executePDFTask<T>(
    taskType: 'PDF_TASK' | 'PDF_ANNOTATION_TASK',
    payload: PDFTaskPayload
): Promise<T> {
    return new Promise((resolve, reject) => {
        // Check if service worker is available
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
            reject(new Error('Service worker is not available'));
            return;
        }

        // Create a message channel for this request
        const messageChannel = new MessageChannel();

        // Set up response handler
        messageChannel.port1.onmessage = (event) => {
            const response = event.data as PDFWorkerResponse;

            if (response.success) {
                resolve(response.result as T);
            } else {
                reject(new Error(response.error || 'Unknown error in PDF processing'));
            }

            // Clean up
            messageChannel.port1.close();
        };

        // Send the message to the service worker
        navigator.serviceWorker.controller.postMessage({
            type: taskType,
            payload
        }, [messageChannel.port2]);
    });
}

/**
 * PDF task executor for general PDF operations
 */
export async function executePDFGeneralTask<T>(
    action: PDFTaskType,
    content: ArrayBuffer,
    options?: Record<string, any>
): Promise<T> {
    return executePDFTask<T>('PDF_TASK', {
        action,
        content,
        options
    });
}

/**
 * PDF task executor for annotation operations
 */
export async function executePDFAnnotationTask<T>(
    action: PDFTaskType,
    content: ArrayBuffer,
    options?: Record<string, any>
): Promise<T> {
    return executePDFTask<T>('PDF_ANNOTATION_TASK', {
        action,
        content,
        options
    });
}

export default {
    executePDFGeneralTask,
    executePDFAnnotationTask
};
