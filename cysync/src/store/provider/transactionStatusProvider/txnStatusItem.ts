import { CoinGroup } from '@cypherock/communication';

import { SyncQueueItem } from '../syncProvider/types';
import { SyncItem } from '../types/syncItem';

export interface TxnStatusSyncItemOptions {
  walletId: string;
  coinType: string;
  coinGroup: CoinGroup;
  isRefresh: boolean;
  txnHash: string;
  sender: string;
  backoffTime: number;
  module: string;
  parentCoin?: string;
}

export class TxnStatusItem extends SyncItem {
  public walletId: string;
  public txnHash: string;
  public sender: string; // needed in near RPC call param

  // Defines the exponential factor for subsequent status queries
  // backoffFactor = backoffExpMultiplier^retry
  public backoffFactor: number;

  // Defines the time to wait before next request
  // backoffTime = backoffBaseInterval * backoffFactor
  public backoffTime: number;

  constructor({
    walletId,
    txnHash,
    sender,
    coinType,
    coinGroup,
    isRefresh,
    module,
    parentCoin,
    backoffTime
  }: TxnStatusSyncItemOptions) {
    super({
      type: 'txnStatus',
      coinType,
      isRefresh,
      module,
      parentCoin,
      coinGroup
    });
    this.walletId = walletId;
    this.txnHash = txnHash;
    this.sender = sender;
    this.backoffTime = backoffTime;
    this.backoffFactor = 1;
  }

  equals(item: SyncQueueItem) {
    if (item instanceof TxnStatusItem) {
      return (
        this.walletId === item.walletId &&
        this.coinType === item.coinType &&
        this.coinGroup === item.coinGroup &&
        this.txnHash === item.txnHash
      );
    }

    return false;
  }

  clone() {
    const newItem = new TxnStatusItem({
      walletId: this.walletId,
      txnHash: this.txnHash,
      sender: this.sender,
      coinType: this.coinType,
      coinGroup: this.coinGroup,
      isRefresh: this.isRefresh,
      module: this.module,
      parentCoin: this.parentCoin,
      backoffTime: this.backoffTime
    });
    newItem.backoffFactor = this.backoffFactor;
    return newItem;
  }
}
