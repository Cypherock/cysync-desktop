import { COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import {
  getLatestPriceForCoin,
  priceHistoryDb,
  Token,
  tokenDb
} from '../database';

import { DisplayToken } from './types';
import { useDebouncedFunction } from './useDebounce';

export interface UseTokenValues {
  getAllTokensFromWallet: (accountId: string) => Promise<void>;
  tokenData: DisplayToken[];
  tokenList: string[];
  setCurrentAccountId: React.Dispatch<React.SetStateAction<string>>;
  sortTokensByIndex: (index: number) => void;
}

export type UseToken = () => UseTokenValues;

export const useToken: UseToken = () => {
  const [tokenData, setTokenData] = useState<UseTokenValues['tokenData']>([]);
  const [tokenList, setTokenList] = useState<UseTokenValues['tokenList']>([]);

  const [currentAccountId, setCurrentAccountId] = useState('');
  const [sortIndex, setSortIndex] = useState(0);

  // Using doRefresh mechanish because hooks state change do not work with event listeners.
  const [doRefresh, setDoRefresh] = useState(false);

  const onDBChange = () => {
    setDoRefresh(true);
  };

  const onChange = useDebouncedFunction(onDBChange, 800);

  useEffect(() => {
    priceHistoryDb.emitter.on('insert', onChange);
    priceHistoryDb.emitter.on('update', onChange);

    tokenDb.emitter.on('insert', onChange);
    tokenDb.emitter.on('update', onChange);
    tokenDb.emitter.on('delete', onChange);

    return () => {
      priceHistoryDb.emitter.removeListener('insert', onChange);
      priceHistoryDb.emitter.removeListener('update', onChange);

      tokenDb.emitter.removeListener('insert', onChange);
      tokenDb.emitter.removeListener('update', onChange);
      tokenDb.emitter.removeListener('delete', onChange);
    };
  }, []);
  useEffect(() => {
    sortTokenData(tokenData, sortIndex);
  }, [sortIndex]);

  const getTokensWithPrices = async (tokens: Token[]) => {
    const tokensWithPrice: DisplayToken[] = [];

    for (const token of tokens) {
      const coin = COINS[token.parentCoinId];

      if (!coin) {
        throw new Error(`Cannot find parentCoin: ${coin}`);
      }

      const coinObj = coin.tokenList[token.coinId];
      if (!coinObj) {
        throw new Error(`Cannot find coinId: ${token.coinId}`);
      }

      const coinWithPrice: DisplayToken = {
        ...token,
        isEmpty: true,
        price: 0,
        displayPrice: '0',
        displayValue: '0',
        displayBalance: '0',
        parentCoin: token.parentCoinId
      };
      const balance = new BigNumber(token.balance || 0).dividedBy(
        coinObj.multiplier
      );

      const price = await getLatestPriceForCoin(
        token.coinId,
        token.parentCoinId
      );
      const value = balance.multipliedBy(price);

      coinWithPrice.displayBalance = balance.toString();

      coinWithPrice.displayValue = value.toString();
      coinWithPrice.displayPrice = price.toString() || '0';
      coinWithPrice.isEmpty = balance.isZero();

      tokensWithPrice.push(coinWithPrice);
    }

    return tokensWithPrice.sort((a, b) => {
      if (a.displayValue > b.displayValue) return -1;
      if (a.displayValue < b.displayValue) return 1;
      return 0;
    });
  };

  const sortTokenData = (tokens: DisplayToken[], index: number) => {
    switch (index) {
      case 0:
        setTokenData(
          [...tokens].sort((a, b) => {
            const numA = new BigNumber(a.displayValue);
            const numB = new BigNumber(b.displayValue);
            return numB.comparedTo(numA);
          })
        );
        break;
      case 1:
        setTokenData(
          [...tokens].sort((a, b) => {
            const numA = new BigNumber(a.displayValue);
            const numB = new BigNumber(b.displayValue);
            return numA.comparedTo(numB);
          })
        );
        break;
      case 2:
        setTokenData(
          [...tokens].sort((a, b) => {
            const coinA = COINS[a.parentCoinId];

            if (!coinA) {
              throw new Error(`Cannot find parentCoin: ${coinA}`);
            }

            const coinObjA = coinA.tokenList[a.coinId];
            if (!coinObjA) {
              throw new Error(`Cannot find coinId: ${a.coinId}`);
            }

            const coinB = COINS[b.parentCoinId];

            if (!coinB) {
              throw new Error(`Cannot find parentCoin: ${coinB}`);
            }

            const coinObjB = coinB.tokenList[b.coinId];
            if (!coinObjB) {
              throw new Error(`Cannot find coinId: ${b.coinId}`);
            }

            const tokenA = coinObjA.name;
            const tokenB = coinObjB.name;
            return tokenA.localeCompare(tokenB);
          })
        );
        break;
      case 3:
        setTokenData(
          [...tokens].sort((a, b) => {
            const coinA = COINS[a.parentCoinId];

            if (!coinA) {
              throw new Error(`Cannot find parentCoin: ${coinA}`);
            }

            const coinObjA = coinA.tokenList[a.coinId];
            if (!coinObjA) {
              throw new Error(`Cannot find coinId: ${a.coinId}`);
            }

            const coinB = COINS[b.parentCoinId];

            if (!coinB) {
              throw new Error(`Cannot find parentCoin: ${coinB}`);
            }

            const coinObjB = coinB.tokenList[b.coinId];
            if (!coinObjB) {
              throw new Error(`Cannot find coinId: ${b.coinId}`);
            }

            const tokenA = coinObjA.name;
            const tokenB = coinObjB.name;
            return tokenB.localeCompare(tokenA);
          })
        );
        break;
      case 4:
        setTokenData(
          [...tokens].sort((a, b) => {
            const numA = new BigNumber(a.displayBalance);
            const numB = new BigNumber(b.displayBalance);
            return numB.comparedTo(numA);
          })
        );
        break;

      case 5:
        setTokenData(
          [...tokens].sort((a, b) => {
            const numA = new BigNumber(a.displayBalance);
            const numB = new BigNumber(b.displayBalance);
            return numA.comparedTo(numB);
          })
        );
        break;

      case 6:
        setTokenData(
          [...tokens].sort((a, b) => {
            const numA = new BigNumber(a.displayPrice);
            const numB = new BigNumber(b.displayPrice);
            return numB.comparedTo(numA);
          })
        );
        break;

      case 7:
        setTokenData(
          [...tokens].sort((a, b) => {
            const numA = new BigNumber(a.displayPrice);
            const numB = new BigNumber(b.displayPrice);
            return numA.comparedTo(numB);
          })
        );
        break;
      default:
        break;
    }
  };

  const sortTokensByIndex: UseTokenValues['sortTokensByIndex'] = index => {
    if (tokenData.length === 0) return;
    if (index !== sortIndex) setSortIndex(index);
  };

  const getAllTokensFromWallet = async (accountId: string) => {
    const res = await tokenDb.getAll({ accountId });
    const tokens: string[] = [];
    res.forEach(token => {
      tokens.push(token.coinId);
    });
    setTokenList(tokens);
    const unsortedTokens = await getTokensWithPrices(res);
    sortTokenData(unsortedTokens, sortIndex);
  };

  useEffect(() => {
    // We handle only Ethereum Mainnet ERC20 tokens
    if (currentAccountId) getAllTokensFromWallet(currentAccountId);
  }, [currentAccountId]);

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      getAllTokensFromWallet(currentAccountId);
    }
  }, [doRefresh]);

  return {
    getAllTokensFromWallet,
    tokenData,
    tokenList,
    setCurrentAccountId,
    sortTokensByIndex
  };
};
