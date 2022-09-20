import {
  CoinGroup,
  COINS,
  EthCoinData,
  NearCoinData
} from '@cypherock/communication';
import {
  batch as batchServer,
  eth as ethServer,
  IRequestMetadata,
  near as nearServer
} from '@cypherock/server-wrapper';
import {
  generateEthAddressFromXpub,
  generateNearAddressFromXpub
} from '@cypherock/wallet';
import BigNumber from 'bignumber.js';

import Analytics from '../../../../utils/analytics';
import { coinDb, customAccountDb, tokenDb } from '../../../database';
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
          contractAddress: erc20address,
          responseType: 'v2'
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
          network: coin.network,
          responseType: 'v2'
        },
        item.isRefresh
      )
      .getMetadata();
    return [balanceMetadata];
  } else if (coin instanceof NearCoinData) {
    const address = item.customAccount
      ? item.customAccount
      : generateNearAddressFromXpub(item.xpub);
    const balanceMetadata = nearServer.wallet
      .getBalance(
        {
          address,
          network: coin.network,
          responseType: 'v2'
        },
        item.isRefresh
      )
      .getMetadata();
    return [balanceMetadata];
  } else {
    throw new Error('Invalid coin in balance sync item: ' + item.coinType);
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

    let balance: BigNumber;
    if (parentCoin.group === CoinGroup.Ethereum) {
      balance = new BigNumber(balanceRes.data.balance);
    } else {
      balance = new BigNumber(balanceRes.data);
    }

    await tokenDb.updateBalance({
      walletId: item.walletId,
      slug: item.coinType,
      balance: balance.toString()
    });

    Analytics.Instance.event(
      Analytics.EVENTS.WALLET.BALANCE.UPDATED,
      {
        totalBalance: balance.toString(),
        walletId: Analytics.createHash(item.walletId),
        identifier: Analytics.createHash(item.xpub),
        coin: item.coinType,
        parentCoin: item.parentCoin
      },
      { isSensitive: true }
    );
    return;
  }

  const coin = COINS[item.coinType];

  if (!coin) {
    throw new Error('Invalid coin in balance sync item: ' + item.coinType);
  }

  if (coin instanceof EthCoinData) {
    const balanceRes = responses[0];

    const balance = new BigNumber(balanceRes.data.balance);

    await coinDb.updateTotalBalance({
      xpub: item.xpub,
      slug: item.coinType,
      totalBalance: balance.toString(),
      totalUnconfirmedBalance: '0'
    });
    Analytics.Instance.event(
      Analytics.EVENTS.WALLET.BALANCE.UPDATED,
      {
        totalBalance: balance.toString(),
        walletId: Analytics.createHash(item.walletId),
        identifier: Analytics.createHash(item.xpub),
        coin: item.coinType,
        parentCoin: item.parentCoin
      },
      { isSensitive: true }
    );
  } else if (coin instanceof NearCoinData) {
    const balanceRes = responses[0];

    const balance = new BigNumber(balanceRes.data.balance ?? 0);
    if (item.customAccount) {
      await customAccountDb.updateBalance({
        walletId: item.walletId,
        name: item.customAccount,
        balance: balance.toString()
      });
    }
    const customAccounts = await customAccountDb.getAll({
      walletId: item.walletId,
      coin: item.coinType
    });
    let totalBalance = new BigNumber(0);
    for (const customAccount of customAccounts) {
      totalBalance = totalBalance.plus(new BigNumber(customAccount.balance));
    }
    await coinDb.updateTotalBalance({
      xpub: item.xpub,
      slug: item.coinType,
      totalBalance: totalBalance.toString(),
      totalUnconfirmedBalance: '0'
    });
    Analytics.Instance.event(
      Analytics.EVENTS.WALLET.BALANCE.UPDATED,
      {
        totalBalance: totalBalance.toString(),
        walletId: Analytics.createHash(item.walletId),
        identifier: Analytics.createHash(item.xpub),
        coin: item.coinType,
        parentCoin: item.parentCoin
      },
      { isSensitive: true }
    );
  } else {
    throw new Error('Invalid coin in balance sync item: ' + item.coinType);
  }
};
