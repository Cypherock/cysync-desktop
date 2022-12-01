import { CoinGroup } from '@cypherock/communication';

import { SyncItem } from '../../types/syncItem';

export interface PriceSyncItemOptions {
  coinType: string;
  days: 7 | 30 | 365;
  module: string;
  isRefresh?: boolean;
  parentCoin?: string;
  id?: string;
  coinGroup: CoinGroup;
}

export class PriceSyncItem extends SyncItem {
  public days: 7 | 30 | 365;
  public id: string | undefined;

  constructor({
    days,
    coinType,
    isRefresh,
    module,
    coinGroup,
    parentCoin,
    id
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
    this.id = id;
  }

  equals(item: PriceSyncItem | SyncItem) {
    if (item instanceof PriceSyncItem) {
      return (
        this.days === item.days &&
        this.coinType === item.coinType &&
        this.coinGroup === item.coinGroup &&
        this.id === item.id
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
      coinGroup: this.coinGroup,
      id: this.id
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
