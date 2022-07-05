import {
  ALLCOINS as COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { CoinSpecificData } from '@cypherock/protocols';
import { useEffect, useState } from 'react';

import logger from '../../../utils/logger';
import { useI18n } from '../../provider';

export interface HandleCoinSpecificDataOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  walletId: string;
  coinType: string;
  xpub: string;
  zpub?: string;
  contractAbbr?: string;
  passphraseExists?: boolean;
  addData: string;
  removeData?: string;
}

export interface UseCoinSpecificDataValues {
  handleCoinSpecificData: (
    options: HandleCoinSpecificDataOptions
  ) => Promise<void>;
  receiveAddress: string;
  pathSent: boolean;
  cardTapped: boolean;
  verified: boolean;
  passphraseEntered: boolean;
  xpubMissing: boolean;
  setXpubMissing: React.Dispatch<React.SetStateAction<boolean>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  resetHooks: () => void;
  cancelReceiveTxn: (connection: DeviceConnection) => void;
  coinsConfirmed: boolean;
}

export type UseCoinSpecificData = () => UseCoinSpecificDataValues;

export const useCoinSpecificData: UseCoinSpecificData = () => {
  const [coinsConfirmed, setCoinsConfirmed] = useState(false);
  const [xpubMissing, setXpubMissing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [externalErrorMsg, setExternalErrorMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [receiveAddress, setReceiveAddress] = useState('');
  const [pathSent, setPathSent] = useState(false);
  const [cardTapped, setCardTapped] = useState(false);
  const [passphraseEntered, setPassphraseEntered] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const coinSpecificData = new CoinSpecificData();
  const { langStrings } = useI18n();

  const resetHooks = () => {
    setCoinsConfirmed(false);
    setVerified(false);
    setCompleted(false);
    setReceiveAddress('');
    setPathSent(false);
    setCardTapped(false);
    setPassphraseEntered(false);
    setXpubMissing(false);
    coinSpecificData.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    setExternalErrorMsg('');
    setErrorMessage('');
    resetHooks();
  };

  const handleCoinSpecificData: UseCoinSpecificDataValues['handleCoinSpecificData'] =
    async ({
      connection,
      sdkVersion,
      setIsInFlow,
      walletId,
      coinType,
      xpub,
      zpub,
      contractAbbr,
      addData,
      removeData
    }) => {
      const coin = COINS[coinType];
      if (!coin) {
        throw new Error(`Cannot find coinType: ${coinType}`);
      }

      clearAll();

      logger.info('coinSpecificData: Initiated', { coinType });
      logger.info('coinSpecificData Data', {
        walletId,
        coinType,
        contractAbbr
      });
      logger.debug('coinSpecificData Xpub', {
        xpub,
        zpub
      });

      if (!connection) {
        logger.error('coinSpecificData: Failed - Device not connected', {
          coinType
        });
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
        return;
      }

      coinSpecificData.on('connectionOpen', () => {
        logger.info('coinSpecificData: Connection Opened');
      });

      coinSpecificData.on('connectionClose', () => {
        logger.info('coinSpecificData: Connection Closed');
      });

      coinSpecificData.on('error', err => {
        logger.error('coinSpecificData: Error occurred', { coinType });
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
          } else if (
            [
              DeviceErrorType.WRITE_TIMEOUT,
              DeviceErrorType.READ_TIMEOUT
            ].includes(err.errorType)
          ) {
            setErrorMessage(langStrings.ERRORS.DEVICE_TIMEOUT_ERROR);
          } else {
            setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
          }
        } else {
          setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
        }
      });

      coinSpecificData.on('locked', () => {
        logger.info('coinSpecificData: Wallet locked', { coinType });
        setErrorMessage(langStrings.ERRORS.WALLET_LOCKED);
      });

      coinSpecificData.on('notReady', () => {
        logger.info('coinSpecificData: Device not ready', { coinType });
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
      });

      coinSpecificData.on('noWalletFound', (inPartialState: boolean) => {
        logger.info('coinSpecificData: Wallet not found', {
          coinType,
          inPartialState
        });
        if (inPartialState) {
          setErrorMessage(langStrings.ERRORS.WALLET_PARTIAL_STATE);
        } else {
          setErrorMessage(langStrings.ERRORS.WALLET_NOT_FOUND);
        }
      });

      coinSpecificData.on('coinsConfirmed', coins => {
        if (coins) {
          logger.verbose('coinSpecificData: Confirmed on device', { coinType });
          setCoinsConfirmed(true);
        } else {
          logger.info('coinSpecificData: Rejected on device', { coinType });
          setErrorMessage(langStrings.ERRORS.RECEIVE_TXN_REJECTED(coin.name));
        }
      });

      coinSpecificData.on('derivationPathSent', () => {
        logger.verbose('coinSpecificData: Derivation path sent', { coinType });
        setPathSent(true);
      });

      coinSpecificData.on('dataSaved', val => {
        if (val) {
          logger.verbose('coinSpecificData: Data verified on device', {
            coinType
          });

          setVerified(true);
        } else {
          logger.info('coinSpecificData: Data not verified on device', {
            coinType
          });
          setErrorMessage(
            langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER
          );
        }
      });

      coinSpecificData.on('coinSpecificData', address => {
        logger.info('coinSpecificData: Address generated', {
          coinType,
          address
        });
        setReceiveAddress(address);
      });

      try {
        setIsInFlow(true);
        /**
         * Error will be thrown in rare conditions where the implementation
         * itself has broken.
         */
        await coinSpecificData.run({
          connection,
          sdkVersion,
          walletId,
          coinType,
          xpub,
          zpub,
          contractAbbr,
          addData,
          removeData
        });

        setIsInFlow(false);
        logger.info('coinSpecificData: Completed', { coinType });
        setCompleted(true);
      } catch (e) {
        setIsInFlow(false);
        logger.error('coinSpecificData: Error', { coinType });
        logger.error(e);
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
        coinSpecificData.removeAllListeners();
      }
    };

  const cancelReceiveTxn = async (connection: DeviceConnection) => {
    setIsCancelled(true);
    return coinSpecificData
      .cancel(connection)
      .then(canclled => {
        if (canclled) {
          logger.info('coinSpecificData: Cancelled');
        }
      })
      .catch(e => {
        logger.error('coinSpecificData: Error in flow cancel');
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
    handleCoinSpecificData,
    receiveAddress,
    pathSent,
    errorMessage: externalErrorMsg,
    setErrorMessage: onSetErrorMsg,
    completed,
    setCompleted,
    coinsConfirmed,
    verified,
    cardTapped,
    resetHooks,
    cancelReceiveTxn,
    xpubMissing,
    setXpubMissing,
    passphraseEntered
  } as UseCoinSpecificDataValues;
};
