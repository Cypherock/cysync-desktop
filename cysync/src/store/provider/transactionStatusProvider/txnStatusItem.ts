import { CoinGroup } from '@cypherock/communication';

import { SyncQueueItem } from '../syncProvider/types';
import { SyncItem } from '../types/syncItem';

export interface TxnStatusSyncItemOptions {
  accountId: string;
  coinId: string;
  parentCoinId?: string;
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
  public accountId: string;
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
    backoffTime,
    accountId,
    coinId,
    parentCoinId
  }: TxnStatusSyncItemOptions) {
    super({
      type: 'txnStatus',
      coinType,
      coinId,
      parentCoinId,
      isRefresh,
      module,
      coinGroup
    });
    this.accountId = accountId;
    this.walletId = walletId;
    this.txnHash = txnHash;
    this.sender = sender;
    this.backoffTime = backoffTime;
    this.backoffFactor = 1;
  }

  equals(item: SyncQueueItem) {
    if (item instanceof TxnStatusItem) {
      return this.accountId === item.accountId && this.txnHash === item.txnHash;
    }

    return false;
  }

  clone() {
    const newItem = new TxnStatusItem({
      accountId: this.accountId,
      coinId: this.coinId,
      parentCoinId: this.parentCoinId,
      walletId: this.walletId,
      txnHash: this.txnHash,
      sender: this.sender,
      coinType: this.coinType,
      coinGroup: this.coinGroup,
      isRefresh: this.isRefresh,
      module: this.module,
      parentCoin: this.parentCoinId,
      backoffTime: this.backoffTime
    });
    newItem.backoffFactor = this.backoffFactor;
    return newItem;
  }
}
