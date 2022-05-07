import { Coin2 } from '../../../../store/database/databaseInit';

import { BalanceSyncItem } from './balanceSyncItem';
import { HistorySyncItem } from './historySyncItem';
import { LatestPriceSyncItem } from './latestPriceSyncItem';
import { PriceSyncItem } from './priceSyncItem';

export type SyncQueueItem =
  | HistorySyncItem
  | PriceSyncItem
  | BalanceSyncItem
  | LatestPriceSyncItem;

export interface SyncProviderTypes {
  addToQueue: (item: SyncQueueItem) => void;
  addHistorySyncItemFromXpub: (
    coin: Coin2,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addBalanceSyncItemFromXpub: (
    coin: Coin2,
    options: { token?: string; module?: string; isRefresh?: boolean }
  ) => void;
  addPriceSyncItemFromXpub: (
    coin: Coin2,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addLatestPriceSyncItemFromXpub: (
    coin: Coin2,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
}
