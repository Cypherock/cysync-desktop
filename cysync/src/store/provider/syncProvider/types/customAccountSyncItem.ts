import { CoinGroup } from '@cypherock/communication';

import { SyncItem } from '../../types/syncItem';

export interface CustomAccountSyncItemOptions {
  accountId: string;
  accountIndex: number;
  accountType?: string;
  coinId: string;
  xpub: string;
  walletId: string;
  module: string;
  isRefresh?: boolean;
}

export class CustomAccountSyncItem extends SyncItem {
  public walletId: string;
  public xpub: string;
  public accountId: string;
  public accountIndex: number;
  public accountType: string;

  constructor({
    xpub,
    walletId,
    accountIndex,
    module,
    isRefresh,
    coinId,
    accountId,
    accountType
  }: CustomAccountSyncItemOptions) {
    super({
      type: 'customAccount',
      coinGroup: CoinGroup.Near,
      isRefresh,
      module,
      coinId
    });
    this.walletId = walletId;
    this.xpub = xpub;
    this.accountId = accountId;
    this.accountType = accountType;
    this.accountIndex = accountIndex;
  }

  equals(item: CustomAccountSyncItem | SyncItem) {
    if (item instanceof CustomAccountSyncItem) {
      return (
        this.walletId === item.walletId &&
        this.coinId === item.coinId &&
        this.accountId === item.accountId &&
        this.accountIndex === item.accountIndex &&
        this.accountType === item.accountType &&
        this.xpub === item.xpub
      );
    }

    return false;
  }

  clone() {
    const newItem = new CustomAccountSyncItem({
      accountId: this.accountId,
      accountType: this.accountType,
      coinId: this.coinId,
      walletId: this.walletId,
      xpub: this.xpub,
      module: this.module,
      isRefresh: this.isRefresh,
      accountIndex: this.accountIndex
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
