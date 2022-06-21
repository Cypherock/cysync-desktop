import {
  COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { CoinAdder } from '@cypherock/protocols';
import newWallet from '@cypherock/wallet';
import { useEffect, useState } from 'react';

import logger from '../../../utils/logger';
import { addressDb, Coin, coinDb } from '../../database';
import { useI18n, useSync } from '../../provider';

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
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
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
  const [externalErrorMsg, setExternalErrorMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
  const { langStrings } = useI18n();
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
    setExternalErrorMsg('');
    setErrorMessage('');
    resetHooks();
  };

  // This starts the adding coin task in a queue similar to `syncProvider`.
  const setUpCoinWallets = async (coinList: Coin[]) => {
    const coinStatus: AddCoinStatus[] = [];

    for (const [i, coin] of coinList.entries()) {
      const coinData = COINS[coin.slug];
      if (!coinData) {
        throw new Error(`Cannot find coinType: ${coin.slug}`);
      }

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
      if (latestAllNetFailedCoins.length > 0) {
        message += langStrings.ERRORS.ADD_COIN_FAILED_DUE_TO_SERVER_ERROR(
          latestAllNetFailedCoins.join(',').toUpperCase()
        );
        message += '\n';
      }
      if (latestAllInternalFailedCoins.length > 0) {
        message += langStrings.ERRORS.ADD_COIN_FAILED_INTERNAL_ERROR(
          latestAllInternalFailedCoins.join(',').toUpperCase()
        );
        message += '\n';
      }

      setDetailedMessage(message);

      if (latestAllFailedCoins.length > 0) {
        setErrorMessage(
          langStrings.ERRORS.ADD_COIN_FAILED(
            latestAllFailedCoins.join(', ').toUpperCase()
          )
        );
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
      setErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
      return;
    }

    addCoin.on('connectionOpen', () => {
      logger.info(`${flowName}: Connection Opened`);
    });

    addCoin.on('connectionClose', () => {
      logger.info(`${flowName}: Connection Closed`);
    });

    addCoin.on('cardError', () => {
      logger.error(`${flowName}: Card Error`);
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
    });

    addCoin.on('error', err => {
      logger.error(`${flowName}: Error occurred`);
      logger.error(err);
      if (err.isAxiosError) {
        if (err.response) {
          setErrorMessage(langStrings.ERRORS.NETWORK_ERROR);
        } else {
          setErrorMessage(langStrings.ERRORS.NETWORK_ERROR_WITH_NO_RESPONSE);
        }
      } else if (err instanceof DeviceError) {
        if (
          [
            DeviceErrorType.CONNECTION_CLOSED,
            DeviceErrorType.CONNECTION_NOT_OPEN
          ].includes(err.errorType)
        ) {
          setErrorMessage(langStrings.ERRORS.DEVICE_DISCONNECTED_IN_FLOW);
        } else if (err.errorType === DeviceErrorType.NOT_CONNECTED) {
          setErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
        } else if (err.errorType === DeviceErrorType.WRITE_TIMEOUT) {
          setErrorMessage(langStrings.ERRORS.DEVICE_WRITE_TIMEOUT);
        } else if (err.errorType === DeviceErrorType.READ_TIMEOUT) {
          setErrorMessage(langStrings.ERRORS.DEVICE_READ_TIMEOUT);
        } else {
          setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
        }
      } else {
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      }
    });

    addCoin.on('locked', () => {
      logger.info(`${flowName}: Wallet is locked`);
      setErrorMessage(langStrings.ERRORS.WALLET_LOCKED);
    });

    addCoin.on('coinsConfirmed', (confirmation: boolean) => {
      if (confirmation) {
        logger.verbose(`${flowName}: Coins confirmed`);
        setCoinsConfirmed(true);
      } else {
        logger.info(`${flowName}: Rejected from device`);
        setErrorMessage(langStrings.ERRORS.ADD_COIN_REJECTED);
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
        logger.info(`${flowName}: Pin incorrect`);
        setErrorMessage(langStrings.ERRORS.WALLET_LOCKED_DUE_TO_INCORRECT_PIN);
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
      try {
        if (!isXpubMissing) {
          await setUpCoinWallets(xpubList);
        } else {
          setAddCoinCompleted(true);
        }
      } catch (e) {
        logger.error(e);
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      }
    });

    addCoin.on('unknownError', () => {
      logger.error(`${flowName}: Unknown error`);
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      resetHooks();
    });

    addCoin.on('notReady', () => {
      logger.info(`${flowName}: Device not ready`);
      setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
      resetHooks();
    });

    addCoin.on('noWalletFound', (inPartialState: boolean) => {
      logger.info(`${flowName}: Wallet not found`, { inPartialState });
      if (inPartialState) {
        setErrorMessage(langStrings.ERRORS.WALLET_PARTIAL_STATE);
      } else {
        setErrorMessage(langStrings.ERRORS.WALLET_NOT_FOUND);
      }
      resetHooks();
    });

    addCoin.on('noWalletOnCard', () => {
      logger.info(`${flowName}: No Wallet on card`);
      setErrorMessage(langStrings.ERRORS.WALLET_NOT_ON_CARD);
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
      logger.error(`${flowName}: Some Error`);
      logger.error(e);
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
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

  /**
   * Only set the externalErrorMsg if the flow has not been canclled.
   *
   * 2 different vars, errorMessage and externalErrorMsg are being used
   * because we don't want to display the error after the flow has been
   * canclled.
   *
   * I could not achieve this by using a single var because the `isCancelled`
   * was not being updated inside the `handle<Flow>` function.
   */
  useEffect(() => {
    if (isCancelled) {
      setExternalErrorMsg('');
    } else {
      setExternalErrorMsg(errorMessage);
    }
  }, [errorMessage]);

  /**
   * This will be used externally to clear the error msg
   */
  const onSetErrorMsg = (msg: string) => {
    setErrorMessage(msg);
    setExternalErrorMsg(msg);
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
    errorMessage: externalErrorMsg,
    setErrorMessage: onSetErrorMsg,
    handleCoinAdd,
    resetHooks,
    cancelAddCoin,
    completed,
    detailedMessage,
    addCoinStatus
  } as UseAddCoinValues;
};
