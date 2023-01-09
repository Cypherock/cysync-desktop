import { AbsCoinData, COINS } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import logger from '../../utils/logger';
import { accountDb, tokenDb, Wallet, walletDb } from '../database';

export interface Account {
  name: string;
  abbr: string;
  coinName: string;
  coinId: string;
  accountType?: string;
  accountIndex: number;
  accountId: string;
}

export interface WalletsContextInterface {
  allWallets: Wallet[];
  allAccounts: Account[];
  allCoins: AbsCoinData[];
  getAll: () => void;
  isLoading: boolean;
}

export const WalletsContext: React.Context<WalletsContextInterface> =
  React.createContext<WalletsContextInterface>({} as WalletsContextInterface);

export const WalletsProvider: React.FC = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allWallets, setAllWallets] = useState<Wallet[]>([
    {
      // UI breaks if the list is empty, hence dummy empty wallet. WalletID is null specially for Portfolio, to differenciate between initial state (walletId is 'null') and no wallets (walletId is '')
      _id: 'null',
      device: '',
      name: '',
      passwordSet: true,
      passphraseSet: false
    }
  ]);

  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [allCoins, setAllCoins] = useState<AbsCoinData[]>([]);

  const getAll = async () => {
    try {
      setIsLoading(true);
      logger.verbose('Getting all wallets and xpub data');
      const walletRes = await walletDb.getAll();

      if (walletRes.length !== 0) setAllWallets(walletRes);
      else {
        setAllWallets([
          {
            _id: '',
            device: '',
            name: '',
            passwordSet: true,
            passphraseSet: false
          }
        ]);
      }
    } catch (error) {
      logger.error(error);
    }

    try {
      const accounts = await accountDb.getAll();
      const erc20Res = await tokenDb.getAll();
      const coinTypeSet = new Set<string>();
      const accountList: Account[] = [];
      const coinList: AbsCoinData[] = [];

      for (const account of accounts) {
        const coin = COINS[account.coinId];

        accountList.push({
          name: coin.name,
          abbr: coin.abbr,
          coinId: account.coinId,
          accountId: account.accountId,
          accountIndex: account.accountIndex,
          accountType: account.accountType,
          coinName: `${name} ${account.accountType}:${account.accountIndex}`
        });

        if (!coinTypeSet.has(account.coinId)) {
          coinList.push(coin);
          coinTypeSet.add(account.coinId);
        }
      }

      for (const erc of erc20Res) {
        const parentData = COINS[erc.parentCoinId];
        const coin = parentData.tokenList[erc.coinId];
        if (!coinTypeSet.has(coin.id)) {
          coinList.push(coin);
          coinTypeSet.add(coin.id);
        }
      }

      setAllAccounts(accountList);
      setAllCoins(coinList);
    } catch (error) {
      logger.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getAll();
  }, []);

  const onUpdate = () => {
    getAll()
      .then(() => {
        // empty
      })
      .catch(e => logger.error(e));
  };

  useEffect(() => {
    logger.verbose('Adding all wallet & xpub DB listners.');

    walletDb.emitter.on('insert', onUpdate);
    walletDb.emitter.on('update', onUpdate);
    walletDb.emitter.on('delete', onUpdate);

    accountDb.emitter.on('insert', onUpdate);
    accountDb.emitter.on('delete', onUpdate);

    tokenDb.emitter.on('insert', onUpdate);
    tokenDb.emitter.on('delete', onUpdate);

    return () => {
      logger.verbose('Removed all wallet & xpub DB listners.');
      walletDb.emitter.removeListener('insert', onUpdate);
      walletDb.emitter.removeListener('update', onUpdate);
      walletDb.emitter.removeListener('delete', onUpdate);

      accountDb.emitter.removeListener('insert', onUpdate);
      accountDb.emitter.removeListener('delete', onUpdate);

      tokenDb.emitter.removeListener('insert', onUpdate);
      tokenDb.emitter.removeListener('delete', onUpdate);
    };
  }, []);

  return (
    <WalletsContext.Provider
      value={{ allWallets, allAccounts, allCoins, getAll, isLoading }}
    >
      {children}
    </WalletsContext.Provider>
  );
};

WalletsProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useWallets(): WalletsContextInterface {
  return React.useContext(WalletsContext);
}
