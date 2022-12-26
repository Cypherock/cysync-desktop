import { CoinGroup } from '@cypherock/communication';

import { SyncItem } from '../../types/syncItem';

export interface BalanceSyncItemOptions {
  accountId: string;
  coinId: string;
  coinType: string;
  xpub: string;
  walletId: string;
  module: string;
  parentCoinId?: string;
  coinGroup: CoinGroup;
  accountType?: string;
  customAccount?: string;
  isRefresh?: boolean;
}

export class BalanceSyncItem extends SyncItem {
  public accountId: string;

  public xpub: string;

  public walletId: string;

  public accountType?: string;

  public customAccount?: string;

  constructor({
    xpub,
    accountType,
    coinType,
    walletId,
    parentCoinId: parentCoinId,
    coinGroup,
    customAccount,
    module,
    isRefresh,
    coinId,
    accountId
  }: BalanceSyncItemOptions) {
    super({
      type: 'balance',
      coinType,
      isRefresh,
      module,
      coinGroup,
      parentCoinId,
      coinId
    });
    this.xpub = xpub;
    this.accountType = accountType;
    this.walletId = walletId;
    this.customAccount = customAccount;
    this.accountId = accountId;
  }

  equals(item: BalanceSyncItem | SyncItem) {
    if (item instanceof BalanceSyncItem) {
      return (
        this.xpub === item.xpub &&
        this.coinType === item.coinType &&
        this.coinGroup === item.coinGroup &&
        this.coinId === item.coinId &&
        this.customAccount === item.customAccount
      );
    }

    return false;
  }

  clone() {
    const newItem = new BalanceSyncItem({
      accountId: this.accountId,
      xpub: this.xpub,
      accountType: this.accountType,
      coinId: this.coinId,
      coinType: this.coinType,
      walletId: this.walletId,
      parentCoinId: this.parentCoinId,
      coinGroup: this.coinGroup,
      customAccount: this.customAccount,
      module: this.module,
      isRefresh: this.isRefresh
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
