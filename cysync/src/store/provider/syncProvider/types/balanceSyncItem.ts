import { CoinGroup } from '@cypherock/communication';

import { SyncItem } from '../../types/syncItem';

export interface BalanceSyncItemOptions {
  coinType: string;
  xpub: string;
  walletId: string;
  module: string;
  parentCoin?: string;
  coinGroup: CoinGroup;
  zpub?: string;
  customAccount?: string;
  isRefresh?: boolean;
}

export class BalanceSyncItem extends SyncItem {
  public xpub: string;

  public walletId: string;

  public zpub?: string;

  public customAccount?: string;

  constructor({
    xpub,
    zpub,
    coinType,
    walletId,
    parentCoin,
    coinGroup,
    customAccount,
    module,
    isRefresh
  }: BalanceSyncItemOptions) {
    super({
      type: 'balance',
      coinType,
      isRefresh,
      module,
      coinGroup,
      parentCoin
    });
    this.xpub = xpub;
    this.zpub = zpub;
    this.walletId = walletId;
    this.customAccount = customAccount;
  }

  equals(item: BalanceSyncItem | SyncItem) {
    if (item instanceof BalanceSyncItem) {
      return (
        this.xpub === item.xpub &&
        this.coinType === item.coinType &&
        this.coinGroup === item.coinGroup &&
        this.customAccount === item.customAccount
      );
    }

    return false;
  }

  clone() {
    const newItem = new BalanceSyncItem({
      xpub: this.xpub,
      zpub: this.zpub,
      coinType: this.coinType,
      walletId: this.walletId,
      parentCoin: this.parentCoin,
      coinGroup: this.coinGroup,
      customAccount: this.customAccount,
      module: this.module,
      isRefresh: this.isRefresh
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
