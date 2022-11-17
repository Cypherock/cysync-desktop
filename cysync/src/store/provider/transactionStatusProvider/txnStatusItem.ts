import { CoinGroup } from '@cypherock/communication';

export interface TxnStatusSyncItemOptions {
  walletId: string;
  coinType: string;
  coinGroup: CoinGroup;
  isRefresh: boolean;
  txnHash: string;
  sender: string;
  backoffTime: number;
}

export class TxnStatusItem implements TxnStatusSyncItemOptions {
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
    backoffTime
  }: TxnStatusSyncItemOptions) {
    this.walletId = walletId;
    this.txnHash = txnHash;
    this.sender = sender;
    this.coinType = coinType;
    this.coinGroup = coinGroup;
    this.isRefresh = isRefresh;
    this.backoffTime = backoffTime;
    this.backoffFactor = 1;
  }

  coinType: string;
  isRefresh: boolean;
  coinGroup: CoinGroup;
  parentCoin: string;
  retries = 2;

  equals(item: TxnStatusItem) {
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
      backoffTime: this.backoffTime
    });
    newItem.backoffFactor = this.backoffFactor;
    return newItem;
  }
}
