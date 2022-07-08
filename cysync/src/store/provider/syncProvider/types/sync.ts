import { CoinGroup } from '@cypherock/communication';

import { Coin } from '../../../../store/database/databaseInit';

import { BalanceSyncItem } from './balanceSyncItem';
import { HistorySyncItem } from './historySyncItem';
import { LatestPriceSyncItem } from './latestPriceSyncItem';
import { PriceSyncItem } from './priceSyncItem';

export interface ModifiedCoin extends Coin {
  parentCoin?: string;
  coinGroup?: CoinGroup;
}

export type SyncQueueItem =
  | HistorySyncItem
  | PriceSyncItem
  | BalanceSyncItem
  | LatestPriceSyncItem;

export interface SyncProviderTypes {
  addToQueue: (item: SyncQueueItem) => void;
  addHistorySyncItemFromCoin: (
    coin: ModifiedCoin,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addBalanceSyncItemFromCoin: (
    coin: ModifiedCoin,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addPriceSyncItemFromCoin: (
    coin: ModifiedCoin,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addLatestPriceSyncItemFromCoin: (
    coin: ModifiedCoin,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
}
