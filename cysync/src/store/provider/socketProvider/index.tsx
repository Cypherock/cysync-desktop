import { CoinGroup, COINS } from '@cypherock/communication';
import { getServerUrl } from '@cypherock/server-wrapper';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

import { deleteAllPortfolioCache } from '../../../utils/cache';
import logger from '../../../utils/logger';
import {
  accountDb,
  addressDb,
  insertFromFullTxn,
  prepareFromBlockbookTxn,
  receiveAddressDb,
  Status,
  transactionDb,
  updateConfirmations,
  walletDb
} from '../../database';
import { useNetwork } from '../networkProvider';
import { useSync } from '../syncProvider';
import { useStatusCheck } from '../transactionStatusProvider';

import BlockbookSocket from './blockbookProvider';

export interface SocketContextInterface {
  socket: Socket | undefined;
  addReceiveAddressHook: (
    address: string,
    walletId: string,
    coinType: string,
    blockbookSocket?: BlockbookSocket
  ) => void;
}

export const SocketContext: React.Context<SocketContextInterface> =
  React.createContext<SocketContextInterface>({} as SocketContextInterface);

export const SocketProvider: React.FC = ({ children }) => {
  const { connected } = useNetwork();
  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const [blockbookSocket, setBlockbookSocket] = useState<
    BlockbookSocket | undefined
  >(undefined);
  const { addBalanceSyncItemFromCoin, addHistorySyncItemFromCoin } = useSync();
  const { addTransactionStatusCheckItem } = useStatusCheck();

  const addReceiveAddressHookFromBlockbookSocket = async (
    address: string,
    walletId: string,
    coinType: string,
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
        walletId,
        coinType
      });
      await usableSocket.addAddressListener(coinType, [{ address, walletId }]);
    } catch (error) {
      logger.error(error);
    }
  };

  const addReceiveAddressHook = (
    address: string,
    walletId: string,
    coinId: string,
    currentBlockbookSocket?: BlockbookSocket
  ) => {
    const coin = COINS[coinId];
    if (!coin) {
      logger.warn('Invalid coinType in addReceiveAddressHook: ' + coinId);
      return;
    }
    if (coin.group === CoinGroup.Ethereum || coin.group === CoinGroup.Solana) {
      return;
    } else {
      return addReceiveAddressHookFromBlockbookSocket(
        address,
        walletId,
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
      const coin = COINS[receiveAddr.coinType];
      if (coin && coin.group === CoinGroup.BitcoinForks) {
        addReceiveAddressHook(
          receiveAddr.address,
          receiveAddr.walletId,
          receiveAddr.coinType,
          currentBlockbookSocket
        );
      }
    }
  };

  const setSocketEvents = (currentSocket: Socket) => {
    currentSocket.on('disconnect', () => {
      logger.info('Socket disconnected');
    });

    currentSocket.on('connect', async () => {
      currentSocket.on('receivedTransaction', async (payload: any) => {
        try {
          logger.info('Received receive txn hook', { payload });
          if (payload && payload.walletId && payload.coinType) {
            const wallet = await walletDb.getById(payload.walletId);
            if (wallet) {
              const coin = await accountDb.getOne({
                walletId: payload.walletId,
                slug: payload.coinType
              });

              if (coin) {
                insertFromFullTxn({
                  txn: payload,
                  xpub: coin.xpub,
                  addresses: [],
                  walletId: payload.walletId,
                  coinId: payload.coinType,
                  addressDB: addressDb
                });
                if (payload.tokenAbbr) {
                  addBalanceSyncItemFromCoin(coin, {
                    isRefresh: true,
                    token: payload.tokenAbbr as string
                  });
                } else {
                  addBalanceSyncItemFromCoin(coin, {
                    isRefresh: true
                  });
                }

                // Update the confirmation if the database has a txn with same hash
                await updateConfirmations(payload);
                const allTxWithSameHash = await transactionDb.getAll({
                  hash: payload.hash
                });
                if (allTxWithSameHash && allTxWithSameHash.length > 0) {
                  logger.info(
                    `Updating balances of ${allTxWithSameHash.length} txn via receive address hook`
                  );
                  for (const tx of allTxWithSameHash) {
                    const txXpub = await accountDb.getOne({
                      walletId: tx.walletId,
                      slug: tx.slug || tx.coin
                    });
                    if (txXpub) {
                      if (payload.tokenAbbr) {
                        addBalanceSyncItemFromCoin(txXpub, {
                          isRefresh: true,
                          token: payload.tokenAbbr as string
                        });
                      } else {
                        addBalanceSyncItemFromCoin(txXpub, {
                          isRefresh: true
                        });
                      }
                    } else {
                      logger.warn('Could not found xpub for wallet', {
                        walletId: tx.walletId,
                        coin: tx.slug || tx.coin
                      });
                    }
                  }
                }
              } else {
                logger.warn('Receive txn hook, xpub not found');
              }
            } else {
              logger.warn('Receive txn hook wallet does not exist');
            }
          } else {
            logger.warn('Receive txn hook does not have proper data');
          }
        } catch (error) {
          logger.error('Error while processing receive txn hook');
          logger.error(error);
        }
      });

      currentSocket.on('txnConfirm', async (payload: any) => {
        try {
          logger.info('Received txn confirmation hook', { payload });
          if (payload && payload.hash && payload.coinType) {
            const confirmations = await updateConfirmations(payload);
            logger.info('Txn confirmed', {
              hash: payload.hash,
              coinType: payload.coinType
            });
            if (confirmations >= 1) {
              // Remove the hook once confirmed
              currentSocket.emit('removeTxnConfirm', payload.hash);
              deleteAllPortfolioCache();

              // Update balance when confirmed
              if (payload.walletId) {
                const xpub = await accountDb.getOne({
                  walletId: payload.walletId,
                  slug: payload.coinType
                });

                if (xpub) {
                  logger.verbose(
                    'Txn confirm hook changed state from pending to confirmed'
                  );
                  if (payload.tokenAbbr) {
                    addBalanceSyncItemFromCoin(xpub, {
                      isRefresh: true,
                      token: payload.tokenAbbr as string
                    });
                  } else {
                    addBalanceSyncItemFromCoin(xpub, {
                      isRefresh: true
                    });
                  }
                } else {
                  logger.warn('Txn Confirm hook does not proper walletId');
                }
              }
            }
          } else {
            logger.warn('Txn Confirm hook does not have proper data');
          }
        } catch (error) {
          logger.error('Error while processing txn confirmation hook');
          logger.error(error);
        }
      });
    });
  };

  const getWalletDataFromAddress = async (
    coinType: string,
    address: string
  ): Promise<{ walletId: string | undefined; xpub: string | undefined }> => {
    let walletId: string | undefined;
    let xpub: string | undefined;

    const addressDetails = await addressDb.getOne({ address, coinType });
    if (addressDetails) {
      walletId = addressDetails.walletId;
      const coinDetails = await accountDb.getOne({
        walletId,
        slug: coinType
      });
      xpub = coinDetails.xpub;
    }

    return { xpub, walletId };
  };

  const getDetailsFromTxn = async (
    coinType: string,
    txn: any
  ): Promise<Array<{ xpub: string; walletId: string; address: string }>> => {
    const addresses = new Set<string>();
    const finalResp: Array<{
      xpub: string;
      walletId: string;
      address: string;
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
      const walletDetails = await getWalletDataFromAddress(coinType, address);
      if (walletDetails.walletId && walletDetails.xpub) {
        finalResp.push({
          address,
          walletId: walletDetails.walletId,
          xpub: walletDetails.xpub
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
        if (payload && payload.coinType && payload.txn) {
          const allAddresses = await getDetailsFromTxn(
            payload.coinType,
            payload.txn
          );

          const isConfirmed =
            payload.txn.confirmations && payload.txn.confirmations > 0;

          for (const address of allAddresses) {
            const coin = await accountDb.getOne({
              walletId: address.walletId,
              slug: payload.coinType
            });

            if (coin) {
              // TODO: NOW
              const newTxns = await prepareFromBlockbookTxn({
                txn: payload.txn,
                xpub: coin.xpub,
                addresses: [],
                walletId: address.walletId,
                coinType: payload.coinType,
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
        if (payload && payload.coinType) {
          const pendingTxns = await transactionDb.getAll({
            slug: payload.coinType,
            status: Status.PENDING
          });

          if (pendingTxns && pendingTxns.length > 0) {
            const walletIdSet = new Set<string>();
            for (const txn of pendingTxns) {
              if (txn && txn.walletId) {
                walletIdSet.add(txn.walletId);
              }
            }

            logger.info(`Updating balances of ${walletIdSet.size} coins`);

            for (const walletId of walletIdSet) {
              const coins = await accountDb.getAll({
                slug: payload.coinType,
                walletId
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

      const webServers = ['btc', 'btct', 'ltc', 'dash', 'doge'];

      logger.info('Setting Blockbook websocket');
      const currentBlockbookSocket = new BlockbookSocket(
        webServers.map(elem => {
          return { name: elem, url: `https://${elem}1.cypherock.com` };
        })
      );

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

      logger.info('Setting Socket');
      const currentSocket = io(getServerUrl(), {
        transports: ['polling', 'websocket']
      });

      setSocketEvents(currentSocket);

      setSocket(currentSocket);

      // Destroys the socket reference
      // when the connection is closed
      return () => {
        logger.info('Removing socket');

        if (currentSocket) {
          currentSocket.removeAllListeners();
          currentSocket.disconnect();
        }

        if (currentBlockbookSocket) {
          currentBlockbookSocket.removeAllListeners();
          currentBlockbookSocket.dispose();
        }

        setBlockbookSocket(undefined);
        setSocket(undefined);
      };
    }

    return () => {
      // empty
    };
  }, [connected]);

  return (
    <SocketContext.Provider
      value={{
        addReceiveAddressHook,
        socket
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
