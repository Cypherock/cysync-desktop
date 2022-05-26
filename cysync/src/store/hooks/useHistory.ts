import { ALLCOINS as COINS, Erc20CoinData } from '@cypherock/communication';
import { Coin } from '@cypherock/database';
import BigNumber from 'bignumber.js';

import logger from '../../utils/logger';
import {
  getAllTxns,
  getLatestPriceForCoins,
  transactionDb,
  walletDb,
  TxQuery,
  TxQueryOptions
} from '../database';

import { DisplayInputOutput, DisplayTransaction } from './types';

export interface UseHistoryGetAllParams {
  sinceDate?: Date | undefined;
  walletId?: string | undefined;
  coinType?: string | undefined;
}

export interface UseHistoryValues {
  getAll: (params: UseHistoryGetAllParams) => Promise<DisplayTransaction[]>;
  deleteCoinHistory: (coin: Coin) => Promise<void>;
}

export type UseHistory = () => UseHistoryValues;

export const useHistory: UseHistory = () => {
  const getAll: UseHistoryValues['getAll'] = async ({
    sinceDate,
    walletId,
    coinType
  }) => {
    const options: TxQueryOptions = { excludeFees: true, sinceDate };
    const query: TxQuery = {};
    if (walletId) {
      query.walletId = walletId;
    }
    if (coinType) {
      query.slug = coinType;
    }
    const res = await getAllTxns(query, options, {
      field: 'confirmed',
      order: 'desc'
    });
    const allWallets = await walletDb.getAll();
    const latestTransactionsWithPrice: DisplayTransaction[] = [];

    const allUniqueCoins = new Set<string>();
    for (const txn of res) {
      allUniqueCoins.add(txn.slug);
    }

    const latestPrices = await getLatestPriceForCoins([...allUniqueCoins]);

    // Make all the conversions here. [ex: Satoshi to BTC]
    for (const txn of res) {
      const coin = COINS[txn.slug.toLowerCase()];
      const newTxn: DisplayTransaction = {
        ...txn,
        coinDecimal: coin.decimal,
        displayValue: '0',
        displayAmount: '0',
        displayFees: '0',
        displayTotal: '0',
        isErc20: false,
        coinName: '',
        inputs: [],
        outputs: []
      };
      let inputs: DisplayInputOutput[] = [];
      let outputs: DisplayInputOutput[] = [];

      if (!coin) {
        logger.warn(`Cannot find coinType: ${newTxn.slug}`);
        continue;
      }

      if (txn.inputs) {
        inputs = txn.inputs.map(elem => {
          const val = new BigNumber(elem.value || 0)
            .dividedBy(coin.multiplier)
            .toString();

          return {
            ...elem,
            displayValue: val
          };
        });
      }

      if (txn.outputs) {
        outputs = txn.outputs.map(elem => {
          const val = new BigNumber(elem.value || 0)
            .dividedBy(coin.multiplier)
            .toString();

          return {
            ...elem,
            displayValue: val
          };
        });
      }

      const amount = new BigNumber(txn.amount || 0).dividedBy(coin.multiplier);

      let feeCoinMultiplier = coin.multiplier;
      let isErc20 = false;

      if (COINS[newTxn.slug.toLowerCase()] instanceof Erc20CoinData) {
        if (!newTxn.coin || !COINS[newTxn.coin]) {
          throw new Error(`Cannot find ETH coin for token: ${newTxn.coin}`);
        }
        // the currency units correspond to ETH units and not the token decimals
        feeCoinMultiplier = COINS[newTxn.coin].multiplier;
        isErc20 = true;
      }

      const fees = new BigNumber(txn.fees || 0).dividedBy(feeCoinMultiplier);

      const total = new BigNumber(txn.total || 0).dividedBy(coin.multiplier);

      const value = amount.multipliedBy(
        latestPrices[txn.slug.toLowerCase()] || 0
      );

      newTxn.displayAmount = amount.toString();
      newTxn.displayFees = fees.toString();
      newTxn.displayTotal = total.toString();
      newTxn.displayValue = value.toString();

      newTxn.inputs = inputs;
      newTxn.outputs = outputs;

      newTxn.isErc20 = isErc20;

      const wallet = allWallets.find(ob => ob._id === newTxn.walletId);
      if (!wallet) {
        logger.warn(`Cannot find wallet with name: ${newTxn.walletId}`);
      } else {
        newTxn.walletName = wallet.name;
        newTxn.coinName = coin.name;
        latestTransactionsWithPrice.push(newTxn);
      }
    }

    return latestTransactionsWithPrice;
  };

  const deleteCoinHistory = (coin: Coin) => {
    return transactionDb.delete({ walletId: coin.walletId, slug: coin.slug });
  };

  return {
    getAll,
    deleteCoinHistory
  } as UseHistoryValues;
};
