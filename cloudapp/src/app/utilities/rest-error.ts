import { LoggerService } from '../services/logger.service';

/**
 * Convert a Cloud App REST error into a user-facing message with
 * additional diagnostic detail when available.
 */
export function parseRestError(error: any, taskName: string, logger?: LoggerService): string {
  let message = `${taskName} failed. Please try again.`;

  try {
    if (error?.status && error?.statusText) {
      const status = error.status;
      const statusText = error.statusText;
      const errorMessage = error.message || 'No additional details available.';

      let additionalDetails = '';
      if (error?.error?.errorList?.error?.[0]) {
        const apiError = error.error.errorList.error[0];
        if (apiError.errorCode) {
          additionalDetails += ` Error Code: ${apiError.errorCode}.`;
        }
        if (apiError.errorMessage && apiError.errorMessage.trim()) {
          additionalDetails += ` ${apiError.errorMessage}.`;
        }
        if (apiError.trackingId && apiError.trackingId !== 'unknown') {
          additionalDetails += ` Tracking ID: ${apiError.trackingId}.`;
        }
      }

      message = `${taskName} failed - ${statusText}. Status: ${status} - ${errorMessage}.${additionalDetails} You may need to manually perform ${taskName}.`;
    } else if (error?.message) {
      message = `${taskName} failed: ${error.message}. You may need to manually perform ${taskName}.`;
    }
  } catch (parseError) {
    logger?.error('Error parsing RestError', parseError);
  }

  return message;
}
