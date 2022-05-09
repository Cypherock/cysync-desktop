import { COINS } from '@cypherock/communication';
import { getServerUrl } from '@cypherock/server-wrapper';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

import { deleteAllPortfolioCache } from '../../../utils/cache';
import logger from '../../../utils/logger';
import {
  sendAddressDb,
  receiveAddressDb2,
  transactionDb,
  walletDb2,
  coinDb,
  addressDb
} from '../../database';
import { useNetwork } from '../networkProvider';
import { useSync } from '../syncProvider';

import BlockbookSocket from './blockbookProvider';

export interface SocketContextInterface {
  socket: Socket | undefined;
  addReceiveAddressHook: (
    address: string,
    walletId: string,
    coinType: string,
    currentSocket?: Socket
  ) => void;
  addTxnConfirmAddressHook: (
    hash: string,
    coinType: string,
    walletId: string,
    currentSocket?: Socket
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
  const { addBalanceSyncItemFromXpub, addHistorySyncItemFromXpub } = useSync();

  const addReceiveAddressHookFromSocket = (
    address: string,
    walletId: string,
    coinType: string,
    currentSocket?: Socket
  ) => {
    try {
      let usableSocket: Socket;

      if (currentSocket) {
        usableSocket = currentSocket;
      } else if (socket) {
        usableSocket = socket;
      } else {
        logger.error('Socket is not defined');
        return;
      }

      logger.info('Setting Receive address hook', {
        address,
        walletId,
        coinType
      });
      usableSocket.emit('receiveAddr', address, walletId, coinType);
    } catch (error) {
      logger.error(error);
    }
  };

  const addTxnConfirmAddressHookFromSocket = (
    hash: string,
    coinType: string,
    walletId: string,
    currentSocket?: Socket
  ) => {
    try {
      let usableSocket: Socket;

      if (currentSocket) {
        usableSocket = currentSocket;
      } else if (socket) {
        usableSocket = socket;
      } else {
        logger.error('Socket is not defined');
        return;
      }

      logger.info('Setting Txn Confirm hook', { hash, coinType, walletId });
      usableSocket.emit('txnConfirm', hash, coinType, walletId);
    } catch (error) {
      logger.error(error);
    }
  };

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
    coinType: string,
    currentSocket?: Socket,
    currentBlockbookSocket?: BlockbookSocket
  ) => {
    const coin = COINS[coinType];
    if (!coin) {
      logger.warn('Invalid coinType in addReceiveAddressHook: ' + coinType);
      return;
    }

    if (coin.isEth) {
      return addReceiveAddressHookFromSocket(
        address,
        walletId,
        coinType,
        currentSocket
      );
    } else {
      return addReceiveAddressHookFromBlockbookSocket(
        address,
        walletId,
        coinType,
        currentBlockbookSocket
      );
    }
  };

  const addTxnConfirmAddressHook = (
    hash: string,
    coinType: string,
    walletId: string,
    currentSocket?: Socket,
    _currentBlockbookSocket?: BlockbookSocket
  ) => {
    const coin = COINS[coinType];
    if (!coin) {
      logger.warn('Invalid coinType in addTxnConfirmAddressHook: ' + coinType);
      return;
    }

    if (coin.isEth) {
      return addTxnConfirmAddressHookFromSocket(
        hash,
        coinType,
        walletId,
        currentSocket
      );
    } else {
      return;
    }
  };

  const addInitialHooks = async (
    currentSocket: Socket,
    currentBlockbookSocket?: BlockbookSocket
  ) => {
    logger.info('Adding initial socket hooks');

    const allPendingTxns = await transactionDb.getAll({ status: 'PENDING' });

    for (const pendingTxn of allPendingTxns) {
      const coin = COINS[pendingTxn.coin];
      if (coin && coin.isEth) {
        addTxnConfirmAddressHook(
          pendingTxn.hash,
          pendingTxn.walletId,
          pendingTxn.coin,
          currentSocket,
          currentBlockbookSocket
        );
      }
    }

    const allReceiveAddr = await receiveAddressDb2.getAll();

    for (const receiveAddr of allReceiveAddr) {
      const coin = COINS[receiveAddr.coinType];
      if (coin && coin.isEth) {
        addReceiveAddressHook(
          receiveAddr.address,
          receiveAddr.walletId,
          receiveAddr.coinType,
          currentSocket,
          currentBlockbookSocket
        );
      }
    }
  };

