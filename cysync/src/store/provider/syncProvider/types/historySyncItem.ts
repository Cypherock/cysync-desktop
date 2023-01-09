import { CoinGroup, COINS } from '@cypherock/communication';

import { SyncItem } from '../../types/syncItem';

export interface HistorySyncItemOptions {
  accountId: string;
  coinId: string;
  xpub: string;
  walletId: string;
  module: string;
  accountType?: string;
  page?: number;
  afterBlock?: number;
  afterTokenBlock?: number;
  parentCoin?: string;
  coinGroup: CoinGroup;
  isRefresh?: boolean;
  customAccount?: string;
  afterHash?: string;
  beforeHash?: string;
}

export class HistorySyncItem extends SyncItem {
  public accountId: string;

  public walletId: string;

  public xpub: string;

  public accountType?: string;

  public page?: number;

  public afterBlock?: number;

  public afterTokenBlock?: number;

  public customAccount?: string;

  public afterHash?: string;

  public beforeHash?: string;

  constructor({
    xpub,
    accountId,
    accountType,
    walletId,
    module,
    page,
    afterBlock,
    afterTokenBlock,
    isRefresh,
    parentCoin,
    coinGroup,
    customAccount,
    afterHash,
    beforeHash,
    coinId
  }: HistorySyncItemOptions) {
    super({
      type: 'history',
      isRefresh,
      module,
      parentCoinId: parentCoin,
      coinGroup,
      coinId
    });
    this.xpub = xpub;
    this.accountType = accountType;
    this.walletId = walletId;
    this.page = page;
    this.afterBlock = afterBlock;
    this.afterTokenBlock = afterTokenBlock;
    this.customAccount = customAccount;
    this.afterHash = afterHash;
    this.beforeHash = beforeHash;
    this.accountId = accountId;
  }

  equals(item: HistorySyncItem | SyncItem) {
    if (item instanceof HistorySyncItem) {
      const coin = COINS[item.coinId];
      if (coin && coin.group === CoinGroup.Ethereum) {
        return (
          this.xpub === item.xpub &&
          this.accountId === item.accountId &&
          this.coinId === item.coinId
        );
      }
      return (
        this.accountId === item.accountId &&
        this.coinId === item.coinId &&
        this.xpub === item.xpub &&
        this.accountType === item.accountType &&
        this.customAccount === item.customAccount &&
        this.afterTokenBlock === item.afterTokenBlock &&
        this.afterHash === item.afterHash &&
        this.beforeHash === item.beforeHash
      );
    }

    return false;
  }

  clone() {
    const newItem = new HistorySyncItem({
      accountId: this.accountId,
      xpub: this.xpub,
      coinId: this.coinId,
      accountType: this.accountType,
      walletId: this.walletId,
      module: this.module,
      page: this.page,
      afterBlock: this.afterBlock,
      afterTokenBlock: this.afterTokenBlock,
      isRefresh: this.isRefresh,
      coinGroup: this.coinGroup,
      parentCoin: this.parentCoinId,
      customAccount: this.customAccount,
      afterHash: this.afterHash,
      beforeHash: this.beforeHash
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
