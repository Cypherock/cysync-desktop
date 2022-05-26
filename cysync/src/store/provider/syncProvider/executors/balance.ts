import {
  ALLCOINS,
  COINS,
  Erc20CoinData,
  EthCoinData
} from '@cypherock/communication';
import {
  batch as batchServer,
  eth as ethServer,
  IRequestMetadata
} from '@cypherock/server-wrapper';
import { generateEthAddressFromXpub } from '@cypherock/wallet';
import BigNumber from 'bignumber.js';

import { coinDb, tokenDb } from '../../../database';
import { BalanceSyncItem } from '../types';

export const getRequestsMetadata = (
  item: BalanceSyncItem
): IRequestMetadata[] => {
  const coin = ALLCOINS[item.coinType];
  if (!coin) {
    throw new Error('Invalid coin in balance sync item: ' + item.coinType);
  }

  if (coin instanceof EthCoinData) {
    const address = generateEthAddressFromXpub(item.xpub);
    const balanceMetadata = ethServer.wallet
      .getBalance(
        {
          address,
          network: coin.network
        },
        item.isRefresh
      )
      .getMetadata();
    return [balanceMetadata];
  } else if (coin instanceof Erc20CoinData) {
    const address = generateEthAddressFromXpub(item.xpub);
    if (!item.ethCoin) {
      throw new Error(
        'Invalid ethCoin found in balance sync item' + item.ethCoin
      );
    }

    const ethCoin = COINS[item.ethCoin];

    if (ethCoin && ethCoin instanceof EthCoinData) {
      const erc20address = coin.address;
      const balanceMetadata = ethServer.wallet
        .getBalance(
          {
            address,
            network: ethCoin.network,
            contractAddress: erc20address
          },
          item.isRefresh
        )
        .getMetadata();
      return [balanceMetadata];
    } else {
      throw new Error(
        'Invalid ethCoin found in balance sync item' + item.ethCoin
      );
    }
  }
};

export const processResponses = async (
  item: BalanceSyncItem,
  responses: batchServer.IBatchResponse[]
): Promise<any> => {
  const coin = ALLCOINS[item.coinType];
  if (!coin) {
    throw new Error('Invalid coin in balance sync item: ' + item.coinType);
  }

  if (responses.length <= 0) {
    throw new Error('Did not find responses while processing');
  }

  if (coin instanceof EthCoinData) {
    const balanceRes = responses[0];

    const balance = new BigNumber(balanceRes.data);

    await coinDb.updateTotalBalance({
      xpub: item.xpub,
      slug: item.coinType,
      totalBalance: balance.toString(),
      totalUnconfirmedBalance: '0'
    });
  } else if (coin instanceof Erc20CoinData) {
    if (!item.ethCoin) {
      throw new Error(
        'Invalid ethCoin found in balance sync item' + item.ethCoin
      );
    }

    const ethCoin = COINS[item.ethCoin];

    if (ethCoin instanceof EthCoinData) {
      const balanceRes = responses[0];

      const balance = new BigNumber(balanceRes.data);
      await tokenDb.updateBalance({
        walletId: item.walletId,
        slug: item.coinType,
        balance: balance.toString()
      });
    } else {
      throw new Error(
        'Invalid ethCoin found in balance sync item' + item.ethCoin
      );
    }
  }
};
