import {
  ALLCOINS as COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { TransactionReceiver } from '@cypherock/protocols';
import { useEffect, useState } from 'react';

import logger from '../../../utils/logger';
import { sendAddressDb, receiveAddressDb2 } from '../../database';
import { useI18n, useSocket } from '../../provider';

export interface HandleReceiveTransactionOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  walletId: string;
  coinType: string;
  xpub: string;
  zpub?: string;
  contractAbbr?: string;
  passphraseExists?: boolean;
}

export interface UseReceiveTransactionValues {
  handleReceiveTransaction: (
    options: HandleReceiveTransactionOptions
  ) => Promise<void>;
  receiveAddress: string;
  pathSent: boolean;
  cardTapped: boolean;
  verified: boolean;
  passphraseEntered: boolean;
  xpubMissing: boolean;
  setXpubMissing: React.Dispatch<React.SetStateAction<boolean>>;
  onNewReceiveAddr: (addr: string, walletId: string, coinType: string) => void;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  resetHooks: () => void;
  cancelReceiveTxn: (connection: DeviceConnection) => void;
  coinsConfirmed: boolean;
}

export type UseReceiveTransaction = () => UseReceiveTransactionValues;

export const useReceiveTransaction: UseReceiveTransaction = () => {
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

  const { addReceiveAddressHook } = useSocket();
  let recAddr: string | undefined;
  const receiveTransaction = new TransactionReceiver();
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
    receiveTransaction.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    setExternalErrorMsg('');
    setErrorMessage('');
    resetHooks();
  };

  const onNewReceiveAddr = (
    addr: string,
    walletId: string,
    coinType: string
  ) => {
    logger.info('New receive address', { coinType, walletId, addr });
    addReceiveAddressHook(addr, walletId, coinType);
    receiveAddressDb2.insert({ address: addr, walletId, coinType });
  };

  const handleReceiveTransaction: UseReceiveTransactionValues['handleReceiveTransaction'] =
    async ({
      connection,
      sdkVersion,
      setIsInFlow,
      walletId,
      coinType,
      xpub,
      zpub,
      contractAbbr,
      passphraseExists
    }) => {
      const coin = COINS[coinType];
      if (!coin) {
        throw new Error(`Cannot find coinType: ${coinType}`);
      }

      clearAll();

      logger.info('ReceiveAddress: Initiated', { coinType });
      logger.info('ReceiveAddress Data', {
        walletId,
        coinType,
        contractAbbr
      });
      logger.debug('ReceiveAddress Xpub', {
        xpub,
        zpub
      });

      if (!connection) {
        logger.error('ReceiveAddress: Failed - Device not connected', {
          coinType
        });
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
        return;
      }

      receiveTransaction.on('connectionOpen', () => {
        logger.info('ReceiveAddress: Connection Opened');
      });

      receiveTransaction.on('connectionClose', () => {
        logger.info('ReceiveAddress: Connection Closed');
      });

      receiveTransaction.on('cardError', () => {
        logger.error('ReceiveAddress: Card Error', { coinType });
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      });

      receiveTransaction.on('error', err => {
        logger.error('ReceiveAddress: Error occurred', { coinType });
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

      receiveTransaction.on('locked', () => {
        logger.info('ReceiveAddress: Wallet locked', { coinType });
        setErrorMessage(langStrings.ERRORS.WALLET_LOCKED);
      });

      receiveTransaction.on('notReady', () => {
        logger.info('ReceiveAddress: Device not ready', { coinType });
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
      });

      receiveTransaction.on('noWalletFound', (inPartialState: boolean) => {
        logger.info('ReceiveAddress: Wallet not found', {
          coinType,
          inPartialState
        });
        if (inPartialState) {
          setErrorMessage(langStrings.ERRORS.WALLET_PARTIAL_STATE);
        } else {
          setErrorMessage(langStrings.ERRORS.WALLET_NOT_FOUND);
        }
      });

      receiveTransaction.on('noWalletOnCard', () => {
        logger.info('ReceiveAddress: No Wallet on card', { coinType });
        setErrorMessage(langStrings.ERRORS.WALLET_NOT_ON_CARD);
      });

      receiveTransaction.on('coinsConfirmed', coins => {
        if (coins) {
          logger.verbose('ReceiveAddress: Confirmed on device', { coinType });
          setCoinsConfirmed(true);
        } else {
          logger.info('ReceiveAddress: Rejected on device', { coinType });
          setErrorMessage(langStrings.ERRORS.RECEIVE_TXN_REJECTED(coin.name));
        }
      });

      receiveTransaction.on('noXpub', () => {
        logger.info('ReceiveAddress: Xpub missing on device', { coinType });
        setTimeout(() => {
          setXpubMissing(true);
          setErrorMessage(langStrings.ERRORS.RECEIVE_TXN_DEVICE_MISCONFIGURED);
        }, 3000);
      });

      receiveTransaction.on('derivationPathSent', () => {
        logger.verbose('ReceiveAddress: Derivation path sent', { coinType });
        setPathSent(true);
      });

      receiveTransaction.on('addressVerified', val => {
        if (val) {
          logger.verbose(
            'ReceiveAddress: Received address generated on device',
            {
              deviceAddress: val,
              coinType,
              desktopAddress: recAddr
            }
          );
          logger.verbose('ReceiveAddress: Address verified on device', {
            coinType
          });

          if (!recAddr || recAddr.toLowerCase() !== val.toLowerCase()) {
            setErrorMessage(langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS);
            logger.verbose(
              'ReceiveAddress: Address different on device',
              coinType
            );
            return;
          }

          setVerified(true);
          onNewReceiveAddr(recAddr, walletId, coinType);
        } else {
          logger.info('ReceiveAddress: Address not verified on device', {
            coinType
          });
          setErrorMessage(
            langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER
          );
        }
      });

      receiveTransaction.on('receiveAddress', address => {
        logger.info('ReceiveAddress: Address generated', { coinType, address });
        setReceiveAddress(address);
        recAddr = address;
      });

      receiveTransaction.on('passphraseEntered', () => {
        logger.info('ReceiveAddress: Passphrase entered', { coinType });
        setPassphraseEntered(true);
      });

      receiveTransaction.on('pinEntered', pin => {
        if (pin) {
          logger.verbose('ReceiveAddress: Pin entered', { coinType });
          setCardTapped(true);
        } else {
          logger.info('ReceiveAddress: Pin incorrect', { coinType });
          setErrorMessage(
            langStrings.ERRORS.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
          );
        }
      });

      try {
        setIsInFlow(true);
        /**
         * Error will be thrown in rare conditions where the implementation
         * itself has broken.
         */
        await receiveTransaction.run({
          connection,
          sdkVersion,
          sendAddressDB: sendAddressDb,
          walletId,
          coinType,
          xpub,
          zpub,
          contractAbbr,
          passphraseExists
        });

        setIsInFlow(false);
        logger.info('ReceiveAddress: Completed', { coinType });
        setCompleted(true);
      } catch (e) {
        setIsInFlow(false);
        logger.error('ReceiveAddress: Error', { coinType });
        logger.error(e);
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
        receiveTransaction.removeAllListeners();
      }
    };

  const cancelReceiveTxn = async (connection: DeviceConnection) => {
    setIsCancelled(true);
    return receiveTransaction
      .cancel(connection)
      .then(canclled => {
        if (canclled) {
          logger.info('ReceiveAddress: Cancelled');
        }
      })
      .catch(e => {
        logger.error('ReceiveAddress: Error in flow cancel');
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
    handleReceiveTransaction,
    errorMessage: externalErrorMsg,
    setErrorMessage: onSetErrorMsg,
    completed,
    setCompleted,
    coinsConfirmed,
    verified,
    receiveAddress,
    pathSent,
    cardTapped,
    resetHooks,
    cancelReceiveTxn,
    xpubMissing,
    setXpubMissing,
    passphraseEntered,
    onNewReceiveAddr
  } as UseReceiveTransactionValues;
};
