import {
  DeviceError,
  DeviceErrorType,
  PacketVersion
} from '@cypherock/communication';
import { HardwareWallet } from '@cypherock/database';
import { WalletAdder } from '@cypherock/protocols';
import { useEffect, useState } from 'react';
import SerialPort from 'serialport';

import logger from '../../../utils/logger';
import { walletDb } from '../../database';
import { useI18n, useWallets } from '../../provider';

export interface HandleAddWalletOptions {
  connection: SerialPort;
  packetVersion: PacketVersion;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
}

export interface UseAddWalletValues {
  handleAddWallet: (options: HandleAddWalletOptions) => Promise<void>;
  walletName: string;
  setWalletName: React.Dispatch<React.SetStateAction<string>>;
  deviceConnected: boolean;
  setDeviceConnected: React.Dispatch<React.SetStateAction<boolean>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  resetHooks: () => void;
  cancelAddWallet: (
    connection: SerialPort,
    packetVersion: PacketVersion
  ) => Promise<void>;
  walletId: string;
  updateName: () => Promise<void>;
  isNameDiff: boolean;
  walletSuccess: boolean;
}

export type UseAddWallet = () => UseAddWalletValues;

export const useAddWallet: UseAddWallet = () => {
  const addWallet = new WalletAdder();
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [passphraseSet, setPassphraseSet] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [externalErrorMsg, setExternalErrorMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isNameDiff, setIsNameDiff] = useState(false);
  const [walletId, setWalletId] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);

  const wallets = useWallets();
  const { langStrings } = useI18n();

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
    setErrorMessage('');
    setExternalErrorMsg('');
    resetHooks();
  };

  const handleAddWallet = async ({
    connection,
    packetVersion,
    sdkVersion,
    setIsInFlow
  }: HandleAddWalletOptions) => {
    clearAll();

    logger.info('AddWallet: Initiated');
    if (!connection) {
      logger.error('AddWallet: Failed - Device not connected');
      setTimeout(() => {
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
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
      logger.error('AddWallet: Error occurred');
      logger.error(err);
      if (err instanceof DeviceError) {
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

    addWallet.on('noWalletFound', (inPartialState: boolean) => {
      logger.info('AddWallet: No Wallet found', { inPartialState });
      if (inPartialState) {
        setErrorMessage(langStrings.ERRORS.ALL_WALLET_PARTIAL_STATE);
      } else {
        setErrorMessage(langStrings.ERRORS.NO_WALLET_ON_DEVICE);
      }
    });

    addWallet.on('walletDetails', async (walletDetails: HardwareWallet) => {
      try {
        if (walletDetails === null) {
          logger.info('AddWallet: Rejected from device');
          setErrorMessage(langStrings.ERRORS.ADD_WALLET_REJECTED);
          return;
        }

        logger.verbose('AddWallet: Wallet confirmed');
        const { allWallets } = wallets;
        if (allWallets.length >= 4) {
          logger.info('AddWallet: Cannot add more than 4 wallets');
          setErrorMessage(langStrings.ERRORS.ADD_WALLET_LIMIT_EXCEEDED);
          return;
        }

        const walletWithSameId = await walletDb.getAll({
          walletId: walletDetails.walletId
        });

        if (walletWithSameId && walletWithSameId.length > 0) {
          const duplicateWallet = walletWithSameId[0];

          if (duplicateWallet.name === walletDetails.name) {
            logger.info('AddWallet: Duplicate wallet found');
            setErrorMessage(langStrings.ERRORS.ADD_WALLET_DUPLICATE);
          } else {
            logger.info('AddWallet: Same wallet found with different name');
            setWalletName(walletDetails.name);
            setWalletId(walletDetails.walletId);
            setPasswordSet(walletDetails.passwordSet);
            setPassphraseSet(walletDetails.passphraseSet);
            setIsNameDiff(true);
            setErrorMessage(
              langStrings.ERRORS.ADD_WALLET_DUPLICATE_WITH_DIFFERENT_NAME
            );
          }

          return;
        }

        walletDb
          .insert(walletDetails)
          .then(() => {
            setWalletName(walletDetails.name);
            setWalletId(walletDetails.walletId);
            setPasswordSet(walletDetails.passwordSet);
            setPassphraseSet(walletDetails.passphraseSet);
            setCompleted(true);
            setWalletSuccess(true);
          })
          .catch((err: any) => {
            if (err.errorType === 'uniqueViolated') {
              setErrorMessage(langStrings.ERRORS.ADD_WALLET_WITH_SAME_NAME);
              logger.error('Wallet already exists');
            } else {
              logger.error(err);
            }
          });
      } catch (error) {
        logger.error('AddWallet: Same error occurred in adding wallet');
        logger.error(error);
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      }
    });

    addWallet.on('notReady', () => {
      logger.info('AddWallet: Device not ready');
      setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
    });

    try {
      setIsInFlow(true);
      /**
       * Error will be thrown in rare conditions where the implementation
       * itself has broken.
       */
      await addWallet.run({ connection, packetVersion, sdkVersion });
      setIsInFlow(false);
      logger.info('AddWallet: Completed');
      setCompleted(true);
    } catch (e) {
      setIsInFlow(false);
      logger.error('AddWallet: Some Error');
      logger.error(e);
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      addWallet.removeAllListeners();
    }
  };

  const cancelAddWallet = async (
    connection: SerialPort,
    packetVersion: PacketVersion
  ) => {
    setIsCancelled(true);
    return addWallet
      .cancel(connection, packetVersion)
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

  const updateName = async () => {
    try {
      logger.info('AddWallet: Updating name for same wallet');
      if (!(walletName && walletId)) {
        throw new Error('New Wallet details are missing');
      }

      const walletWithSameId = await walletDb.getAll({
        walletId
      });

      if (!(walletWithSameId && walletWithSameId.length > 0)) {
        throw new Error('Could not find wallet with same ID');
      }

      const duplicateWallet = { ...walletWithSameId[0] };
      duplicateWallet.name = walletName;
      duplicateWallet.passphraseSet = passphraseSet;
      duplicateWallet.passwordSet = passwordSet;
      await walletDb.update(duplicateWallet);
      setIsNameDiff(false);
      setErrorMessage('');
      setWalletSuccess(true);
    } catch (error) {
      logger.error('AddWallet: Error in updating wallet name');
      logger.error(error);
      setIsNameDiff(false);
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
    }
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
    handleAddWallet,
    walletName,
    setWalletName,
    deviceConnected,
    setDeviceConnected,
    errorMessage: externalErrorMsg,
    setErrorMessage: onSetErrorMsg,
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
