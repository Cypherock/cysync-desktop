import { AbsCoinData, COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';

import logger from '../../utils/logger';
import {
  getAllTxns,
  getLatestPriceForCoins,
  transactionDb,
  TxQuery,
  TxQueryOptions,
  walletDb
} from '../database';

import { DisplayInputOutput, DisplayTransaction } from './types';

export interface UseHistoryGetAllParams {
  sinceDate?: Date | undefined;
  walletId?: string | undefined;
  coinType?: string | undefined;
  accountId?: string | undefined;
  coinId?: string | undefined;
}

export interface UseHistoryValues {
  getAll: (params: UseHistoryGetAllParams) => Promise<DisplayTransaction[]>;
  deleteCoinHistory: (account: string) => Promise<void>;
}

export type UseHistory = () => UseHistoryValues;

export const useHistory: UseHistory = () => {
  const getAll: UseHistoryValues['getAll'] = async ({
    sinceDate,
    walletId,
    coinType,
    accountId,
    coinId
  }) => {
    const options: TxQueryOptions = { excludeFees: true, sinceDate };
    const query: TxQuery = {};
    if (walletId) {
      query.walletId = walletId;
    }
    if (coinType) {
      query.slug = coinType;
    }
    if (accountId) {
      query.accountId = accountId;
    }
    if (coinId) {
      query.coinId = coinId;
    }
    const res = await getAllTxns(query, options, {
      field: 'confirmed',
      order: 'desc'
    });
    const allWallets = await walletDb.getAll();
    const latestTransactionsWithPrice: DisplayTransaction[] = [];

    const allUniqueCoins = [
      ...new Map(
        res
          .map(txn => {
            return {
              parentCoinId:
                txn.parentCoinId !== txn.coinId ? txn.parentCoinId : undefined,
              coinId: txn.coinId
            };
          })
          .map(item => [JSON.stringify(item), item])
      ).values()
    ];

    const latestPrices = await getLatestPriceForCoins([...allUniqueCoins]);

    // Make all the conversions here. [ex: Satoshi to BTC]
    for (const txn of res) {
      let coin: AbsCoinData;
      let isToken = false;
      if (txn.parentCoinId && txn.parentCoinId !== txn.coinId) {
        const parent = COINS[txn.parentCoinId];
        if (!parent) {
          logger.warn(`Cannot find parent coin ${txn.parentCoinId}`);
          continue;
        }
        coin = parent.tokenList[txn.coinId];
        isToken = true;
      } else {
        coin = COINS[txn.coinId];
      }

      if (!coin) {
        logger.warn(`Cannot find coinType: ${txn.coinId}`);
        continue;
      }
      const feeCoinMultiplier = isToken
        ? COINS[txn.parentCoinId].multiplier
        : coin.multiplier;

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

      if (txn.inputs) {
        inputs = txn.inputs.map(elem => {
          const val = new BigNumber(elem.value || 0)
            .dividedBy(feeCoinMultiplier)
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
            .dividedBy(feeCoinMultiplier)
            .toString();

          return {
            ...elem,
            displayValue: val
          };
        });
      }

      const amount = new BigNumber(txn.amount || 0).dividedBy(coin.multiplier);

      const fees = new BigNumber(txn.fees || 0).dividedBy(feeCoinMultiplier);

      const total = new BigNumber(txn.total || 0).dividedBy(coin.multiplier);

      const value = amount.multipliedBy(latestPrices[txn.coinId] || 0);

      newTxn.displayAmount = amount.toString();
      newTxn.displayFees = fees.toString();
      newTxn.displayTotal = total.toString();
      newTxn.displayValue = value.toString();

      newTxn.inputs = inputs;
      newTxn.outputs = outputs;

      newTxn.isErc20 = isToken;

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

  const deleteCoinHistory = (accountId: string) => {
    return transactionDb.delete({ accountId });
  };

  return {
    getAll,
    deleteCoinHistory
  } as UseHistoryValues;
};
