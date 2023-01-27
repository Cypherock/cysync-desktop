import { CoinGroup } from '@cypherock/communication';

import { Account } from '../../../../store/database/databaseInit';
import { TxnStatusItem } from '../../transactionStatusProvider/txnStatusItem';

import { BalanceSyncItem } from './balanceSyncItem';
import { HistorySyncItem } from './historySyncItem';
import { LatestPriceSyncItem } from './latestPriceSyncItem';
import { PriceSyncItem } from './priceSyncItem';

export interface ModifiedAccount extends Account {
  parentCoinId?: string;
  isSub?: boolean;
  coinGroup?: CoinGroup;
  id?: string;
}

export type SyncQueueItem =
  | HistorySyncItem
  | PriceSyncItem
  | BalanceSyncItem
  | LatestPriceSyncItem
  | TxnStatusItem;

export interface SyncProviderTypes {
  addToQueue: (item: SyncQueueItem) => void;
  addHistorySyncItemFromAccount: (
    account: ModifiedAccount,
    options: { module?: string; isRefresh?: boolean; customAccount?: string }
  ) => void;
  addBalanceSyncItemFromAccount: (
    account: ModifiedAccount,
    options: {
      token?: string;
      module?: string;
      isRefresh?: boolean;
      customAccount?: string;
    }
  ) => void;
  addPriceSyncItemFromAccount: (
    account: Omit<
      ModifiedAccount,
      | 'xpub'
      | 'name'
      | 'derivationPath'
      | 'walletId'
      | 'accountIndex'
      | 'totalBalance'
      | 'totalUnconfirmedBalance'
      | 'accountType'
    >,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addCustomAccountSyncItemFromAccount: (
    account: Account,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addLatestPriceSyncItemFromAccount: (
    account: Omit<
      ModifiedAccount,
      | 'xpub'
      | 'name'
      | 'derivationPath'
      | 'walletId'
      | 'accountIndex'
      | 'totalBalance'
      | 'totalUnconfirmedBalance'
      | 'accountType'
    >,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
}
