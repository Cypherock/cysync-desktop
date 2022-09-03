import { useRef } from 'react';

import logger from './logger';

export type DeferredPromise<DeferType> = {
  resolve: (value: DeferType) => void;
  reject: (value: unknown) => void;
  promise: Promise<DeferType>;
};

// Always resolve or reject the promise to prevent memory leaks.
export class DeferredReference<DeferType> {
  deferRef: React.MutableRefObject<DeferredPromise<DeferType>>;
  constructor() {
    this.deferRef = useRef<DeferredPromise<DeferType>>(null);

    const deferred = {} as DeferredPromise<DeferType>;

    const promise = new Promise<DeferType>((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    deferred.promise = promise;
    this.deferRef.current = deferred;
  }
  public get promise() {
    return this.deferRef.current.promise;
  }
  public resolve(value: any) {
    this.deferRef.current.resolve(value);
    logger.debug('resolved promise');
  }
  public reject(value: any) {
    this.deferRef.current.reject(value);
  }
}
