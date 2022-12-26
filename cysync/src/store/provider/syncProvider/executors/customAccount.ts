import { CoinGroup, COINS, NearCoinData } from '@cypherock/communication';
import {
  IRequestMetadata,
  near as nearServer,
  serverBatch as batchServer
} from '@cypherock/server-wrapper';
import { NearWallet } from '@cypherock/wallet';

import { customAccountDb } from '../../../database';
import {
  BalanceSyncItem,
  CustomAccountSyncItem,
  HistorySyncItem,
  SyncProviderTypes
} from '../types';

export const getRequestsMetadata = (
  item: CustomAccountSyncItem
): IRequestMetadata[] => {
  const coin = COINS[item.coinId];
  if (!coin) {
    throw new Error(
      'Invalid coin in customAccount sync item: ' + item.coinType
    );
  }

  if (coin instanceof NearCoinData) {
    const wallet = new NearWallet(item.xpub, coin);
    const address = wallet.nearPublicKey;
    const customAccountMetadata = nearServer.wallet
      .getAccounts(
        {
          address,
          network: coin.network
        },
        item.isRefresh
      )
      .getMetadata();
    return [customAccountMetadata];
  } else {
    throw new Error(
      'Invalid coin in customAccount sync item: ' + item.coinType
    );
  }
};

export const processResponses = async (
  item: CustomAccountSyncItem,
  responses: batchServer.IBatchResponse[],
  options: {
    addToQueue: SyncProviderTypes['addToQueue'];
    addPriceSyncItemFromAccount: SyncProviderTypes['addPriceSyncItemFromAccount'];
    addLatestPriceSyncItemFromAccount: SyncProviderTypes['addLatestPriceSyncItemFromAccount'];
  }
): Promise<any> => {
  const coin = COINS[item.coinId];
  if (!coin) {
    throw new Error(
      'Invalid coin in customAccount sync item: ' + item.coinType
    );
  }

  if (responses.length <= 0) {
    throw new Error('Did not find responses while processing');
  }

  if (coin instanceof NearCoinData) {
    const res = responses[0];

    const data = [];

    for (const account of res.data) {
      data.push({
        name: account.account_id,
        walletId: item.walletId,
        coin: item.coinType,
        accountId: item.accountId,
        coinId: item.coinId,
        price: '0',
        balance: '0'
      });
      options.addToQueue(
        new BalanceSyncItem({
          accountId: item.accountId,
          accountType: item.accountType,
          coinId: item.coinId,
          xpub: item.xpub,
          walletId: item.walletId,
          coinType: item.coinType,
          module: item.module,
          customAccount: account.account_id,
          coinGroup: CoinGroup.Near,
          isRefresh: true
        })
      );
      options.addToQueue(
        new HistorySyncItem({
          xpub: item.xpub,
          accountId: item.accountId,
          accountType: item.accountType,
          coinId: item.coinId,
          walletId: item.walletId,
          coinType: item.coinType,
          isRefresh: true,
          customAccount: account.account_id,
          coinGroup: CoinGroup.Near,
          module: item.module
        })
      );
    }
    await customAccountDb.rebuild(data, {
      accountId: item.accountId
    });
  } else {
    throw new Error(
      'Invalid coin in customAccount sync item: ' + item.coinType
    );
  }
};
