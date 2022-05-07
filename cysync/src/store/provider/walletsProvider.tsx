import { ALLCOINS as COINS } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import logger from '../../utils/logger';
import { erc20tokenDb, walletDb2, Wallet2, coinDb } from '../database';

export interface Coin {
  name: string;
  abbr: string;
}

export interface WalletsContextInterface {
  allWallets: Wallet2[];
  allCoins: Coin[];
  getAll: () => void;
}

export const WalletsContext: React.Context<WalletsContextInterface> =
  React.createContext<WalletsContextInterface>({} as WalletsContextInterface);

export const WalletsProvider: React.FC = ({ children }) => {
  const [allWallets, setAllWallets] = useState<Wallet2[]>([
    {
      // UI breaks if the list is empty, hence dummy empty wallet. WalletID is null specially for Portfolio, to differenciate between initial state (walletId is 'null') and no wallets (walletId is '')
      id: 'null',
      device: '',
      name: '',
      passwordSet: true,
      passphraseSet: false
    }
  ]);

  const [allCoins, setAllCoins] = useState<Coin[]>([]);

  const getAll = async () => {
    try {
      logger.verbose('Getting all wallets and xpub data');
      const walletRes = await walletDb2.getAll();

      if (walletRes.length !== 0) setAllWallets(walletRes);
      else {
        setAllWallets([
          {
            id: '',
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
      const erc20Res = await erc20tokenDb.getAll();
      const coinTypeList = new Set<string>();
      for (const coin of coins) {
        coinTypeList.add(coin.slug);
      }

      for (const erc of erc20Res) {
        coinTypeList.add(erc.coin);
      }

      const coinList: Coin[] = [];

      for (const coinType of coinTypeList) {
        const coin = COINS[coinType];
        if (coin) {
          coinList.push({ name: coin.name, abbr: coin.abbr });
        }
      }

      setAllCoins(coinList);
    } catch (error) {
      logger.error(error);
    }
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

    walletDb2.emitter.on('insert', onUpdate);
    walletDb2.emitter.on('update', onUpdate);
    walletDb2.emitter.on('delete', onUpdate);

    coinDb.emitter.on('insert', onUpdate);
    coinDb.emitter.on('delete', onUpdate);

    erc20tokenDb.emitter.on('insert', onUpdate);
    erc20tokenDb.emitter.on('delete', onUpdate);

    return () => {
      logger.verbose('Removed all wallet & xpub DB listners.');
      walletDb2.emitter.removeListener('insert', onUpdate);
      walletDb2.emitter.removeListener('update', onUpdate);
      walletDb2.emitter.removeListener('delete', onUpdate);

      coinDb.emitter.removeListener('insert', onUpdate);
      coinDb.emitter.removeListener('delete', onUpdate);

      erc20tokenDb.emitter.removeListener('insert', onUpdate);
      erc20tokenDb.emitter.removeListener('delete', onUpdate);
    };
  }, []);

  return (
    <WalletsContext.Provider value={{ allWallets, allCoins, getAll }}>
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
