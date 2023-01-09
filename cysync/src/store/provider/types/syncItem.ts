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
  coinId: string;
  module: string;
  isRefresh?: boolean;
  parentCoinId?: string;
  coinGroup: CoinGroup;
}

export abstract class SyncItem extends ExecutionQueueItem {
  public type: SyncItemOptions['type'];

  public coinId: string;

  public isRefresh: boolean;

  public retries: number;

  public parentCoinId?: string;

  public coinGroup: CoinGroup;

  constructor({
    type,
    coinId,
    module,
    isRefresh = false,
    parentCoinId,
    coinGroup
  }: SyncItemOptions) {
    super();
    this.type = type;
    this.isRefresh = isRefresh;
    this.module = module;
    this.retries = 0;
    this.parentCoinId = parentCoinId;
    this.coinGroup = coinGroup;
    this.coinId = coinId;
  }

  clone() {
    throw new Error('clone not implemented for this class');
  }
}
