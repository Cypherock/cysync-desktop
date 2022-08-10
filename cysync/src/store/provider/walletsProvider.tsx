import { COINS } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import logger from '../../utils/logger';
import { coinDb, tokenDb, Wallet, walletDb } from '../database';

export interface Coin {
  name: string;
  abbr: string;
}

export interface WalletsContextInterface {
  allWallets: Wallet[];
  allCoins: Coin[];
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

  const [allCoins, setAllCoins] = useState<Coin[]>([]);

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
      const coins = await coinDb.getAll();
      const erc20Res = await tokenDb.getAll();
      const coinTypeSet = new Set<string>();
      const coinList: Coin[] = [];
      for (const coin of coins) {
        if (coinTypeSet.has(coin.slug)) continue;
        const { name, abbr } = COINS[coin.slug];
        coinList.push({ name, abbr });
        coinTypeSet.add(coin.slug);
      }

      for (const erc of erc20Res) {
        if (coinTypeSet.has(erc.slug)) continue;
        const parentData = COINS[erc.coin];
        const { name, abbr } = parentData.tokenList[erc.slug];
        coinList.push({ name, abbr });
        coinTypeSet.add(erc.slug);
      }

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

    coinDb.emitter.on('insert', onUpdate);
    coinDb.emitter.on('delete', onUpdate);

    tokenDb.emitter.on('insert', onUpdate);
    tokenDb.emitter.on('delete', onUpdate);

    return () => {
      logger.verbose('Removed all wallet & xpub DB listners.');
      walletDb.emitter.removeListener('insert', onUpdate);
      walletDb.emitter.removeListener('update', onUpdate);
      walletDb.emitter.removeListener('delete', onUpdate);

      coinDb.emitter.removeListener('insert', onUpdate);
      coinDb.emitter.removeListener('delete', onUpdate);

      tokenDb.emitter.removeListener('insert', onUpdate);
      tokenDb.emitter.removeListener('delete', onUpdate);
    };
  }, []);

  return (
    <WalletsContext.Provider
      value={{ allWallets, allCoins, getAll, isLoading }}
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
