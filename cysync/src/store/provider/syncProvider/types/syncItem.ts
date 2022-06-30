import { CoinGroup } from '@cypherock/communication';

export interface SyncItemOptions {
  type: 'history' | 'price' | 'balance' | 'wallet-setup' | 'latestPrice';
  coinType: string;
  module: string;
  isRefresh?: boolean;
  parentCoin?: string;
  coinGroup: CoinGroup;
}

export abstract class SyncItem {
  public type: SyncItemOptions['type'];

  public coinType: string;

  public isRefresh: boolean;

  public retries: number;

  public module: string;

  public parentCoin?: string;

  public coinGroup: CoinGroup;

  constructor({
    type,
    coinType,
    module,
    isRefresh = false,
    parentCoin,
    coinGroup
  }: SyncItemOptions) {
    this.type = type;
    this.coinType = coinType;
    this.isRefresh = isRefresh;
    this.module = module;
    this.retries = 0;
    this.parentCoin = parentCoin;
    this.coinGroup = coinGroup;
  }

  equals(_item: SyncItem) {
    throw new Error('equals not implemented for this class');
  }

  clone() {
    throw new Error('clone not implemented for this class');
  }
}
