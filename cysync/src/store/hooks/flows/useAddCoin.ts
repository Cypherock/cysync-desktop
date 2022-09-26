import {
  COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import {
  CoinAdder,
  FlowError,
  FlowErrorType,
  WalletStates
} from '@cypherock/protocols';
import newWallet from '@cypherock/wallet';
import { useEffect, useState } from 'react';

import {
  CyError,
  CysyncError,
  handleAxiosErrors,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import logger from '../../../utils/logger';
import { addressDb, Coin, coinDb } from '../../database';
import { useSync } from '../../provider';

import * as flowHandlers from './handlers';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface AddCoinStatus {
  coin: Coin;
  name: string;
  status: -1 | 0 | 1 | 2;
}

export interface HandleAddCoinOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  walletId: string;
  coinsFromGUI: string[];
  pinExists: boolean;
  passphraseExists: boolean;
  isXpubMissing?: boolean;
}

export interface UseAddCoinValues {
  coinsConfirmed: boolean;
  setCoinsConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
  addCoinCompleted: boolean;
  setAddCoinCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  cardTap: boolean;
  setCardTap: React.Dispatch<React.SetStateAction<boolean>>;
  pinEntered: boolean;
  setPinEntered: React.Dispatch<React.SetStateAction<boolean>>;
  passphraseEntered: boolean;
  setPassphraseEntered: React.Dispatch<React.SetStateAction<boolean>>;
  errorObj: CyError;
  clearErrorObj: () => void;
  handleCoinAdd: (options: HandleAddCoinOptions) => Promise<void>;
  resetHooks: () => void;
  cancelAddCoin: (connection: DeviceConnection) => Promise<void>;
  completed: boolean;
  detailedMessage: string;
  addCoinStatus: AddCoinStatus[];
}

export type UseAddCoin = () => UseAddCoinValues;

export const useAddCoin: UseAddCoin = () => {
  const [coinsConfirmed, setCoinsConfirmed] = useState(false);
  const [pinEntered, setPinEntered] = useState(false);
  const [passphraseEntered, setPassphraseEntered] = useState(false);
  const [addCoinCompleted, setAddCoinCompleted] = useState(false);
  const [cardTap, setCardTap] = useState(false);
  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const [detailedMessage, setDetailedMessage] = useState('');
  const [completed, setCompleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const [addCoinStatus, setAddCoinStatus] = useState<AddCoinStatus[]>([]);

  const [isAddingCoin, setIsAddingCoin] = useState(false);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [addCoinIndex, setAddCoinIndex] = useState(-1);

  const [allFailedCoins, setAllFailedCoins] = useState<string[]>([]);
  const [allNetFailedCoins, setAllNetFailedCoins] = useState<string[]>([]);
  const [allInternalFailedCoins, setAllInternalFailedCoins] = useState<
    string[]
  >([]);

  const sync = useSync();
  const addCoin = new CoinAdder();

  // converts data from GUI to required format;
  const getCoinList = (coinsFromGUI: string[]) => {
    return coinsFromGUI
      .filter(coin => {
        return coin[2];
      })
      .map(coin => {
        return coin[0];
      });
  };

  // To call resetHooks outside of this function
  const resetHooks = () => {
    setCoinsConfirmed(false);
    setPinEntered(false);
    setPassphraseEntered(false);
    setAddCoinCompleted(false);
    setCardTap(false);

    setAddCoinStatus([]);
    setAddCoinIndex(-1);
    setAllFailedCoins([]);
    setAllInternalFailedCoins([]);
    setAllNetFailedCoins([]);
    setIsAddingCoin(false);
    setIsExecutingTask(false);

    setCompleted(false);
    addCoin.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    clearErrorObj();
    resetHooks();
  };

  // This starts the adding coin task in a queue similar to `syncProvider`.
  const setUpCoinWallets = async (coinList: Coin[]) => {
    const coinStatus: AddCoinStatus[] = [];

    for (const [i, coin] of coinList.entries()) {
      const coinData = COINS[coin.slug];
      if (!coinData.deprecated)
        coinStatus.push({ coin, name: coinData.name, status: i === 0 ? 1 : 0 });
    }

    setAddCoinIndex(0);
    setAddCoinStatus(coinStatus);
    setIsAddingCoin(true);
  };

  const executeNextInQueue = async () => {
    setIsExecutingTask(true);

    const coinStatus: AddCoinStatus[] = JSON.parse(
      JSON.stringify(addCoinStatus)
    ) as AddCoinStatus[];
    let isFailed = false;
    let latestAllFailedCoins: string[] = [...allFailedCoins];
    let latestAllNetFailedCoins: string[] = [...allNetFailedCoins];
    let latestAllInternalFailedCoins: string[] = [...allInternalFailedCoins];

    if (addCoinIndex > -1 && addCoinIndex < coinStatus.length) {
      const currentCoin = coinStatus[addCoinIndex];
      const { coin } = currentCoin;
      try {
        const wallet = newWallet({
          coinType: coin.slug,
          xpub: coin.xpub,
          walletId: coin.walletId,
          zpub: coin.zpub,
          addressDB: addressDb
        });
        await wallet.setupNewWallet();
        await coinDb.insert(coin);
        coinStatus[addCoinIndex].status = 2;
      } catch (error) {
        coinStatus[addCoinIndex].status = -1;

        logger.error(error);
        const remainingCoins = addCoinStatus
          .slice(addCoinIndex)
          .map(elem => elem.coin.slug);
        if (error.isAxiosError && !error.response) {
          latestAllNetFailedCoins = [...allNetFailedCoins, ...remainingCoins];
          latestAllFailedCoins = [...allFailedCoins, ...remainingCoins];

          setAllNetFailedCoins(latestAllNetFailedCoins);
          setAllFailedCoins(latestAllFailedCoins);
          await sleep(1000);
          isFailed = true;
        } else {
          latestAllInternalFailedCoins = [...allInternalFailedCoins, coin.slug];
          latestAllFailedCoins = [...allFailedCoins, coin.slug];

          setAllInternalFailedCoins(latestAllInternalFailedCoins);
          setAllFailedCoins(latestAllFailedCoins);
        }
      }

      if (addCoinIndex + 1 < coinStatus.length) {
        coinStatus[addCoinIndex + 1].status = 1;
      }

      setAddCoinStatus(coinStatus);
    }

    if (addCoinIndex + 1 >= coinStatus.length || isFailed) {
      let message = '';
      const cyError = new CyError();
      if (latestAllNetFailedCoins.length > 0) {
        const serverError = cyError.pushSubErrors(
          CysyncError.ADD_COIN_FAILED_DUE_TO_SERVER_ERROR,
          latestAllNetFailedCoins.join(',').toUpperCase()
        );
        message += serverError.getMessage();
        message += '\n';
      }
      if (latestAllInternalFailedCoins.length > 0) {
        const failedError = cyError.pushSubErrors(
          CysyncError.ADD_COIN_FAILED_INTERNAL_ERROR,
          latestAllInternalFailedCoins.join(',').toUpperCase()
        );
        message += failedError.getMessage();
        message += '\n';
      }

      setDetailedMessage(message);

      if (latestAllFailedCoins.length > 0) {
        cyError.setError(
          CysyncError.ADD_COIN_FAILED,
          latestAllFailedCoins.join(', ').toUpperCase()
        );
        setErrorObj(handleErrors(errorObj, cyError));
      }

      const filteredXpubList = coinStatus.filter(elem => elem.status === 2);
      for (const coin of filteredXpubList) {
        sync.addCoinTask(coin.coin, {
          module: `${coin.coin.walletId}-${coin.coin.slug}`
        });
      }

      setAddCoinIndex(-1);
      setIsAddingCoin(false);
      setAddCoinCompleted(true);
    } else {
      setAddCoinIndex(addCoinIndex + 1);
    }

    await sleep(1000);
    setIsExecutingTask(false);
  };

  useEffect(() => {
    if (isAddingCoin && !isExecutingTask) {
      executeNextInQueue();
    }
  }, [isAddingCoin, isExecutingTask]);

  const handleCoinAdd = async ({
    connection,
    sdkVersion,
    setIsInFlow,
    walletId,
    coinsFromGUI,
    pinExists,
    passphraseExists,
    isXpubMissing = false
  }: HandleAddCoinOptions) => {
    clearAll();

    const selectedCoins = getCoinList(coinsFromGUI);
    const flowName = isXpubMissing ? `ResyncCoin` : `AddCoin`;
    logger.info(`${flowName}: Initiated`);

    if (!connection) {
      logger.error(`${flowName}: Failed - Device not connected`);
      const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
      return;
    }

    addCoin.on('connectionOpen', () => {
      logger.info(`${flowName}: Connection Opened`);
    });

    addCoin.on('connectionClose', () => {
      logger.info(`${flowName}: Connection Closed`);
    });

    addCoin.on('cardError', () => {
      // CRD_SEC_5500
      const cyError = new CyError(CysyncError.UNKNOWN_CARD_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
    });

    addCoin.on('error', err => {
      const cyError = new CyError();
      if (err.isAxiosError) {
        handleAxiosErrors(cyError, err);
      } else if (err instanceof DeviceError) {
        handleDeviceErrors(cyError, err, flowName);
      } else if (err instanceof FlowError) {
        if (err.errorType === FlowErrorType.ADD_COIN_UNKNOWN_ASSET) {
          cyError.pushSubErrors(FlowErrorType.ADD_COIN_UNKNOWN_ASSET);
          cyError.setError(CysyncError.ADD_COIN_FAILED, err.metadata);
        }
      } else {
        cyError.setError(CysyncError.ADD_COIN_UNKNOWN_ERROR);
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
    });

    addCoin.on('locked', () => {
      const cyError = new CyError(CysyncError.WALLET_IS_LOCKED);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
    });

    addCoin.on('coinsConfirmed', (confirmation: boolean) => {
      if (confirmation) {
        logger.verbose(`${flowName}: Coins confirmed`);
        setCoinsConfirmed(true);
      } else {
        const cyError = new CyError(CysyncError.ADD_COIN_REJECTED);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      }
    });

    addCoin.on('passphraseEntered', () => {
      logger.verbose(`${flowName}: Passphrase Entered`);
      setPassphraseEntered(true);
    });

    addCoin.on('pinEntered', (pin: boolean) => {
      if (pin) {
        logger.verbose(`${flowName}: Pin Entered`);
        setPinEntered(true);
      } else {
        const cyError = new CyError(
          CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName));
        resetHooks();
      }
    });

    addCoin.on('cardTapped', () => {
      logger.verbose(`${flowName}: Card tapped`);
      setCardTap(true);
    });

    addCoin.on('xpubList', async xpubList => {
      logger.verbose(`${flowName}: Xpub generated`);
      setCompleted(true);
      if (!isXpubMissing) {
        // if there is a coin present in the list that is unknown while setting up,
        // that would caught in a previous step in the name of ADD_COIN_UNKNOWN_ASSET
        await setUpCoinWallets(xpubList);
      } else {
        setAddCoinCompleted(true);
      }
    });

    addCoin.on('unknownError', () => {
      const cyError = new CyError(CysyncError.ADD_COIN_UNKNOWN_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
      resetHooks();
    });

    addCoin.on('notReady', () => {
      const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
      resetHooks();
    });

    addCoin.on('noWalletFound', (walletState: WalletStates) => {
      const cyError = flowHandlers.noWalletFound(walletState);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { walletState }));
      resetHooks();
    });

    addCoin.on('noWalletOnCard', () => {
      const cyError = new CyError(CysyncError.WALLET_NOT_FOUND_IN_CARD);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
      resetHooks();
    });

    try {
      setIsInFlow(true);
      /**
       * Error will be thrown in rare conditions where the implementation
       * itself has broken.
       */
      await addCoin.run({
        connection,
        sdkVersion,
        walletId,
        selectedCoins,
        isResync: isXpubMissing,
        pinExists,
        passphraseExists
      });
      setIsInFlow(false);
      logger.info(`${flowName}: Completed`);
    } catch (e) {
      setIsInFlow(false);
      const cyError = new CyError(CysyncError.ADD_COIN_UNKNOWN_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err: e }));
      addCoin.removeAllListeners();
    }
  };

  const cancelAddCoin = async (connection: DeviceConnection) => {
    setIsCancelled(true);
    await addCoin
      .cancel(connection)
      .then(canclled => {
        if (canclled) {
          logger.info('AddCoin: Cancelled');
        }
      })
      .catch(e => {
        logger.error('AddCoin: Error in flow cancel');
        logger.error(e);
      });
  };

  // I think this will work, reset the error obj if its cancelled
  useEffect(() => {
    if (isCancelled && errorObj.isSet) {
      clearErrorObj();
    }
  }, [errorObj]);

  const clearErrorObj = () => {
    setErrorObj(new CyError());
  };

  return {
    coinsConfirmed,
    setCoinsConfirmed,
    addCoinCompleted,
    setAddCoinCompleted,
    cardTap,
    setCardTap,
    pinEntered,
    setPinEntered,
    passphraseEntered,
    setPassphraseEntered,
    errorObj,
    clearErrorObj,
    handleCoinAdd,
    resetHooks,
    cancelAddCoin,
    completed,
    detailedMessage,
    addCoinStatus
  } as UseAddCoinValues;
};
