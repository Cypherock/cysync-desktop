import { CoinGroup } from '@cypherock/communication';

import { SyncItem } from '../../types/syncItem';

export interface LatestPriceSyncItemOptions {
  coinId: string;
  parentCoinId?: string;
  coinGroup: CoinGroup;
  module: string;
  isRefresh?: boolean;
  id?: string;
}

export class LatestPriceSyncItem extends SyncItem {
  public id: string | undefined;
  constructor({
    isRefresh,
    module,
    parentCoinId,
    coinGroup,
    id,
    coinId
  }: LatestPriceSyncItemOptions) {
    super({
      type: 'latestPrice',
      isRefresh,
      module,
      coinGroup,
      parentCoinId,
      coinId
    });
    this.id = id;
  }

  equals(item: LatestPriceSyncItem | SyncItem) {
    if (item instanceof LatestPriceSyncItem) {
      return (
        this.coinGroup === item.coinGroup &&
        this.parentCoinId === item.parentCoinId &&
        this.coinId === item.coinId &&
        this.id === item.id
      );
    }

    return false;
  }

  clone() {
    const newItem = new LatestPriceSyncItem({
      coinId: this.coinId,
      parentCoinId: this.parentCoinId,
      coinGroup: this.coinGroup,
      isRefresh: this.isRefresh,
      module: this.module,
      id: this.id
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
