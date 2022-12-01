import { CoinGroup } from '@cypherock/communication';

import { SyncItem } from '../../../hooks';

export interface LatestPriceSyncItemOptions {
  coinType: string;
  parentCoin?: string;
  coinGroup: CoinGroup;
  module: string;
  isRefresh?: boolean;
  id?: string;
}

export class LatestPriceSyncItem extends SyncItem {
  public id: string | undefined;
  constructor({
    coinType,
    isRefresh,
    module,
    parentCoin,
    coinGroup,
    id
  }: LatestPriceSyncItemOptions) {
    super({
      type: 'latestPrice',
      coinType,
      isRefresh,
      module,
      coinGroup,
      parentCoin
    });
    this.id = id;
  }

  equals(item: LatestPriceSyncItem | SyncItem) {
    if (item instanceof LatestPriceSyncItem) {
      return (
        this.coinType === item.coinType &&
        this.coinGroup === item.coinGroup &&
        this.parentCoin === item.parentCoin &&
        this.id === item.id
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
      module: this.module,
      id: this.id
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
