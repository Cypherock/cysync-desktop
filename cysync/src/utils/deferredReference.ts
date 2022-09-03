export type DeferredPromise<DeferType> = {
  resolve: (value: DeferType) => void;
  reject: (value: unknown) => void;
  promise: Promise<DeferType>;
};

// Always resolve or reject the promise to prevent memory leaks.
export class DeferredReference<DeferType> {
  deferRef: DeferredPromise<DeferType>;
  constructor() {
    this.deferRef = null as DeferredPromise<DeferType>;

    const deferred = {} as DeferredPromise<DeferType>;

    const promise = new Promise<DeferType>((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    deferred.promise = promise;
    this.deferRef = deferred;
  }
  public get promise() {
    return this.deferRef.promise;
  }
  public resolve(value: any) {
    this.deferRef.resolve(value);
  }
  public reject(value: any) {
    this.deferRef.reject(value);
  }
}
