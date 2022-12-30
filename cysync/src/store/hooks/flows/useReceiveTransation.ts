import {
  CoinGroup,
  COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { TransactionReceiver, WalletStates } from '@cypherock/protocols';
import wallet from '@cypherock/wallet';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';

import {
  CyError,
  CysyncError,
  handleAxiosErrors,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import { DeferredReference } from '../../../utils/deferredReference';
import logger from '../../../utils/logger';
import { addressDb, receiveAddressDb } from '../../database';
import {
  useCurrentCoin,
  useCustomAccountContext,
  useSelectedWallet,
  useSocket
} from '../../provider';

import * as flowHandlers from './handlers';

export interface HandleReceiveTransactionOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  walletId: string;
  accountId: string;
  accountIndex: number;
  accountType: string;
  coinId: string;
  coinName: string;
  xpub: string;
  zpub?: string;
  contractAbbr?: string;
  passphraseExists?: boolean;
  customAccount?: string;
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
  onNewReceiveAddr: (
    addr: string,
    walletId: string,
    accountId: string,
    coinId: string
  ) => void;
  errorObj: CyError;
  clearErrorObj: () => void;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  resetHooks: () => void;
  cancelReceiveTxn: (connection: DeviceConnection) => void;
  coinsConfirmed: boolean;
  accountExists: boolean;
  replaceAccount: boolean;
  userAction: React.MutableRefObject<DeferredReference<void>>;
  replaceAccountAction: React.MutableRefObject<DeferredReference<void>>;
  verifiedAccountId: boolean;
  verifiedReplaceAccount: boolean;
  replaceAccountSelected: boolean;
  replaceAccountStarted: boolean;
  setReplaceAccountStarted: React.Dispatch<React.SetStateAction<boolean>>;
  imageData: string;
  QRError: boolean;
  getUnverifiedReceiveAddress: () => void;
}

export type UseReceiveTransaction = () => UseReceiveTransactionValues;

const flowName = Analytics.Categories.RECEIVE_ADDR;
export const useReceiveTransaction: UseReceiveTransaction = () => {
  const [coinsConfirmed, setCoinsConfirmed] = useState(false);
  const [xpubMissing, setXpubMissing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [receiveAddress, setReceiveAddress] = useState('');
  const [pathSent, setPathSent] = useState(false);
  const [cardTapped, setCardTapped] = useState(false);
  const [passphraseEntered, setPassphraseEntered] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [replaceAccount, setReplaceAccount] = useState(false);
  const [verifiedAccountId, setVerifiedAccountId] = useState(false);
  const [verifiedReplaceAccount, setVerifiedReplaceAccount] = useState(false);
  const [replaceAccountSelected, setReplaceAccountSelected] = useState(false);
  const [replaceAccountStarted, setReplaceAccountStarted] = useState(false);

  const [imageData, setImageData] = useState('');

  const { selectedWallet } = useSelectedWallet();
  const { coinDetails } = useCurrentCoin();
  const { customAccount: customAccountfromContext } = useCustomAccountContext();
  const [QRError, setQRError] = useState(false);
  const { addReceiveAddressHook } = useSocket();
  let recAddr: string | undefined;
  const receiveTransaction = new TransactionReceiver();

  const userAction = useRef<DeferredReference<void>>(
    new DeferredReference<void>()
  );
  const replaceAccountAction = useRef<DeferredReference<void>>(
    new DeferredReference<void>()
  );
  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const resetHooks = () => {
    setCoinsConfirmed(false);
    setVerified(false);
    setCompleted(false);
    setReceiveAddress('');
    setPathSent(false);
    setCardTapped(false);
    setPassphraseEntered(false);
    setXpubMissing(false);
    setAccountExists(false);
    setReplaceAccount(false);
    setVerifiedAccountId(false);
    setVerifiedReplaceAccount(false);
    setReplaceAccountStarted(false);
    userAction.current = new DeferredReference<void>();
    replaceAccountAction.current = new DeferredReference<void>();
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
    accountId: string,
    coinId: string
  ) => {
    logger.info('New receive address', { walletId, addr });
    addReceiveAddressHook(addr, accountId, coinId);
    receiveAddressDb.insert({ address: addr, walletId, coinId, accountId });
  };

  const handleReceiveTransaction: UseReceiveTransactionValues['handleReceiveTransaction'] =
    async ({
      connection,
      sdkVersion,
      setIsInFlow,
      walletId,
      accountId,
      accountIndex,
      accountType,
      coinId,
      xpub,
      zpub,
      contractAbbr,
      passphraseExists,
      coinName,
      customAccount
    }) => {
      clearAll();

      logger.info('ReceiveAddress: Initiated', { coinId });
      logger.info('ReceiveAddress Data', {
        walletId,
        coinId,
        contractAbbr
      });
      logger.debug('ReceiveAddress Xpub', {
        xpub,
        zpub
      });

      if (!connection) {
        const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
        return;
      }

      receiveTransaction.on('connectionOpen', () => {
        logger.info('ReceiveAddress: Connection Opened');
      });

      receiveTransaction.on('connectionClose', () => {
        logger.info('ReceiveAddress: Connection Closed');
      });

      receiveTransaction.on('cardError', () => {
        const cyError = new CyError(CysyncError.UNKNOWN_CARD_ERROR);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      });

      receiveTransaction.on('error', err => {
        const cyError = new CyError();
        if (err.isAxiosError) {
          handleAxiosErrors(cyError, err);
        } else if (err instanceof DeviceError) {
          handleDeviceErrors(cyError, err, flowName);
        } else {
          cyError.setError(CysyncError.RECEIVE_TXN_UNKNOWN_ERROR);
        }
        setErrorObj(handleErrors(errorObj, cyError, flowName, err));
      });

      receiveTransaction.on('locked', () => {
        const cyError = new CyError(CysyncError.WALLET_IS_LOCKED);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      });

      receiveTransaction.on('notReady', () => {
        const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      });

      receiveTransaction.on('noWalletFound', (walletState: WalletStates) => {
        const cyError = flowHandlers.noWalletFound(walletState);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            coinId,
            walletState
          })
        );
      });

      receiveTransaction.on('noWalletOnCard', () => {
        const cyError = new CyError(CysyncError.WALLET_NOT_FOUND_IN_CARD);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      });

      receiveTransaction.on('coinsConfirmed', coins => {
        if (coins) {
          logger.verbose('ReceiveAddress: Confirmed on device', { coinId });
          setCoinsConfirmed(true);
        } else {
          const cyError = new CyError(
            CysyncError.RECEIVE_TXN_REJECTED,
            coinName
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
        }
      });

      receiveTransaction.on('customAccountExists', exists => {
        if (exists) {
          logger.verbose('ReceiveAddress: Custom Account exits on device', {
            coinId
          });
          setAccountExists(true);
        }
      });

      receiveTransaction.on('replaceAccountRequired', value => {
        if (value) {
          logger.verbose(
            'ReceiveAddress: Device needs to replace an account to add a new one',
            {
              coinId
            }
          );
          setReplaceAccount(true);
        }
      });

      receiveTransaction.on('accountVerified', value => {
        if (value) {
          logger.verbose('ReceiveAddress: Account confirmed on device', {
            coinId
          });
          setVerifiedAccountId(true);
        } else {
          const cyError = new CyError(
            CysyncError.RECEIVE_TXN_REJECTED,
            coinName
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
        }
      });

      receiveTransaction.on('replaceAccountSelected', value => {
        if (value) {
          logger.verbose('ReceiveAddress: Replace account selected on device', {
            coinId
          });
          setReplaceAccountSelected(true);
        } else {
          setReplaceAccountSelected(false);
        }
      });
      receiveTransaction.on('replaceAccountVerified', value => {
        if (value) {
          logger.verbose(
            'ReceiveAddress: Replace account confirmed on device',
            { coinId }
          );
          setVerifiedReplaceAccount(true);
        } else {
          const cyError = new CyError(
            CysyncError.RECEIVE_TXN_REJECTED,
            coinName
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
        }
      });

      receiveTransaction.on('noXpub', () => {
        setTimeout(() => {
          setXpubMissing(true);
          const cyError = new CyError(
            CysyncError.RECEIVE_TXN_DEVICE_MISCONFIGURED
          );
          cyError.pushSubErrors(
            CysyncError.RECEIVE_TXN_XPUB_MISSING,
            'Xpub missing on device'
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
        }, 3000);
      });

      receiveTransaction.on('derivationPathSent', () => {
        logger.verbose('ReceiveAddress: Derivation path sent', { coinId });
        setPathSent(true);
      });

      receiveTransaction.on('addressVerified', val => {
        const cyError = new CyError();
        if (val) {
          logger.verbose(
            'ReceiveAddress: Received address generated on device',
            {
              deviceAddress: val,
              coinId,
              desktopAddress: recAddr
            }
          );

          if (
            !customAccount &&
            (!recAddr || recAddr.toLowerCase() !== val.toLowerCase())
          ) {
            cyError.setError(
              CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE
            );
            cyError.pushSubErrors(
              CysyncError.RECEIVE_TXN_UNKNOWN_ERROR,
              `This could happen 
              either when user has wrongly verified yes to the address shown on the
              display or the device sent an incorrect address from the one shown on the device`
            );
          } else {
            setVerified(true);
            onNewReceiveAddr(recAddr, walletId, accountId, coinId);
          }
          if (customAccount) {
            logger.verbose(
              'ReceiveAddress: Address comparison skipped, found customAccount',
              coinId
            );
          }

          setVerified(true);
          onNewReceiveAddr(recAddr, walletId, accountId, coinId);
        } else {
          cyError.setError(CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER);
        }
        if (cyError.isSet)
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      });

      receiveTransaction.on('receiveAddress', address => {
        logger.info('ReceiveAddress: Address generated', { coinId, address });
        setReceiveAddress(address);
        recAddr = address;
      });

      receiveTransaction.on('passphraseEntered', () => {
        logger.info('ReceiveAddress: Passphrase entered', { coinId });
        setPassphraseEntered(true);
      });

      receiveTransaction.on('pinEntered', pin => {
        if (pin) {
          logger.verbose('ReceiveAddress: Pin entered', { coinId });
          setCardTapped(true);
        } else {
          const cyError = new CyError(
            CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName));
        }
      });

      receiveTransaction.on('cardTapped', () => {
        logger.verbose('ReceiveAddress: Card Tapped', { coinId });
        setCardTapped(true);
      });

      try {
        setIsInFlow(true);
        /**
         * Error will be thrown in rare conditions where the implementation
         * itself has broken.
         */
        await receiveTransaction.run({
          connection,
          coinId,
          sdkVersion,
          addressDB: addressDb,
          walletId,
          xpub,
          accountId,
          accountIndex,
          accountType,
          contractAbbr: contractAbbr || COINS[coinId]?.abbr,
          passphraseExists,
          customAccount,
          userAction: userAction.current,
          replaceAccountAction: replaceAccountAction.current
        });

        setIsInFlow(false);
        logger.info('ReceiveAddress: Completed', { coinId });
        setCompleted(true);
      } catch (e) {
        setIsInFlow(false);
        const cyError = new CyError(CysyncError.RECEIVE_TXN_UNKNOWN_ERROR);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, { error: e, coinId })
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

  const getReceiveAddress = async () => {
    try {
      const coinId = coinDetails.coinId;
      const xpub = coinDetails.xpub;
      const walletId = coinDetails.walletId;

      let address = '';
      let w;

      if (receiveAddress) {
        return;
      }

      const coin = COINS[coinDetails.coinId];

      if (!coin) {
        throw new Error(`Invalid coinId ${coinId}`);
      }

      if (coin.group === CoinGroup.Ethereum) {
        w = wallet({
          coinId,
          xpub,
          walletId,
          addressDB: addressDb,
          accountId: coinDetails.accountId,
          accountIndex: coinDetails.accountIndex,
          accountType: coinDetails.accountType
        });
        address = (await w.newReceiveAddress()).toLowerCase();
      } else if (coin.group === CoinGroup.Near && customAccountfromContext) {
        address = customAccountfromContext.name;
      } else {
        w = wallet({
          coinId,
          xpub,
          walletId,
          addressDB: addressDb,
          accountId: coinDetails.accountId,
          accountIndex: coinDetails.accountIndex,
          accountType: coinDetails.accountType
        });
        address = await w.newReceiveAddress();
      }

      setReceiveAddress(address);
      onNewReceiveAddr(
        address,
        selectedWallet._id,
        coinDetails.accountId,
        coinDetails.coinId
      );
    } catch (err) {
      const cyError = new CyError(
        CysyncError.RECEIVE_TXN_GENERATE_UNVERIFIED_FAILED
      );
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
      Analytics.Instance.event(
        Analytics.Categories.RECEIVE_ADDR,
        Analytics.Actions.ERROR
      );
    }
  };

  useEffect(() => {
    if (receiveAddress) {
      Analytics.Instance.event(
        Analytics.Categories.RECEIVE_ADDR,
        Analytics.Actions.COMPLETED
      );
      QRCode.toDataURL(receiveAddress, {
        errorCorrectionLevel: 'H',
        margin: 0.5,
        color: {
          dark: '#131619'
        }
      })
        .then(url => {
          setImageData(url);
          return null;
        })
        .catch(err => {
          logger.error('Error in building QR Code');
          logger.error(err);
          setQRError(true);
        });
    }
  }, [receiveAddress]);

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
    onNewReceiveAddr,
    accountExists,
    replaceAccount,
    userAction,
    replaceAccountAction,
    verifiedReplaceAccount,
    verifiedAccountId,
    replaceAccountSelected,
    replaceAccountStarted,
    setReplaceAccountStarted,
    imageData,
    QRError,
    getUnverifiedReceiveAddress: getReceiveAddress
  };
};
