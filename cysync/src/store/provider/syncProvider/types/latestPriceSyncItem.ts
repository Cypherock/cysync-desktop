import { SyncItem } from './syncItem';

export interface LatestPriceSyncItemOptions {
  coinType: string;
  ethCoin?: string;
  module: string;
  isRefresh?: boolean;
}

export class LatestPriceSyncItem extends SyncItem {
  public ethCoin?: string;

  constructor({
    coinType,
    isRefresh,
    module,
    ethCoin
  }: LatestPriceSyncItemOptions) {
    super({ type: 'latestPrice', coinType, isRefresh, module });
    this.ethCoin = ethCoin;
  }

  equals(item: LatestPriceSyncItem | SyncItem) {
    if (item instanceof LatestPriceSyncItem) {
      return this.coinType === item.coinType && this.ethCoin === item.ethCoin;
    }

    return false;
  }

  clone() {
    const newItem = new LatestPriceSyncItem({
      coinType: this.coinType,
      ethCoin: this.ethCoin,
      isRefresh: this.isRefresh,
      module: this.module
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
