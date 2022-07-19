import { COINS, EthCoinData } from '@cypherock/communication';
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
  if (item.parentCoin) {
    const parentCoin = COINS[item.parentCoin];
    if (!parentCoin || !(parentCoin instanceof EthCoinData)) {
      throw new Error('Unexpected parentCoin: ' + item.parentCoin);
    }

    const token = parentCoin.tokenList[item.coinType];

    if (!token) {
      throw new Error('Invalid coin in balance sync item: ' + item.coinType);
    }

    const address = generateEthAddressFromXpub(item.xpub);
    if (!item.parentCoin) {
      throw new Error('Invalid ethCoin found in balance sync item' + token);
    }

    const erc20address = token.address;
    const balanceMetadata = ethServer.wallet
      .getBalance(
        {
          address,
          network: parentCoin.network,
          contractAddress: erc20address
        },
        item.isRefresh
      )
      .getMetadata();
    return [balanceMetadata];
  }

  const coin = COINS[item.coinType];

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
  } else {
    throw new Error(
      'Invalid ethCoin found in balance sync item' + item.parentCoin
    );
  }
};

export const processResponses = async (
  item: BalanceSyncItem,
  responses: batchServer.IBatchResponse[]
): Promise<any> => {
  if (responses.length <= 0) {
    throw new Error('Did not find responses while processing');
  }
  if (item.parentCoin) {
    const parentCoin = COINS[item.parentCoin];
    if (!parentCoin) {
      throw new Error('Unexpected parentCoin: ' + item.parentCoin);
    }

    const token = parentCoin.tokenList[item.coinType];

    if (!token) {
      throw new Error('Invalid coin in balance sync item: ' + item.coinType);
    }

    if (!item.parentCoin) {
      throw new Error('Invalid ethCoin found in balance sync item' + token);
    }

    const balanceRes = responses[0];

    const balance = new BigNumber(balanceRes.data);
    await tokenDb.updateBalance({
      walletId: item.walletId,
      slug: item.coinType,
      balance: balance.toString()
    });
    return;
  }

  const coin = COINS[item.coinType];

  if (!coin) {
    throw new Error('Invalid coin in balance sync item: ' + item.coinType);
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
  }
};
