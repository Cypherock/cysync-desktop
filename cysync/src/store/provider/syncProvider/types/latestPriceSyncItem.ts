import { SyncItem } from './syncItem';

export interface LatestPriceSyncItemOptions {
  coinType: string;
  module: string;
  isRefresh?: boolean;
}

export class LatestPriceSyncItem extends SyncItem {
  constructor({ coinType, isRefresh, module }: LatestPriceSyncItemOptions) {
    super({ type: 'latestPrice', coinType, isRefresh, module });
  }

  equals(item: LatestPriceSyncItem | SyncItem) {
    if (item instanceof LatestPriceSyncItem) {
      return this.coinType === item.coinType;
    }

    return false;
  }

  clone() {
    const newItem = new LatestPriceSyncItem({
      coinType: this.coinType,
      isRefresh: this.isRefresh,
      module: this.module
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
