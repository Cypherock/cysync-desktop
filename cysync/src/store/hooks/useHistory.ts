import { ALLCOINS as COINS, Erc20CoinData } from '@cypherock/communication';
import { Xpub } from '@cypherock/database';
import BigNumber from 'bignumber.js';

import logger from '../../utils/logger';
import { Databases, dbUtil, getLatestPriceForCoins } from '../database';

import { DisplayInputOutput, DisplayTransaction } from './types';

export interface UseHistoryGetAllParams {
  sinceDate?: Date | undefined;
  walletId?: string | undefined;
  coinType?: string | undefined;
}

export interface UseHistoryValues {
  getAll: (params: UseHistoryGetAllParams) => Promise<DisplayTransaction[]>;
  deleteCoinHistory: (xpub: Xpub) => Promise<void>;
}

export type UseHistory = () => UseHistoryValues;

export const useHistory: UseHistory = () => {
  const getAll: UseHistoryValues['getAll'] = async ({
    sinceDate,
    walletId,
    coinType
  }) => {
    const query: any = { excludeFees: true, sinceDate };
    if (walletId) {
      query.walletId = walletId;
    }
    if (coinType) {
      query.coin = coinType;
    }
    const res = await dbUtil(Databases.TRANSACTION, 'getAll', query, {
      sort: 'confirmed',
      order: 'd'
    });
    const allWallets = await dbUtil(Databases.WALLET, 'getAll');
    const latestTransactionsWithPrice: DisplayTransaction[] = [];

    const allUniqueCoins = new Set<string>();
    for (const txn of res) {
      allUniqueCoins.add(txn.coin);
    }

    const latestPrices = await getLatestPriceForCoins([...allUniqueCoins]);

    // Make all the conversions here. [ex: Satoshi to BTC]
    for (const txn of res) {
      const coin = COINS[txn.coin.toLowerCase()];
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
        logger.warn(`Cannot find coinType: ${newTxn.coin}`);
        continue;
      }

      if (txn.inputs) {
        inputs = txn.inputs.map((elem: { value: any }) => {
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
        outputs = txn.outputs.map((elem: { value: any }) => {
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

      if (COINS[newTxn.coin.toLowerCase()] instanceof Erc20CoinData) {
        if (!newTxn.ethCoin || !COINS[newTxn.ethCoin]) {
          throw new Error(`Cannot find ETH coin for token: ${newTxn.coin}`);
        }

        feeCoinMultiplier = coin.multiplier;
        isErc20 = true;
      }

      const fees = new BigNumber(txn.fees || 0).dividedBy(feeCoinMultiplier);

      const total = new BigNumber(txn.total || 0).dividedBy(coin.multiplier);

      const value = amount.multipliedBy(
        latestPrices[txn.coin.toLowerCase()] || 0
      );

      newTxn.displayAmount = amount.toString();
      newTxn.displayFees = fees.toString();
      newTxn.displayTotal = total.toString();
      newTxn.displayValue = value.toString();

      newTxn.inputs = inputs;
      newTxn.outputs = outputs;

      newTxn.isErc20 = isErc20;

      const wallet = allWallets.find(
        (ob: { walletId: string }) => ob.walletId === newTxn.walletId
      );
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

  const deleteCoinHistory = (xpub: Xpub) => {
    return dbUtil(
      Databases.TRANSACTION,
      'deleteByCoin',
      xpub.walletId,
      xpub.coin
    );
  };

  return {
    getAll,
    deleteCoinHistory
  } as UseHistoryValues;
};
