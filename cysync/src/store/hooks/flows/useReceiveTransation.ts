import {
  ALLCOINS as COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { TransactionReceiver } from '@cypherock/protocols';
import { useEffect, useState } from 'react';

import {
  CyError,
  CysyncError,
  handleAxiosErrors,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';
import { addressDb, receiveAddressDb } from '../../database';
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
  errorObj: CyError;
  clearErrorObj: () => void;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  resetHooks: () => void;
  cancelReceiveTxn: (connection: DeviceConnection) => void;
  coinsConfirmed: boolean;
}

export type UseReceiveTransaction = () => UseReceiveTransactionValues;

const flowName = Analytics.Categories.RECEIVE_ADDR;
export const useReceiveTransaction: UseReceiveTransaction = () => {
  const [coinsConfirmed, setCoinsConfirmed] = useState(false);
  const [xpubMissing, setXpubMissing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
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
    clearErrorObj();
    resetHooks();
  };

  const onNewReceiveAddr = (
    addr: string,
    walletId: string,
    coinType: string
  ) => {
    logger.info('New receive address', { coinType, walletId, addr });
    addReceiveAddressHook(addr, walletId, coinType);
    receiveAddressDb.insert({ address: addr, walletId, coinType });
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
        setErrorObj(
          handleErrors(
            errorObj,
            new CyError(
              DeviceErrorType.NOT_CONNECTED,
              langStrings.ERRORS.DEVICE_NOT_CONNECTED
            ),
            flowName,
            { coinType }
          )
        );
        return;
      }

      receiveTransaction.on('connectionOpen', () => {
        logger.info('ReceiveAddress: Connection Opened');
      });

      receiveTransaction.on('connectionClose', () => {
        logger.info('ReceiveAddress: Connection Closed');
      });

      receiveTransaction.on('cardError', () => {
        setErrorObj(
          handleErrors(
            errorObj,
            new CyError(
              CysyncError.UNKNOWN_CARD_ERROR,
              langStrings.ERRORS.UNKNOWN_CARD_ERROR
            ),
            flowName,
            { coinType }
          )
        );
      });

      receiveTransaction.on('error', err => {
        const cyError = new CyError();
        if (err.isAxiosError) {
          handleAxiosErrors(cyError, err, langStrings);
        } else if (err instanceof DeviceError) {
          handleDeviceErrors(cyError, err, langStrings, flowName);
        } else {
          cyError.setError(
            CysyncError.UNKNOWN_FLOW_ERROR,
            langStrings.ERRORS.UNKNOWN_FLOW_ERROR(flowName)
          );
        }
        setErrorObj(handleErrors(errorObj, cyError, flowName, err));
      });

      receiveTransaction.on('locked', () => {
        const cyError = new CyError(
          CysyncError.WALLET_IS_LOCKED,
          langStrings.ERRORS.WALLET_IS_LOCKED
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      });

      receiveTransaction.on('notReady', () => {
        const cyError = new CyError(
          CysyncError.DEVICE_NOT_READY,
          langStrings.ERRORS.DEVICE_NOT_READY
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      });

      receiveTransaction.on('noWalletFound', (inPartialState: boolean) => {
        const cyError = new CyError();
        if (inPartialState) {
          cyError.setError(
            CysyncError.WALLET_PARTIAL_STATE,
            langStrings.ERRORS.WALLET_PARTIAL_STATE
          );
        } else {
          cyError.setError(
            CysyncError.WALLET_NOT_FOUND_IN_DEVICE,
            langStrings.ERRORS.WALLET_NOT_FOUND_IN_DEVICE
          );
        }
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            coinType,
            inPartialState
          })
        );
      });

      receiveTransaction.on('noWalletOnCard', () => {
        const cyError = new CyError(
          CysyncError.WALLET_NOT_FOUND_IN_CARD,
          langStrings.ERRORS.WALLET_NOT_FOUND_IN_CARD
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      });

      receiveTransaction.on('coinsConfirmed', coins => {
        if (coins) {
          logger.verbose('ReceiveAddress: Confirmed on device', { coinType });
          setCoinsConfirmed(true);
        } else {
          const cyError = new CyError(
            CysyncError.ADD_COIN_REJECTED,
            langStrings.ERRORS.SEND_TXN_REJECTED(coin.name)
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
        }
      });

      receiveTransaction.on('noXpub', () => {
        setTimeout(() => {
          setXpubMissing(true);
          const cyError = new CyError(
            CysyncError.RECEIVE_TXN_DEVICE_MISCONFIGURED,
            langStrings.ERRORS.RECEIVE_TXN_DEVICE_MISCONFIGURED
          );
          cyError.pushSubErrors(
            CysyncError.RECEIVE_TXN_XPUB_MISSING,
            'Xpub missing on device'
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
        }, 3000);
      });

      receiveTransaction.on('derivationPathSent', () => {
        logger.verbose('ReceiveAddress: Derivation path sent', { coinType });
        setPathSent(true);
      });

      receiveTransaction.on('addressVerified', val => {
        const cyError = new CyError();
        if (val) {
          logger.verbose(
            'ReceiveAddress: Received address generated on device',
            {
              deviceAddress: val,
              coinType,
              desktopAddress: recAddr
            }
          );

          if (!recAddr || recAddr.toLowerCase() !== val.toLowerCase()) {
            cyError.setError(
              CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE,
              langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE
            );
            cyError.pushSubErrors(
              CysyncError.KNOWN_FLOW_ERROR,
              `This could happen 
              either when user has wrongly verified yes to the address shown on the
              display or the device sent an incorrect address from the one shown on the device`
            );
          } else {
            setVerified(true);
            onNewReceiveAddr(recAddr, walletId, coinType);
          }
        } else {
          cyError.setError(
            CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER,
            langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER
          );
        }
        if (cyError.isSet)
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
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
          const cyError = new CyError(
            CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN,
            langStrings.ERRORS.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName));
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
          addressDB: addressDb,
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
        const cyError = new CyError(
          CysyncError.UNKNOWN_FLOW_ERROR,
          langStrings.ERRORS.UNKNOWN_FLOW_ERROR(flowName)
        );
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, { error: e, coinType })
        );
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
        logger.error(
          `${CysyncError.RECEIVE_TXN_CANCEL_FAILED}  ReceiveAddress: Error in flow cancel`
        );
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

  useEffect(() => {
    if (errorObj.isSet && xpubMissing) {
      Analytics.Instance.event(
        flowName,
        Analytics.Actions.ERROR,
        'Xpub Missing'
      );
    }
  }, [errorObj.isSet]);

  return {
    handleReceiveTransaction,
    errorObj,
    clearErrorObj,
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
