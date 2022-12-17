import { CoinGroup } from '@cypherock/communication';

import { ExecutionQueueItem } from '../../hooks/useExecutionQueue';

export interface SyncItemOptions {
  type:
    | 'history'
    | 'price'
    | 'balance'
    | 'wallet-setup'
    | 'latestPrice'
    | 'customAccount'
    | 'txnStatus';
  coinType: string;
  module: string;
  isRefresh?: boolean;
  parentCoin?: string;
  coinGroup: CoinGroup;
}

export abstract class SyncItem extends ExecutionQueueItem {
  public type: SyncItemOptions['type'];

  public coinType: string;

  public isRefresh: boolean;

  public retries: number;

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
    super();
    this.type = type;
    this.coinType = coinType;
    this.isRefresh = isRefresh;
    this.module = module;
    this.retries = 0;
    this.parentCoin = parentCoin;
    this.coinGroup = coinGroup;
  }

  clone() {
    throw new Error('clone not implemented for this class');
  }
}
