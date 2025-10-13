import { Injectable } from '@angular/core';

export type LogCategory = 
  | 'lifecycle' 
  | 'navigation' 
  | 'dataFlow' 
  | 'apiCalls' 
  | 'userActions' 
  | 'validation' 
  | 'jobProcessing';

/**
 * Logger Configuration
 * Set enableDebugLogging to true to enable all console logging
 * Individual categories can be toggled independently
 */
export const LoggerConfig = {
  enableDebugLogging: true,  // Master toggle - set to true to enable logging
  showInstructionsEnabled: false, // Controls visibility of instructional UI elements
  logCategories: {
    lifecycle: false,      // Component init/destroy
    navigation: false,     // Stage transitions, route changes
    dataFlow: true,       // Form values, state changes
    apiCalls: true,       // HTTP requests/responses
    userActions: true,    // Button clicks, toggle changes
    validation: true,     // Form validation, error states
    jobProcessing: true   // Job automation, polling, verification
  }
};

/**
 * Centralized logging service with toggle-able debug logging
 * 
 * Usage:
 * 1. Set LoggerConfig.enableDebugLogging = true to enable logging
 * 2. Inject this service into components/services
 * 3. Call appropriate log methods
 * 
 * Example:
 *   this.logger.lifecycle('Component initialized', { stage: this.stage });
 *   this.logger.apiCall('/assets/123', 'GET', null, response);
 *   this.logger.userAction('Toggle changed', { newValue: true });
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  private get isEnabled(): boolean {
    return LoggerConfig.enableDebugLogging;
  }

  private isCategoryEnabled(category: LogCategory): boolean {
    return this.isEnabled && LoggerConfig.logCategories[category];
  }

  /**
   * Toggle helper for instructional UI elements
   */
  get showInstructionsEnabled(): boolean {
    return LoggerConfig.showInstructionsEnabled;
  }

  set showInstructionsEnabled(value: boolean) {
    LoggerConfig.showInstructionsEnabled = value;
  }

  /**
   * Log lifecycle events (component init/destroy)
   */
  lifecycle(message: string, data?: any): void {
    this.log('lifecycle', '🔄 LIFECYCLE', message, data);
  }

  /**
   * Log navigation/stage transitions
   */
  navigation(message: string, data?: any): void {
    this.log('navigation', '🧭 NAVIGATION', message, data);
  }

  /**
   * Log data flow and state changes
   */
  dataFlow(message: string, data?: any): void {
    this.log('dataFlow', '📊 DATA FLOW', message, data);
  }

  /**
   * Log API calls with request/response
   */
  apiCall(endpoint: string, method: string, payload?: any, response?: any): void {
    if (!this.isCategoryEnabled('apiCalls')) return;

    const timestamp = this.getTimestamp();
    console.group(`🌐 API CALL [${timestamp}] ${method} ${endpoint}`);
    
    if (payload !== undefined && payload !== null) {
      console.log('Request Payload:', this.sanitize(payload));
    }
    
    if (response !== undefined && response !== null) {
      console.log('Response:', response);
    }
    
    console.groupEnd();
  }

  /**
   * Log user interactions
   */
  userAction(action: string, details?: any): void {
    this.log('userActions', '👆 USER ACTION', action, details);
  }

  /**
   * Log validation results
   */
  validation(context: string, isValid: boolean, errors?: any): void {
    if (!this.isCategoryEnabled('validation')) return;

    const timestamp = this.getTimestamp();
    const icon = isValid ? '✅' : '❌';
    console.log(`${icon} VALIDATION [${timestamp}] ${context}`, { isValid, errors });
  }

  /**
   * Log job processing events
   */
  jobProcessing(event: string, data?: any): void {
    this.log('jobProcessing', '⚙️ JOB PROCESSING', event, data);
  }

  /**
   * Log errors with stack trace
   */
  error(context: string, error: any): void {
    // Always log errors, even if debug logging is disabled
    const timestamp = this.getTimestamp();
    
    console.group(`❌ ERROR [${timestamp}] ${context}`);
    
    // Log the error object
    if (error) {
      console.error('Error Object:', error);
      
      // Log specific error properties if they exist (RestError format)
      if (error.status !== undefined) {
        console.error('Status:', error.status);
      }
      if (error.statusText) {
        console.error('Status Text:', error.statusText);
      }
      if (error.message) {
        console.error('Message:', error.message);
      }
      
      // Log nested error details from Ex Libris API
      if (error.error?.errorList?.error) {
        console.error('API Error Details:', error.error.errorList.error);
      }
    }
    
    console.groupEnd();
  }

  /**
   * Generic log method
   */
  private log(category: LogCategory, prefix: string, message: string, data?: any): void {
    if (!this.isCategoryEnabled(category)) return;

    const timestamp = this.getTimestamp();
    
    if (data !== undefined && data !== null) {
      console.log(`${prefix} [${timestamp}] ${message}`, this.sanitize(data));
    } else {
      console.log(`${prefix} [${timestamp}] ${message}`);
    }
  }

  /**
   * Get formatted timestamp
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitize(data: any): any {
    if (!data) return data;

    // Don't clone primitives
    if (typeof data !== 'object') return data;

    try {
      // Clone to avoid mutating original
      const cloned = JSON.parse(JSON.stringify(data));

      // Remove sensitive fields
      const sensitiveKeys = ['password', 'token', 'apikey', 'secret', 'authorization', 'auth'];
      
      const removeSensitive = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;

        for (const key in obj) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            obj[key] = '***REDACTED***';
          } else if (typeof obj[key] === 'object') {
            removeSensitive(obj[key]);
          }
        }
        return obj;
      };

      return removeSensitive(cloned);
    } catch (error) {
      // If cloning fails, return simplified version
      return `[Complex Object: ${typeof data}]`;
    }
  }
}
