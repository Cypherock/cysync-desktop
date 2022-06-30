import { CoinGroup } from '@cypherock/communication';
import { SyncItem } from './syncItem';

export interface LatestPriceSyncItemOptions {
  coinType: string;
  parentCoin?: string;
  coinGroup: CoinGroup;
  module: string;
  isRefresh?: boolean;
}

export class LatestPriceSyncItem extends SyncItem {
  constructor({
    coinType,
    isRefresh,
    module,
    parentCoin,
    coinGroup
  }: LatestPriceSyncItemOptions) {
    super({
      type: 'latestPrice',
      coinType,
      isRefresh,
      module,
      coinGroup,
      parentCoin
    });
  }

  equals(item: LatestPriceSyncItem | SyncItem) {
    if (item instanceof LatestPriceSyncItem) {
      return (
        this.coinType === item.coinType &&
        this.coinGroup === item.coinGroup &&
        this.parentCoin === item.parentCoin
      );
    }

    return false;
  }

  clone() {
    const newItem = new LatestPriceSyncItem({
      coinType: this.coinType,
      parentCoin: this.parentCoin,
      coinGroup: this.coinGroup,
      isRefresh: this.isRefresh,
      module: this.module
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
