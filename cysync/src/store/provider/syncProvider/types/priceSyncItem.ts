import { CoinGroup } from '@cypherock/communication';
import { SyncItem } from './syncItem';

export interface PriceSyncItemOptions {
  coinType: string;
  days: 7 | 30 | 365;
  module: string;
  isRefresh?: boolean;
  parentCoin?: string;
  coinGroup: CoinGroup;
}

export class PriceSyncItem extends SyncItem {
  public days: 7 | 30 | 365;

  constructor({
    days,
    coinType,
    isRefresh,
    module,
    coinGroup,
    parentCoin
  }: PriceSyncItemOptions) {
    super({
      type: 'price',
      coinType,
      isRefresh,
      module,
      coinGroup,
      parentCoin
    });
    this.days = days;
  }

  equals(item: PriceSyncItem | SyncItem) {
    if (item instanceof PriceSyncItem) {
      return (
        this.days === item.days &&
        this.coinType === item.coinType &&
        this.coinGroup === item.coinGroup
      );
    }

    return false;
  }

  clone() {
    const newItem = new PriceSyncItem({
      days: this.days,
      coinType: this.coinType,
      isRefresh: this.isRefresh,
      module: this.module,
      parentCoin: this.parentCoin,
      coinGroup: this.coinGroup
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