  const addInitialSubscriptions = async (
    currentSocket?: Socket,
    currentBlockbookSocket?: BlockbookSocket
  ) => {
    logger.info('Adding initial blockbook web subscriptions');
    const allPendingTxns = await transactionDb.getAll({ status: 'PENDING' });

    for (const pendingTxn of allPendingTxns) {
      const coin = COINS[pendingTxn.coin];
      if (coin && !coin.isEth) {
        addTxnConfirmAddressHook(
          pendingTxn.hash,
          pendingTxn.walletId,
          pendingTxn.coin,
          currentSocket,
          currentBlockbookSocket
        );
      }
    }

    const allReceiveAddr = await receiveAddressDb2.getAll();

    for (const receiveAddr of allReceiveAddr) {
      const coin = COINS[receiveAddr.coinType];
      if (coin && !coin.isEth) {
        addReceiveAddressHook(
          receiveAddr.address,
          receiveAddr.walletId,
          receiveAddr.coinType,
          currentSocket,
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
          if (payload && payload.id && payload.coinType) {
            const wallet = await walletDb2.getOne({id: payload.id});
            if (wallet) {
              const coin = await coinDb.getOne({
                walletId: payload.id,
                slug: payload.coinType
              });

              if (coin) {
                transactionDb.insertFromFullTxn({
                  txn: payload,
                  xpub: coin.xpub,
                  addresses: [],
                  walletId: payload.id,
                  coinType: payload.coinType,
                  addressDB: addressDb
                });
                if (payload.tokenAbbr) {
                  addBalanceSyncItemFromXpub(coin, {
                    isRefresh: true,
                    token: payload.tokenAbbr as string
                  });
                } else {
                  addBalanceSyncItemFromXpub(coin, {
                    isRefresh: true
                  });
                }

                // Update the confirmation if the database has a txn with same hash
                await transactionDb.updateConfirmations(payload);
                const allTxWithSameHash = await transactionDb.getAll({
                  hash: payload.hash
                });
                if (allTxWithSameHash && allTxWithSameHash.length > 0) {
                  logger.info(
                    `Updating balances of ${allTxWithSameHash.length} txn via receive address hook`
                  );
                  for (const tx of allTxWithSameHash) {
                    const txXpub = await coinDb.getOne({
                      walletId: tx.walletId,
                      slug: tx.ethCoin || tx.coin
                    });
                    if (txXpub) {
                      if (payload.tokenAbbr) {
                        addBalanceSyncItemFromXpub(txXpub, {
                          isRefresh: true,
                          token: payload.tokenAbbr as string
                        });
                      } else {
                        addBalanceSyncItemFromXpub(txXpub, {
                          isRefresh: true
                        });
                      }
                    } else {
                      logger.warn('Could not found xpub for wallet', {
                        walletId: tx.walletId,
                        coin: tx.ethCoin || tx.coin
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
            const confirmations = await transactionDb.updateConfirmations(
              payload
            );
            logger.info('Txn confirmed', {
              hash: payload.hash,
              coinType: payload.coinType
            });
            if (confirmations >= 1) {
              // Remove the hook once confirmed
              currentSocket.emit('removeTxnConfirm', payload.hash);
              deleteAllPortfolioCache();

              // Update balance when confirmed
              if (payload.id) {
                const xpub = await coinDb.getOne({
                  walletId: payload.id,
                  slug: payload.coinType
                });

                if (xpub) {
                  logger.verbose(
                    'Txn confirm hook changed state from pending to confirmed'
                  );
                  if (payload.tokenAbbr) {
                    addBalanceSyncItemFromXpub(xpub, {
                      isRefresh: true,
                      token: payload.tokenAbbr as string
                    });
                  } else {
                    addBalanceSyncItemFromXpub(xpub, {
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

    const addressDetails = await sendAddressDb.getOne({ address, coinType });
    if (addressDetails) {
      walletId = addressDetails.walletId;
      const coinDetails = await coinDb.getOne({
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
            payload.txn.confirmations && payload.txn.confirmation > 0;

          for (const address of allAddresses) {
            const coin = await coinDb.getOne({
              walletId: address.walletId,
              slug: payload.coinType
            });

            if (coin) {
              transactionDb.insertFromBlockbookTxn({
                txn: payload.txn,
                xpub: coin.xpub,
                addresses: [],
                walletId: address.walletId,
                coinType: payload.coinType,
                addressDB: addressDb
              });

              if (isConfirmed) {
                addBalanceSyncItemFromXpub(coin, {
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
      try {
        if (payload && payload.coinType) {
          const pendingTxns = await transactionDb.getAll({
            coin: payload.coinType,
            status: 'PENDING'
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
              const coins = await coinDb.getAll({
                slug: payload.coinType,
                walletId
              });

              for (const coin of coins) {
                addBalanceSyncItemFromXpub(coin, {
                  isRefresh: true
                });
                addHistorySyncItemFromXpub(coin, {
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
    if (socket) {
      addInitialHooks(socket, blockbookSocket);
    }
  }, [socket]);

  useEffect(() => {
    if (blockbookSocket) {
      addInitialSubscriptions(socket, blockbookSocket);
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
        addTxnConfirmAddressHook,
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
