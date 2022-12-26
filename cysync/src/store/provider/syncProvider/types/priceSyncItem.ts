import { CoinGroup } from '@cypherock/communication';

import { SyncItem } from '../../types/syncItem';

export interface PriceSyncItemOptions {
  coinId: string;
  coinType: string;
  days: 7 | 30 | 365;
  module: string;
  isRefresh?: boolean;
  parentCoinId?: string;
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
    parentCoinId,
    id,
    coinId
  }: PriceSyncItemOptions) {
    super({
      type: 'price',
      coinType,
      isRefresh,
      module,
      coinGroup,
      parentCoinId,
      coinId
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
        this.coinId === item.coinId &&
        this.id === item.id
      );
    }

    return false;
  }

  clone() {
    const newItem = new PriceSyncItem({
      coinId: this.coinId,
      days: this.days,
      coinType: this.coinType,
      isRefresh: this.isRefresh,
      module: this.module,
      parentCoinId: this.parentCoinId,
      coinGroup: this.coinGroup,
      id: this.id
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
