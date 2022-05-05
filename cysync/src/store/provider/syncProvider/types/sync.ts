import { Xpub } from '@cypherock/database';

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
    xpub: Xpub,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addBalanceSyncItemFromXpub: (
    xpub: Xpub,
    options: { token?: string; module?: string; isRefresh?: boolean }
  ) => void;
  addPriceSyncItemFromXpub: (
    xpub: Xpub,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addLatestPriceSyncItemFromXpub: (
    xpub: Xpub,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
}
