import { SyncItem } from './syncItem';

export interface BalanceSyncItemOptions {
  coinType: string;
  xpub: string;
  walletId: string;
  module: string;
  ethCoin?: string;
  zpub?: string;
  customAccount?: string;
  isRefresh?: boolean;
}

export class BalanceSyncItem extends SyncItem {
  public xpub: string;

  public walletId: string;

  public zpub?: string;

  public ethCoin?: string;

  public customAccount?: string;

  constructor({
    xpub,
    zpub,
    coinType,
    walletId,
    ethCoin,
    customAccount,
    module,
    isRefresh
  }: BalanceSyncItemOptions) {
    super({ type: 'balance', coinType, isRefresh, module });
    this.xpub = xpub;
    this.zpub = zpub;
    this.walletId = walletId;
    this.ethCoin = ethCoin;
    this.customAccount = customAccount;
  }

  equals(item: BalanceSyncItem | SyncItem) {
    if (item instanceof BalanceSyncItem) {
      return (
        this.xpub === item.xpub &&
        this.coinType === item.coinType &&
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
      ethCoin: this.ethCoin,
      customAccount: this.customAccount,
      module: this.module,
      isRefresh: this.isRefresh
    });

    newItem.retries = this.retries;

    return newItem;
  }
}
