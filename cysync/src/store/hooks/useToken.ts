import { ALLCOINS as COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import {
  Databases,
  dbUtil,
  ERC20Token,
  getLatestPriceForCoin
} from '../database';

import { DisplayToken } from './types';
import { useDebouncedFunction } from './useDebounce';

export interface UseTokenValues {
  getAllTokensFromWallet: (walletId: string, ethCoin: string) => Promise<void>;
  tokenData: DisplayToken[];
  tokenList: string[];
  setCurrentWalletId: React.Dispatch<React.SetStateAction<string>>;
  setCurrentEthCoin: React.Dispatch<React.SetStateAction<string>>;
}

export type UseToken = () => UseTokenValues;

export const useToken: UseToken = () => {
  const [tokenData, setTokenData] = useState<UseTokenValues['tokenData']>([]);
  const [tokenList, setTokenList] = useState<UseTokenValues['tokenList']>([]);

  const [currentWalletId, setCurrentWalletId] = useState('');
  const [currentEthCoin, setCurrentEthCoin] = useState('');

  // Using doRefresh mechanish because hooks state change do not work with event listeners.
  const [doRefresh, setDoRefresh] = useState(false);

  const onDBChange = () => {
    setDoRefresh(true);
  };

  const onChange = useDebouncedFunction(onDBChange, 800);

  useEffect(() => {
    dbUtil(Databases.PRICE, 'emitter', 'on', 'insert', onChange);
    dbUtil(Databases.PRICE, 'emitter', 'on', 'update', onChange);

    dbUtil(Databases.ERC20TOKEN, 'emitter', 'on', 'insert', onChange);
    dbUtil(Databases.ERC20TOKEN, 'emitter', 'on', 'update', onChange);
    dbUtil(Databases.ERC20TOKEN, 'emitter', 'on', 'delete', onChange);

    return () => {
      dbUtil(Databases.PRICE, 'emitter', 'removeListener', 'insert', onChange);
      dbUtil(Databases.PRICE, 'emitter', 'removeListener', 'update', onChange);

      dbUtil(
        Databases.ERC20TOKEN,
        'emitter',
        'removeListener',
        'insert',
        onChange
      );
      dbUtil(
        Databases.ERC20TOKEN,
        'emitter',
        'removeListener',
        'update',
        onChange
      );
      dbUtil(
        Databases.ERC20TOKEN,
        'emitter',
        'removeListener',
        'delete',
        onChange
      );
    };
  }, []);

  const getTokensWithPrices = async (tokens: ERC20Token[]) => {
    const tokensWithPrice: DisplayToken[] = [];
    for (const coin of tokens) {
      const coinObj = COINS[coin.coin.toLowerCase()];
      if (!coinObj) {
        throw new Error(`Cannot find coinType: ${coin.coin}`);
      }

      const coinWithPrice: DisplayToken = {
        ...coin,
        isEmpty: true,
        displayPrice: '0',
        displayValue: '0',
        displayBalance: '0'
      };
      const balance = new BigNumber(coin.balance || 0).dividedBy(
        coinObj.multiplier
      );

      const price = await getLatestPriceForCoin(coin.coin);
      const value = balance.multipliedBy(price);

      coinWithPrice.displayBalance = balance.toString();

      coinWithPrice.displayValue = value.toFixed(2);
      coinWithPrice.displayPrice = price.toFixed(2);
      coinWithPrice.isEmpty = balance.isZero();

      tokensWithPrice.push(coinWithPrice);
    }

    return tokensWithPrice.sort((a, b) => {
      if (a.displayValue > b.displayValue) return -1;
      if (a.displayValue < b.displayValue) return 1;
      return 0;
    });
  };

  const getAllTokensFromWallet = async (walletId: string, ethCoin: string) => {
    const res = await dbUtil(
      Databases.ERC20TOKEN,
      'getByWalletId',
      walletId,
      ethCoin
    );
    const tokens: string[] = [];
    res.forEach((coin: { coin: string }) => {
      tokens.push(coin.coin);
    });
    setTokenList(tokens);
    setTokenData(await getTokensWithPrices(res));
  };

  useEffect(() => {
    getAllTokensFromWallet(currentWalletId, currentEthCoin);
  }, [currentWalletId, currentEthCoin]);

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      getAllTokensFromWallet(currentWalletId, currentEthCoin);
    }
  }, [doRefresh]);

  return {
    getAllTokensFromWallet,
    tokenData,
    tokenList,
    setCurrentWalletId,
    setCurrentEthCoin
  } as UseTokenValues;
};
