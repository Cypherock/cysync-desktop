import {
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { WalletAdder, WalletStates } from '@cypherock/protocols';
import { useEffect, useState } from 'react';

import {
  CyError,
  CysyncError,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';
import {
  addressDb,
  coinDb,
  customAccountDb,
  receiveAddressDb,
  tokenDb,
  transactionDb,
  Wallet,
  walletDb
} from '../../database';
import { useConnection, useWallets } from '../../provider';

import * as flowHandlers from './handlers';

export interface HandleAddWalletOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
}

export interface UseAddWalletValues {
  handleAddWallet: (options: HandleAddWalletOptions) => Promise<void>;
  walletName: string;
  setWalletName: React.Dispatch<React.SetStateAction<string>>;
  deviceConnected: boolean;
  setDeviceConnected: React.Dispatch<React.SetStateAction<boolean>>;
  errorObj: CyError;
  clearErrorObj: () => void;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  resetHooks: () => void;
  cancelAddWallet: (connection: DeviceConnection) => Promise<void>;
  walletId: string;
  updateName: () => Promise<void>;
  isNameDiff: boolean;
  walletSuccess: boolean;
}

export type UseAddWallet = () => UseAddWalletValues;

const flowName = Analytics.Categories.ADD_WALLET;

export const useAddWallet: UseAddWallet = () => {
  const addWallet = new WalletAdder();
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [passphraseSet, setPassphraseSet] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const [isNameDiff, setIsNameDiff] = useState(false);
  const [walletId, setWalletId] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);

  const wallets = useWallets();
  const { deviceSerial } = useConnection();

  const resetHooks = () => {
    setDeviceConnected(false);
    setWalletName('');
    setWalletId('');
    setCompleted(false);
    addWallet.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    setWalletSuccess(false);
    setIsNameDiff(false);
    setPasswordSet(false);
    setPassphraseSet(false);
    clearErrorObj();
    resetHooks();
  };

  const handleAddWallet = async ({
    connection,
    sdkVersion,
    setIsInFlow
  }: HandleAddWalletOptions) => {
    clearAll();

    logger.info('AddWallet: Initiated');
    if (!connection) {
      setTimeout(() => {
        const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      }, 100);
      return;
    }

    addWallet.on('connectionOpen', () => {
      logger.info('AddWallet: Connection Opened');
    });

    addWallet.on('connectionClose', () => {
      logger.info('AddWallet: Connection Closed');
    });

    addWallet.on('error', err => {
      const cyError = new CyError();
      if (err instanceof DeviceError) {
        handleDeviceErrors(cyError, err, flowName);
      } else {
        cyError.setError(CysyncError.ADD_WALLET_UNKNOWN_ERROR);
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
    });

    addWallet.on('noWalletFound', (walletState: WalletStates) => {
      const cyError = flowHandlers.noWalletFound(walletState);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { walletState }));
    });

    addWallet.on('walletDetails', async (walletDetails: Wallet) => {
      try {
        if (walletDetails === null) {
          const cyError = new CyError(CysyncError.ADD_WALLET_REJECTED);
          setErrorObj(handleErrors(errorObj, cyError, flowName));
          return;
        }

        logger.verbose('AddWallet: Wallet confirmed');
        const { allWallets } = wallets;
        if (allWallets.length >= 4) {
          const cyError = new CyError(CysyncError.ADD_WALLET_LIMIT_EXCEEDED);
          setErrorObj(handleErrors(errorObj, cyError, flowName));
          return;
        }

        const walletWithSameId = await walletDb.getById(walletDetails._id);

        if (walletWithSameId) {
          const duplicateWallet = walletWithSameId;

          if (
            duplicateWallet.name === walletDetails.name &&
            duplicateWallet.passwordSet === walletDetails.passwordSet &&
            duplicateWallet.passphraseSet === duplicateWallet.passphraseSet
          ) {
            const cyError = new CyError(CysyncError.ADD_WALLET_DUPLICATE);
            setErrorObj(handleErrors(errorObj, cyError, flowName));
          } else {
            logger.info('AddWallet: Same wallet found with different name');
            setWalletName(walletDetails.name);
            setWalletId(walletDetails._id);
            setPasswordSet(walletDetails.passwordSet);
            setPassphraseSet(walletDetails.passphraseSet);
            setIsNameDiff(true);
            const cyError = new CyError(
              CysyncError.ADD_WALLET_DUPLICATE_WITH_DIFFERENT_DETAILS
            );
            setErrorObj(handleErrors(errorObj, cyError, flowName));
          }

          return;
        }
        walletDetails.device = deviceSerial;
        walletDb
          .insert(walletDetails)
          .then(() => {
            setWalletName(walletDetails.name);
            setWalletId(walletDetails._id);
            setPasswordSet(walletDetails.passwordSet);
            setPassphraseSet(walletDetails.passphraseSet);
            setCompleted(true);
            setWalletSuccess(true);
          })
          .catch((err: any) => {
            if (err.errorType === 'uniqueViolated') {
              const cyError = new CyError(
                CysyncError.ADD_WALLET_WITH_SAME_NAME
              );
              setErrorObj(handleErrors(errorObj, cyError, flowName));
            } else {
              logger.error(err);
            }
          });
      } catch (error) {
        const cyError = new CyError(CysyncError.ADD_WALLET_UNKNOWN_ERROR);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { error }));
      }
    });

    addWallet.on('notReady', () => {
      const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
    });

    try {
      setIsInFlow(true);
      /**
       * Error will be thrown in rare conditions where the implementation
       * itself has broken.
       */
      await addWallet.run({ connection, sdkVersion });
      setIsInFlow(false);
      logger.info('AddWallet: Completed');
      setCompleted(true);
    } catch (e) {
      setIsInFlow(false);
      logger.error('AddWallet: Some Error');
      logger.error(e);
      const cyError = new CyError(CysyncError.ADD_WALLET_UNKNOWN_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
      addWallet.removeAllListeners();
    }
  };

  const cancelAddWallet = async (connection: DeviceConnection) => {
    setIsCancelled(true);
    return addWallet
      .cancel(connection)
      .then(canclled => {
        if (canclled) {
          logger.info('AddWallet: Cancelled');
        }
      })
      .catch(e => {
        logger.error('AddWallet: Error in flow cancel');
        logger.error(e);
      });
  };

  const walletDelete = async () => {
    try {
      await addressDb.delete({ walletId });
      await receiveAddressDb.delete({
        walletId
      });
      await coinDb.delete({ walletId });
      await tokenDb.delete({ walletId });
      await transactionDb.delete({ walletId });
      await customAccountDb.delete({ walletId });
      await walletDb.deleteById(walletId);
    } catch (error) {
      logger.error(error);
    }
  };

  const updateName = async () => {
    try {
      logger.info('AddWallet: Updating name for same wallet');
      if (!(walletName && walletId)) {
        throw new Error('New Wallet details are missing');
      }

      const walletWithSameId = await walletDb.getById(walletId);

      if (!walletWithSameId) {
        throw new Error('Could not find wallet with same ID');
      }

      const duplicateWallet = { ...walletWithSameId };
      duplicateWallet.name = walletName;
      duplicateWallet.passphraseSet = passphraseSet;
      duplicateWallet.passwordSet = passwordSet;
      await walletDelete();
      await walletDb.update(duplicateWallet);
      setIsNameDiff(false);
      clearErrorObj();
      setWalletSuccess(true);
    } catch (error) {
      setIsNameDiff(false);
      const cyError = new CyError(CysyncError.ADD_WALLET_UNKNOWN_ERROR);
      setErrorObj(
        handleErrors(errorObj, cyError, flowName, {
          error,
          text: 'AddWallet: Error in updating wallet name'
        })
      );
    }
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
    handleAddWallet,
    walletName,
    setWalletName,
    deviceConnected,
    setDeviceConnected,
    errorObj,
    clearErrorObj,
    completed,
    setCompleted,
    resetHooks,
    cancelAddWallet,
    walletId,
    updateName,
    isNameDiff,
    walletSuccess
  } as UseAddWalletValues;
};
