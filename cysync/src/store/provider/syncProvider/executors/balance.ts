import {
  CoinGroup,
  COINS,
  EthCoinData,
  NearCoinData,
  SolanaCoinData
} from '@cypherock/communication';
import {
  eth as ethServer,
  IRequestMetadata,
  near as nearServer,
  serverBatch as batchServer,
  solana as solanaServer
} from '@cypherock/server-wrapper';
import {
  generateEthAddressFromXpub,
  generateNearAddressFromXpub,
  generateSolanaAddressFromXpub
} from '@cypherock/wallet';
import BigNumber from 'bignumber.js';

import { accountDb, customAccountDb, tokenDb } from '../../../database';
import { BalanceSyncItem } from '../types';

export const getRequestsMetadata = (
  item: BalanceSyncItem
): IRequestMetadata[] => {
  if (item.parentCoinId && item.parentCoinId !== item.coinId) {
    const parentCoin = COINS[item.parentCoinId];
    if (!parentCoin || !(parentCoin instanceof EthCoinData)) {
      throw new Error('Unexpected parentCoin: ' + item.parentCoinId);
    }

    const token = parentCoin.tokenList[item.coinId];

    if (!token) {
      throw new Error('Invalid coin in balance sync item: ' + item.coinId);
    }

    const address = generateEthAddressFromXpub(item.xpub, item.coinId);
    if (!item.parentCoinId) {
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

  const coin = COINS[item.coinId];

  if (!coin) {
    throw new Error('Invalid coin in balance sync item: ' + item.coinId);
  }

  if (coin instanceof EthCoinData) {
    const address = generateEthAddressFromXpub(item.xpub, item.coinId);
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
  } else if (coin instanceof SolanaCoinData) {
    const address = generateSolanaAddressFromXpub(item.xpub);
    const balanceMetadata = solanaServer.wallet
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
    throw new Error('Invalid coin in balance sync item: ' + item.coinId);
  }
};

export const processResponses = async (
  item: BalanceSyncItem,
  responses: batchServer.IBatchResponse[]
): Promise<any> => {
  if (responses.length <= 0) {
    throw new Error('Did not find responses while processing');
  }
  if (item.parentCoinId && item.parentCoinId !== item.coinId) {
    const parentCoin = COINS[item.parentCoinId];
    if (!parentCoin) {
      throw new Error('Unexpected parentCoin: ' + item.parentCoinId);
    }

    const token = parentCoin.tokenList[item.coinId];

    if (!token) {
      throw new Error('Invalid coin in balance sync item: ' + item.coinId);
    }

    if (!item.parentCoinId) {
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
      coinId: item.coinId,
      accountId: item.accountId,
      balance: balance.toString()
    });
    return;
  }

  const coin = COINS[item.coinId];

  if (!coin) {
    throw new Error('Invalid coin in balance sync item: ' + item.coinId);
  }

  if (coin instanceof EthCoinData) {
    const balanceRes = responses[0];

    const balance = new BigNumber(balanceRes.data.balance);

    await accountDb.updateBalance({
      accountId: item.accountId,
      totalBalance: balance.toString(),
      totalUnconfirmedBalance: '0'
    });
  } else if (coin instanceof NearCoinData) {
    const balanceRes = responses[0];

    const balance = new BigNumber(balanceRes.data.balance ?? 0);
    if (item.customAccount) {
      await customAccountDb.updateBalance({
        accountId: item.accountId,
        name: item.customAccount,
        balance: balance.toString()
      });
    }
    const customAccounts = await customAccountDb.getAll({
      accountId: item.accountId
    });
    let totalBalance = new BigNumber(0);
    for (const customAccount of customAccounts) {
      totalBalance = totalBalance.plus(new BigNumber(customAccount.balance));
    }
    await accountDb.updateBalance({
      accountId: item.accountId,
      totalBalance: totalBalance.toString(),
      totalUnconfirmedBalance: '0'
    });
  } else if (coin instanceof SolanaCoinData) {
    const balanceRes = responses[0];

    const totalBalance = new BigNumber(balanceRes.data.balance ?? 0);
    await accountDb.updateBalance({
      accountId: item.accountId,
      totalBalance: totalBalance.toString(),
      totalUnconfirmedBalance: '0'
    });
  } else {
    throw new Error('Invalid coin in balance sync item: ' + item.coinId);
  }
};
