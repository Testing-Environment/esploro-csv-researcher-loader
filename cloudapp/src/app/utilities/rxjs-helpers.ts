import { Observable, Subscription } from 'rxjs';

/**
 * Custom error class for empty observables
 * Mimics RxJS 7+ EmptyError
 */
export class ObservableEmptyError extends Error {
  constructor() {
    super('Observable completed without emitting a value.');
    this.name = 'ObservableEmptyError';
  }
}

/**
 * Custom implementation of firstValueFrom for RxJS 6 compatibility
 * Converts an Observable to a Promise that resolves with the first emitted value
 * 
 * This is a polyfill for RxJS 7+'s firstValueFrom function
 * Use this instead of deprecated toPromise() method
 * 
 * @param source - The observable to convert
 * @returns Promise that resolves with the first emitted value
 * @throws ObservableEmptyError if observable completes without emitting
 */
export function firstValueFrom<T>(source: Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    let hasValue = false;
    let subscription: Subscription | null = null;

    subscription = source.subscribe({
      next: value => {
        if (!hasValue) {
          hasValue = true;
          resolve(value);
          subscription?.unsubscribe();
        }
      },
      error: err => {
        reject(err);
        subscription?.unsubscribe();
      },
      complete: () => {
        if (!hasValue) {
          reject(new ObservableEmptyError());
        }
      }
    });
  });
}

/**
 * Custom implementation of lastValueFrom for RxJS 6 compatibility
 * Converts an Observable to a Promise that resolves with the last emitted value
 * 
 * This is a polyfill for RxJS 7+'s lastValueFrom function
 * Use this instead of deprecated toPromise() method
 * 
 * @param source - The observable to convert
 * @returns Promise that resolves with the last emitted value
 * @throws ObservableEmptyError if observable completes without emitting
 */
export function lastValueFrom<T>(source: Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    let hasValue = false;
    let lastValue: T | undefined;
    const subscription = source.subscribe({
      next: value => {
        hasValue = true;
        lastValue = value;
      },
      error: err => {
        reject(err);
        subscription.unsubscribe();
      },
      complete: () => {
        if (hasValue) {
          resolve(lastValue as T);
        } else {
          reject(new ObservableEmptyError());
        }
      }
    });
  });
}
