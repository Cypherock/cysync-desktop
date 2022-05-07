import { ALLCOINS as COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import {
  Token2,
  tokenDb,
  getLatestPriceForCoin,
  priceDb
} from '../database';

import { DisplayToken } from './types';
import { useDebouncedFunction } from './useDebounce';

export interface UseTokenValues {
  getAllTokensFromWallet: (walletId: string, ethCoin: string) => Promise<void>;
  tokenData: DisplayToken[];
  tokenList: string[];
  setCurrentWalletId: React.Dispatch<React.SetStateAction<string>>;
  setCurrentEthCoin: React.Dispatch<React.SetStateAction<string>>;
  sortTokenData: (tokens: DisplayToken[], index: number) => void;
  sortTokensByIndex: (index: number) => void;
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
    priceDb.emitter.on('insert', onChange);
    priceDb.emitter.on('update', onChange);

    tokenDb.emitter.on('insert', onChange);
    tokenDb.emitter.on('update', onChange);
    tokenDb.emitter.on('delete', onChange);

    return () => {
      priceDb.emitter.removeListener('insert', onChange);
      priceDb.emitter.removeListener('update', onChange);

      tokenDb.emitter.removeListener('insert', onChange);
      tokenDb.emitter.removeListener('update', onChange);
      tokenDb.emitter.removeListener('delete', onChange);
    };
  }, []);

  const getTokensWithPrices = async (tokens: Token2[]) => {
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
        displayBalance: '0',
      };
      const balance = new BigNumber(coin.balance || 0).dividedBy(
        coinObj.multiplier
      );

      const price = await getLatestPriceForCoin(coin.slug);
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

  const sortTokenData: UseTokenValues['sortTokenData'] = (tokens, index) => {
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
            const tokenA = COINS[a.coin.toLowerCase()].name;
            const tokenB = COINS[b.coin.toLowerCase()].name;
            return tokenA.localeCompare(tokenB);
          })
        );
        break;
      case 3:
        setTokenData(
          [...tokens].sort((a, b) => {
            const tokenA = COINS[a.coin.toLowerCase()].name;
            const tokenB = COINS[b.coin.toLowerCase()].name;
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
    sortTokenData(tokenData, index);
  };

  const getAllTokensFromWallet = async (walletId: string, ethCoin: string) => {
    const res = await tokenDb.getAll({ walletId, coin: ethCoin });
    const tokens: string[] = [];
    res.forEach(coin => {
      tokens.push(coin.slug);
    });
    setTokenList(tokens);
    const unsortedTokens = await getTokensWithPrices(res);
    sortTokenData(unsortedTokens, 0);
  };

  useEffect(() => {
    // We handle only Ethereum Mainnet ERC20 tokens
    if (currentWalletId && currentEthCoin)
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
    setCurrentEthCoin,
    sortTokensByIndex
  } as UseTokenValues;
};
