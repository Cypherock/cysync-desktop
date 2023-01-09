import { BtcCoinMap, CoinGroup, COINS } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import logger from '../../../utils/logger';
import {
  accountDb,
  addressDb,
  prepareFromBlockbookTxn,
  receiveAddressDb,
  Status,
  transactionDb
} from '../../database';
import { useNetwork } from '../networkProvider';
import { useSync } from '../syncProvider';
import { useStatusCheck } from '../transactionStatusProvider';

import BlockbookSocket from './blockbookProvider';

export interface SocketContextInterface {
  addReceiveAddressHook: (
    address: string,
    accountId: string,
    coinId: string,
    blockbookSocket?: BlockbookSocket
  ) => void;
}

export const SocketContext: React.Context<SocketContextInterface> =
  React.createContext<SocketContextInterface>({} as SocketContextInterface);

export const SocketProvider: React.FC = ({ children }) => {
  const { connected } = useNetwork();
  const [blockbookSocket, setBlockbookSocket] = useState<
    BlockbookSocket | undefined
  >(undefined);
  const { addBalanceSyncItemFromCoin, addHistorySyncItemFromCoin } = useSync();
  const { addTransactionStatusCheckItem } = useStatusCheck();

  const addReceiveAddressHookFromBlockbookSocket = async (
    address: string,
    accountId: string,
    coinId: string,
    currentSocket?: BlockbookSocket
  ) => {
    try {
      let usableSocket: BlockbookSocket;

      if (currentSocket) {
        usableSocket = currentSocket;
      } else if (blockbookSocket) {
        usableSocket = blockbookSocket;
      } else {
        logger.error('BlockbookSocket is not defined');
        return;
      }

      logger.info('Setting Receive address hook on Blockbook', {
        address,
        accountId,
        coinId
      });
      await usableSocket.addAddressListener(coinId, [{ address, accountId }]);
    } catch (error) {
      logger.error(error);
    }
  };

  const addReceiveAddressHook = (
    address: string,
    accountId: string,
    coinId: string,
    currentBlockbookSocket?: BlockbookSocket
  ) => {
    const coin = COINS[coinId];
    if (!coin) {
      logger.warn('Invalid coinId in addReceiveAddressHook: ' + coinId);
      return;
    }
    if (coin.group === CoinGroup.Ethereum || coin.group === CoinGroup.Solana) {
      return;
    } else {
      return addReceiveAddressHookFromBlockbookSocket(
        address,
        accountId,
        coinId,
        currentBlockbookSocket
      );
    }
  };

  const addInitialSubscriptions = async (
    currentBlockbookSocket?: BlockbookSocket
  ) => {
    logger.info('Adding initial blockbook web subscriptions');

    // no direct support for pendingTxn status in Bitcoin

    const allReceiveAddr = await receiveAddressDb.getAll();

    for (const receiveAddr of allReceiveAddr) {
      const coin = COINS[receiveAddr.coinId];
      if (coin && coin.group === CoinGroup.BitcoinForks) {
        addReceiveAddressHook(
          receiveAddr.address,
          receiveAddr.accountId,
          receiveAddr.coinId,
          currentBlockbookSocket
        );
      }
    }
  };

  const getWalletDataFromAddress = async (
    coinId: string,
    address: string
  ): Promise<{
    walletId: string | undefined;
    xpub: string | undefined;
    accountId: string;
  }> => {
    let walletId: string | undefined;
    let xpub: string | undefined;

    const addressDetails = await addressDb.getOne({ address, coinId });
    if (addressDetails) {
      walletId = addressDetails.walletId;
      const coinDetails = await accountDb.getOne({
        accountId: addressDetails.accountId,
        coinId
      });
      xpub = coinDetails.xpub;
    }

    return { xpub, walletId, accountId: addressDetails.accountId };
  };

  const getDetailsFromTxn = async (
    coinId: string,
    txn: any
  ): Promise<
    Array<{
      xpub: string;
      walletId: string;
      address: string;
      accountId: string;
    }>
  > => {
    const addresses = new Set<string>();
    const finalResp: Array<{
      xpub: string;
      walletId: string;
      address: string;
      accountId: string;
    }> = [];

    if (!txn) {
      return [];
    }

    if (txn.vin && Array.isArray(txn.vin)) {
      for (const inp of txn.vin) {
        if (
          inp &&
          inp.isAddress &&
          inp.addresses &&
          Array.isArray(inp.addresses)
        ) {
          for (const addr of inp.addresses) {
            addresses.add(addr);
          }
        }
      }
    }

    if (txn.vout && Array.isArray(txn.vout)) {
      for (const out of txn.vout) {
        if (
          out &&
          out.isAddress &&
          out.addresses &&
          Array.isArray(out.addresses)
        ) {
          for (const addr of out.addresses) {
            addresses.add(addr);
          }
        }
      }
    }

    const addressesList = Array.from(addresses);

    for (const address of addressesList) {
      const walletDetails = await getWalletDataFromAddress(coinId, address);
      if (
        walletDetails.walletId &&
        walletDetails.xpub &&
        walletDetails.accountId
      ) {
        finalResp.push({
          address,
          walletId: walletDetails.walletId,
          xpub: walletDetails.xpub,
          accountId: walletDetails.accountId
        });
      }
    }

    return finalResp;
  };

  const setBlockbookSocketEvents = (
    currentBlockbookSocket: BlockbookSocket
  ) => {
    currentBlockbookSocket.on('txn', async (payload: any) => {
      try {
        logger.info('Received txn from blockbookSocket', { payload });
        if (payload && payload.coinId && payload.txn) {
          const allAddresses = await getDetailsFromTxn(
            payload.coinId,
            payload.txn
          );

          const isConfirmed =
            payload.txn.confirmations && payload.txn.confirmations > 0;

          for (const address of allAddresses) {
            const coin = await accountDb.getOne({
              accountId: address.accountId
            });

            if (coin) {
              const newTxns = await prepareFromBlockbookTxn({
                txn: payload.txn,
                xpub: coin.xpub,
                accountId: coin.accountId,
                coinId: coin.coinId,
                parentCoinId: coin.coinId,
                addresses: [],
                walletId: address.walletId,
                addressDB: addressDb
              });
              await Promise.all(
                newTxns.map(newTxn => {
                  transactionDb.insert(newTxn);
                  addTransactionStatusCheckItem(newTxn);
                })
              );

              if (isConfirmed) {
                addBalanceSyncItemFromCoin(coin, {
                  isRefresh: true
                });
              }
            } else {
              logger.warn('Cannot find xpub for receive txn from blockbook');
            }
          }
        } else {
          logger.warn('Receive txn hook does not have proper data');
        }
      } catch (error) {
        logger.error('Error while processing receive txn hook');
        logger.error(error);
      }
    });

    currentBlockbookSocket.on('block', async (payload: any) => {
      logger.info('Received block from blockbookSocket', { payload });
      try {
        if (payload && payload.coinId) {
          const pendingTxns = await transactionDb.getAll({
            coinId: payload.coinId,
            status: Status.PENDING
          });

          if (pendingTxns && pendingTxns.length > 0) {
            const accountIdSet = new Set<string>();
            for (const txn of pendingTxns) {
              if (txn && txn.accountId) {
                accountIdSet.add(txn.accountId);
              }
            }

            logger.info(`Updating balances of ${accountIdSet.size} coins`);

            for (const accountId of accountIdSet) {
              const coins = await accountDb.getAll({
                accountId
              });

              for (const coin of coins) {
                addBalanceSyncItemFromCoin(coin, {
                  isRefresh: true
                });
                addHistorySyncItemFromCoin(coin, {
                  isRefresh: true
                });
              }
            }
          }
        } else {
          logger.warn('Receive new block hook does not have proper data', {
            payload
          });
        }
      } catch (error) {
        logger.error('Error while processing receive txn hook');
        logger.error(error);
      }
    });
  };

  useEffect(() => {
    if (blockbookSocket) {
      addInitialSubscriptions(blockbookSocket);
    }
  }, [blockbookSocket]);

  useEffect(() => {
    if (connected) {
      if (process.env.IS_PRODUCTION !== 'true') {
        return () => {
          // empty
        };
      }

      const webServers = Object.values(BtcCoinMap).map(elem => {
        const coin = COINS[elem];
        return {
          coinId: coin.id,
          name: coin.abbr,
          url: `https://${coin.abbr}1.cypherock.com`
        };
      });

      logger.info('Setting Blockbook websocket');
      const currentBlockbookSocket = new BlockbookSocket(webServers);

      currentBlockbookSocket
        .connect()
        .then(() => {
          logger.info('Connected to blockbook websocket');
          currentBlockbookSocket
            .subscribeAllBlocks()
            .then(() => {
              logger.info('Subscribed to all new blocks on blockbook');
            })
            .catch(error => {
              logger.warn('Failed to Subscribe all new blocks on blockbook');
              logger.error(error);
            });
          setBlockbookSocketEvents(currentBlockbookSocket);
          setBlockbookSocket(currentBlockbookSocket);
        })
        .catch(error => {
          logger.error('Failed to connect to blockbook websocket');
          logger.error(error);
        });

      // Destroys the socket reference
      // when the connection is closed
      return () => {
        logger.info('Removing socket');

        if (currentBlockbookSocket) {
          currentBlockbookSocket.removeAllListeners();
          currentBlockbookSocket.dispose();
        }

        setBlockbookSocket(undefined);
      };
    }

    return () => {
      // empty
    };
  }, [connected]);

  return (
    <SocketContext.Provider
      value={{
        addReceiveAddressHook
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useSocket(): SocketContextInterface {
  return React.useContext(SocketContext);
}
