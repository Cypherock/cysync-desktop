import { ALLCOINS } from '@cypherock/communication';

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
  isRefresh?: boolean;
}

export class HistorySyncItem extends SyncItem {
  public walletName: string;

  public walletId: string;

  public xpub: string;

  public zpub?: string;

  public page?: number;

  public afterBlock?: number;

  constructor({
    xpub,
    zpub,
    walletName,
    walletId,
    coinType,
    module,
    page,
    afterBlock,
    isRefresh
  }: HistorySyncItemOptions) {
    super({ type: 'history', coinType, isRefresh, module });
    this.xpub = xpub;
    this.zpub = zpub;
    this.walletName = walletName;
    this.walletId = walletId;
    this.page = page;
    this.afterBlock = afterBlock;
  }

  equals(item: HistorySyncItem | SyncItem) {
    if (item instanceof HistorySyncItem) {
      const coin = ALLCOINS[item.coinType];
      if (coin && coin.isEth) {
        return this.xpub === item.xpub && this.coinType === item.coinType;
      }
      return (
        this.walletName === item.walletName && this.coinType === item.coinType
      );
    }

    return false;
  }
}
