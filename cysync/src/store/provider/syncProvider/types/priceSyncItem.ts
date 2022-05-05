import { SyncItem } from './syncItem';

export interface PriceSyncItemOptions {
  coinType: string;
  days: 7 | 30 | 365;
  module: string;
  isRefresh?: boolean;
}

export class PriceSyncItem extends SyncItem {
  public days: 7 | 30 | 365;

  constructor({ days, coinType, isRefresh, module }: PriceSyncItemOptions) {
    super({ type: 'price', coinType, isRefresh, module });
    this.days = days;
  }

  equals(item: PriceSyncItem | SyncItem) {
    if (item instanceof PriceSyncItem) {
      return this.days === item.days && this.coinType === item.coinType;
    }

    return false;
  }

  clone() {
    const newItem = new PriceSyncItem({
      days: this.days,
      coinType: this.coinType,
      isRefresh: this.isRefresh,
      module: this.module
    });

    return newItem;
  }
}
