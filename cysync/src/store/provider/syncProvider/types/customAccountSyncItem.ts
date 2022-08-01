import { CoinGroup } from '@cypherock/communication';

import { SyncItem } from './syncItem';

export interface CustomAccountSyncItemOptions {
  coinType: string;
  xpub: string;
  walletId: string;
  module: string;
  isRefresh?: boolean;
}

export class CustomAccountSyncItem extends SyncItem {
  public walletId: string;
  public xpub: string;

  constructor({
    coinType,
    xpub,
    walletId,
    module,
    isRefresh
  }: CustomAccountSyncItemOptions) {
    super({
      type: 'customAccount',
      coinGroup: CoinGroup.Near,
      coinType,
      isRefresh,
      module
    });
    this.walletId = walletId;
    this.xpub = xpub;
  }

  equals(item: CustomAccountSyncItem | SyncItem) {
    if (item instanceof CustomAccountSyncItem) {
      return (
        this.coinType === item.coinType &&
        this.walletId === item.walletId &&
        this.xpub === item.xpub
      );
    }

    return false;
  }

  clone() {
    const newItem = new CustomAccountSyncItem({
      coinType: this.coinType,
      walletId: this.walletId,
      xpub: this.xpub,
      module: this.module,
      isRefresh: this.isRefresh
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
