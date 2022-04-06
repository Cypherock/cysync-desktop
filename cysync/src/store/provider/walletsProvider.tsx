import { ALLCOINS as COINS } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import logger from '../../utils/logger';
import { Databases, dbUtil, walletDb, xpubDb } from '../database';

export interface Coin {
  name: string;
  abbr: string;
}

export interface WalletInfo {
  walletId: string;
  name: string;
  passwordSet: boolean;
  passphraseSet: boolean;
}

export interface WalletsContextInterface {
  allWallets: WalletInfo[];
  allCoins: Coin[];
  getAll: () => void;
}

export const WalletsContext: React.Context<WalletsContextInterface> =
  React.createContext<WalletsContextInterface>({} as WalletsContextInterface);

export const WalletsProvider: React.FC = ({ children }) => {
  const [allWallets, setAllWallets] = useState<WalletInfo[]>([
    {
      // UI breaks if the list is empty, hence dummy empty wallet. WalletID is null specially for Portfolio, to differenciate between initial state (walletId is 'null') and no wallets (walletId is '')
      walletId: 'null',
      name: '',
      passwordSet: true,
      passphraseSet: false
    }
  ]);

  const [allCoins, setAllCoins] = useState<Coin[]>([]);

  const getAll = async () => {
    try {
      logger.verbose('Getting all wallets and xpub data');
      const walletRes = await walletDb.getAll();

      if (walletRes.length !== 0) setAllWallets(walletRes);
      else {
        setAllWallets([
          {
            walletId: '',
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
      const xpubRes = await xpubDb.getAll();
      const erc20Res = await dbUtil(Databases.ERC20TOKEN, 'getAll');
      const coinTypeList = new Set<string>();
      for (const xpub of xpubRes) {
        coinTypeList.add(xpub.coin);
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

    walletDb.emitter.on('insert', onUpdate);
    walletDb.emitter.on('update', onUpdate);
    walletDb.emitter.on('delete', onUpdate);

    xpubDb.emitter.on('insert', onUpdate);
    xpubDb.emitter.on('delete', onUpdate);

    dbUtil(Databases.ERC20TOKEN, 'emitter', 'on', 'insert', onUpdate);
    dbUtil(Databases.ERC20TOKEN, 'emitter', 'on', 'delete', onUpdate);

    return () => {
      logger.verbose('Removed all wallet & xpub DB listners.');
      walletDb.emitter.removeListener('insert', onUpdate);
      walletDb.emitter.removeListener('update', onUpdate);
      walletDb.emitter.removeListener('delete', onUpdate);

      xpubDb.emitter.removeListener('insert', onUpdate);
      xpubDb.emitter.removeListener('delete', onUpdate);

      dbUtil(
        Databases.ERC20TOKEN,
        'emitter',
        'removeListener',
        'insert',
        onUpdate
      );
      dbUtil(
        Databases.ERC20TOKEN,
        'emitter',
        'removeListener',
        'delete',
        onUpdate
      );
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
