import { CoinGroup, COINS } from '@cypherock/communication';

import { SyncItem } from './syncItem';

export interface HistorySyncItemOptions {
  coinType: string;
  xpub: string;
  walletName: string;
  walletId: string;
  module: string;
  zpub?: string;
  page?: number;
  afterBlock?: number;
  parentCoin?: string;
  coinGroup: CoinGroup;
  isRefresh?: boolean;
  customAccount?: string;
}

export class HistorySyncItem extends SyncItem {
  public walletName: string;

  public walletId: string;

  public xpub: string;

  public zpub?: string;

  public page?: number;

  public afterBlock?: number;

  public customAccount?: string;

  constructor({
    xpub,
    zpub,
    walletName,
    walletId,
    coinType,
    module,
    page,
    afterBlock,
    isRefresh,
    parentCoin,
    coinGroup,
    customAccount
  }: HistorySyncItemOptions) {
    super({
      type: 'history',
      coinType,
      isRefresh,
      module,
      parentCoin,
      coinGroup
    });
    this.xpub = xpub;
    this.zpub = zpub;
    this.walletName = walletName;
    this.walletId = walletId;
    this.page = page;
    this.afterBlock = afterBlock;
    this.customAccount = customAccount;
  }

  equals(item: HistorySyncItem | SyncItem) {
    if (item instanceof HistorySyncItem) {
      const coin = COINS[item.coinType];
      if (coin && coin.group === CoinGroup.Ethereum) {
        return this.xpub === item.xpub && this.coinType === item.coinType;
      }
      return (
        this.walletName === item.walletName &&
        this.coinType === item.coinType &&
        this.customAccount === item.customAccount
      );
    }

    return false;
  }

  clone() {
    const newItem = new HistorySyncItem({
      xpub: this.xpub,
      zpub: this.zpub,
      walletName: this.walletName,
      walletId: this.walletId,
      coinType: this.coinType,
      module: this.module,
      page: this.page,
      afterBlock: this.afterBlock,
      isRefresh: this.isRefresh,
      coinGroup: this.coinGroup,
      parentCoin: this.parentCoin,
      customAccount: this.customAccount
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
