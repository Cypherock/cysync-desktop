import {
  COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import {
  SWAP_TRANSACTION_EVENTS,
  TransactionSwapper,
  WalletStates
} from '@cypherock/protocols';
import { WalletErrorType } from '@cypherock/wallet';
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
import { addressDb, receiveAddressDb, transactionDb } from '../../database';
import { useSocket } from '../../provider';

import * as flowHandlers from './handlers';
import { TxInputOutput } from './useSendTransaction';

export interface HandleSwapTransactionOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  sendAmount: string;
  receiveAmount: string;
  changellyFee: string;
  sendFlow: {
    walletId: string;
    pinExists: boolean;
    passphraseExists: boolean;
    accountId: string;
    accountIndex: number;
    accountType: string;
    coinId: string;
    xpub: string;
    customAccount: string | undefined;
    newAccountId: string | undefined;
    outputList: any[];
    fees: number;
    isSendAll: boolean | undefined;
    data?: {
      gasLimit: number;
      contractAddress?: string;
      contractAbbr?: string;
      subCoinId?: string;
    };
  };
  receiveFlow: {
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
  };
}

export interface UseSwapTransactionValues {
  handleSwapTransaction: (
    options: HandleSwapTransactionOptions
  ) => Promise<void>;
  cancelSwapTransaction: (connection: DeviceConnection) => void;
  receiveFlow: {
    receiveAddress: string;
    transactionMetadataSent: boolean;
    receiveFlowPinEntered: boolean;
    receiveFlowCardTapped: boolean;
    receiveAddressVerified: boolean;
    receiveFlowPassphraseEntered: boolean;
  };
  sendFlow: {
    sendCoinsConfirmed: boolean;
    totalFees: string;
    txnInputs: TxInputOutput[];
    txnOutputs: TxInputOutput[];
    sendFlowVerified: boolean;
    sendFlowPassphraseEntered: boolean;
    sendFlowPinEntered: boolean;
    sendFlowCardsTapped: boolean;
    signedTxn: string;
    completed: boolean;
  };
  changellyAddress: string;
  changellyTxnId: string;
}

export type UseSwapTransaction = () => UseSwapTransactionValues;

const flowName = Analytics.Categories.RECEIVE_ADDR;
export const useSwapTransaction: UseSwapTransaction = () => {
  const [receiveCoinsConfirmed, setReceiveCoinsConfirmed] = useState(false);
  const [receiveAccountExists, setReceiveAccountExists] = useState(false);
  const [transactionMetadataSent, setTransactionMetadataSent] = useState(false);
  const [receiveAddressVerified, setReceiveAddressVerified] = useState(false);
  const [receiveAddress, setReceiveAddress] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);
  const [receiveFlowPassphraseEntered, setReceiveFlowPassphraseEntered] =
    useState(false);
  const [receiveFlowCardTapped, setReceiveFlowCardTapped] = useState(false);
  const [receiveFlowPinEntered, setReceiveFlowPinEntered] = useState(false);

  const [changellyAddress, setChangellyAddress] = useState('');
  const [changellyTxnId, setChangellyTxnId] = useState('');

  const [sendCoinsConfirmed, setSendCoinsConfirmed] = useState(false);
  const [totalFees, setTotalFees] = useState('0');
  const [txnInputs, setTxnInputs] = useState<TxInputOutput[]>([]);
  const [txnOutputs, setTxnOutputs] = useState<TxInputOutput[]>([]);
  const [sendFlowVerified, setSendFlowVerified] = useState(false);
  const [sendFlowPassphraseEntered, setSendFlowPassphraseEntered] =
    useState(false);
  const [sendFlowPinEntered, setSendFlowPinEntered] = useState(false);
  const [sendFlowCardsTapped, setSendFlowCardsTapped] = useState(false);
  const [signedTxn, setSignedTxn] = useState('');
  const [completed, setCompleted] = useState(false);

  let recAddr: string | undefined;

  const { addReceiveAddressHook } = useSocket();

  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const swapTransaction = new TransactionSwapper();
  const userAction = useRef<DeferredReference<void>>(
    new DeferredReference<void>()
  );
  const replaceAccountAction = useRef<DeferredReference<void>>(
    new DeferredReference<void>()
  );
  const resetHooks = () => {
    setReceiveCoinsConfirmed(false);
    setSendCoinsConfirmed(false);
    setReceiveAddressVerified(false);
    setCompleted(false);
    setReceiveAddress('');
    setTransactionMetadataSent(false);
    setReceiveFlowCardTapped(false);
    setReceiveFlowPinEntered(false);
    setSendFlowCardsTapped(false);
    setReceiveFlowPassphraseEntered(false);
    setSendFlowPassphraseEntered(false);
    setReceiveAccountExists(false);
    setTotalFees('0');
    setSendFlowVerified(false);
    setSendFlowPinEntered(false);
    setSignedTxn('');
    setChangellyAddress('');
    setChangellyTxnId('');
    userAction.current = new DeferredReference<void>();
    replaceAccountAction.current = new DeferredReference<void>();
    swapTransaction.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
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

  const handleSwapTransactionError = (coinType: string, error: CysyncError) => {
    const cyError = new CyError(error);
    setErrorObj(
      handleErrors(errorObj, cyError, flowName, {
        coinType
      })
    );
  };

  const handleSwapTransaction: UseSwapTransactionValues['handleSwapTransaction'] =
    async ({
      connection,
      sdkVersion,
      setIsInFlow,
      sendAmount,
      receiveAmount,
      changellyFee,
      receiveFlow,
      sendFlow
    }) => {
      clearAll();

      logger.info(`SwapTransaction: Initiated`);

      logger.debug('SwapTransaction: Receive Flow Details', {
        walletId: receiveFlow.walletId,
        coinId: receiveFlow.coinId,
        contactAbbr: receiveFlow.contractAbbr
      });

      logger.debug('SwapTransaction: ReceiveAddress Xpub', {
        xpub: receiveFlow.xpub,
        zpub: receiveFlow.zpub
      });

      logger.info('SwapTransaction: SendTransaction Data', {
        walletId: sendFlow.walletId,
        pinExists: sendFlow.pinExists,
        coinId: sendFlow.coinId,
        outputList: sendFlow.outputList,
        fees: sendFlow.fees,
        isSendAll: sendFlow.isSendAll,
        data: sendFlow.data
      });
      logger.debug('SwapTransaction: SendTransaction Xpub', {
        xpub: sendFlow.xpub
      });

      if (!connection) {
        const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            connection,
            sendCoinId: sendFlow.coinId,
            receiveCoinId: receiveFlow.coinId
          })
        );
        return;
      }

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.CONNECTION_OPEN, () => {
        logger.info('SwapTransaction: Connection Opened');
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.CONNECTION_CLOSE, () => {
        logger.info('SwapTransaction: Connection Closed');
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_FLOW_CARD_ERROR,
        () => {
          handleSwapTransactionError(
            receiveFlow.coinId,
            CysyncError.UNKNOWN_CARD_ERROR
          );
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.SEND_FLOW_CARD_ERROR, () => {
        handleSwapTransactionError(
          sendFlow.coinId,
          CysyncError.UNKNOWN_CARD_ERROR
        );
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.ERROR, err => {
        const cyError = new CyError();
        if (err.isAxiosError) {
          handleAxiosErrors(cyError, err);
        } else if (err instanceof DeviceError) {
          handleDeviceErrors(cyError, err, flowName);
        } else {
          cyError.setError(CysyncError.SWAP_TXN_UNKNOWN_ERROR);
        }
        setErrorObj(handleErrors(errorObj, cyError, flowName, err));
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.RECEIVE_WALLET_LOCKED, () => {
        handleSwapTransactionError(
          receiveFlow.coinId,
          CysyncError.WALLET_IS_LOCKED
        );
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.LOCKED, () => {
        handleSwapTransactionError(
          sendFlow.coinId,
          CysyncError.WALLET_IS_LOCKED
        );
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.NOT_READY, () => {
        const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            sendCoinId: sendFlow.coinId,
            receiveCoinId: receiveFlow.coinId
          })
        );
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.NO_RECEIVE_WALLET_FOUND,
        (walletState: WalletStates) => {
          const cyError = flowHandlers.noWalletFound(walletState);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              coinId: receiveFlow.coinId,
              walletState
            })
          );
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.NO_RECEIVE_WALLET_ON_CARD,
        () => {
          const cyError = new CyError(CysyncError.WALLET_NOT_FOUND_IN_CARD);
          setErrorObj(handleErrors(errorObj, cyError, flowName));
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_COINS_CONFIRMED,
        coins => {
          if (coins) {
            logger.verbose(
              'SwapTransaction: ReceiveAddress: Confirmed on device',
              { coinId: receiveFlow.coinId }
            );
            setReceiveCoinsConfirmed(true);
          } else {
            const cyError = new CyError(
              CysyncError.RECEIVE_TXN_REJECTED,
              receiveFlow.coinName
            );
            setErrorObj(
              handleErrors(errorObj, cyError, flowName, {
                coinId: receiveFlow.coinId
              })
            );
          }
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_FLOW_CUSTOM_ACCOUNT_EXISTS,
        exists => {
          if (exists) {
            logger.verbose(
              'SwapTransaction: ReceiveAddress: Custom Account exits on device',
              {
                coinId: receiveFlow.coinId
              }
            );
            setReceiveAccountExists(true);
          }
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.SWAP_TRANSACTION_METADATA_SENT,
        () => {
          logger.verbose('SwapTransaction: Swap Details sent', {
            sendCoinId: sendFlow.coinId,
            receiveCoinId: receiveFlow.coinId
          });
          setTransactionMetadataSent(true);
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_ADDRESS_VERIFIED,
        val => {
          const cyError = new CyError();
          if (val) {
            logger.verbose(
              'SwapTransaction: Received address generated on device',
              {
                deviceAddress: val,
                coinId: receiveFlow.coinId,
                desktopAddress: recAddr
              }
            );

            if (
              !receiveFlow.customAccount &&
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
              setReceiveAddressVerified(true);
              onNewReceiveAddr(
                recAddr,
                receiveFlow.walletId,
                receiveFlow.accountId,
                receiveFlow.coinId
              );
            }
            if (receiveFlow.customAccount) {
              logger.verbose(
                'ReceiveAddress: Address comparison skipped, found customAccount',
                receiveFlow.coinId
              );
            }

            setReceiveAddressVerified(true);
            onNewReceiveAddr(
              recAddr,
              receiveFlow.walletId,
              receiveFlow.accountId,
              receiveFlow.coinId
            );
          } else {
            cyError.setError(CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER);
          }

          if (cyError.isSet)
            setErrorObj(
              handleErrors(errorObj, cyError, flowName, {
                coinId: receiveFlow.coinId
              })
            );
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.RECEIVE_ADDRESS, address => {
        logger.info('SwapTransaction: ReceiveAddress: Address generated', {
          coinId: receiveFlow.coinId,
          address
        });
        setReceiveAddress(address);
        recAddr = address;
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_FLOW_PASSPHRASE_ENTERED,
        () => {
          logger.info('SwapTransaction: ReceiveAddress: Passphrase entered', {
            coinId: receiveFlow.coinId
          });
          setReceiveFlowPassphraseEntered(true);
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_FLOW_PIN_ENTERED,
        pin => {
          if (pin) {
            logger.verbose('SwapTransaction: ReceiveAddress: Pin entered', {
              coinId: receiveFlow.coinId
            });
            setReceiveFlowPinEntered(true);
          } else {
            const cyError = new CyError(
              CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
            );
            setErrorObj(handleErrors(errorObj, cyError, flowName));
          }
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_FLOW_CARD_TAPPED,
        () => {
          logger.verbose('SwapTransaction: ReceiveAddress: Card Tapped', {
            coinId: receiveFlow.coinId
          });
          setReceiveFlowCardTapped(true);
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.CHANGELLY_ADDRESS, address => {
        logger.verbose('SwapTransaction: ChangellyAddress: Address generated', {
          receiveCoinId: receiveFlow.coinId,
          sendCoinId: sendFlow.coinId,
          address
        });
        setChangellyAddress(address);
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.CHANGELLY_ID, id => {
        logger.verbose('SwapTransaction: ChangellyId: Id generated', {
          receiveCoinId: receiveFlow.coinId,
          sendCoinId: sendFlow.coinId,
          id
        });
        setChangellyTxnId(id);
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.SEND_COINS_CONFIRMED,
        coins => {
          if (coins) {
            logger.verbose('SendTransaction: Txn confirmed', {
              coinId: sendFlow.coinId
            });
            setSendCoinsConfirmed(true);
          } else {
            const cyError = new CyError(
              CysyncError.SEND_TXN_REJECTED,
              COINS[sendFlow.coinId].name
            );
            setErrorObj(
              handleErrors(errorObj, cyError, flowName, {
                coinId: sendFlow.coinId
              })
            );
          }
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.TRANSACTION_TOO_LARGE, () => {
        const cyError = new CyError(CysyncError.SEND_TXN_SIZE_TOO_LARGE);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            coinId: sendFlow.coinId
          })
        );
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.NO_SEND_WALLET_FOUND,
        (walletState: WalletStates) => {
          const cyError = flowHandlers.noWalletFound(walletState);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              coinId: sendFlow.coinId,
              walletState
            })
          );
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.NO_SEND_WALLET_ON_CARD, () => {
        const cyError = new CyError(CysyncError.WALLET_NOT_FOUND_IN_CARD);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      });

      swapTransaction.on('totalFees', fee => {
        logger.info('SendTransaction: Total fee generated', {
          coinId: sendFlow.coinId,
          fee
        });
        setTotalFees(fee);
      });

      swapTransaction.on('inputOutput', ({ inputs, outputs }) => {
        logger.info('SendTransaction: Txn input output generated', {
          coinId: sendFlow.coinId,
          inputs,
          outputs
        });
        setTxnInputs(inputs);
        setTxnOutputs(outputs);
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.INSUFFICIENT_FUNDS, funds => {
        if (funds) {
          const cyError = new CyError(
            WalletErrorType.INSUFFICIENT_FUNDS,
            COINS[sendFlow.coinId].name
          );
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              coinId: sendFlow.coinId,
              funds
            })
          );
        }
      });

      // Verified receives `true` if verified, otherwise the index of the rejection screen
      swapTransaction.on(SWAP_TRANSACTION_EVENTS.SEND_FLOW_VERIFIED, val => {
        if (val === true) {
          logger.verbose('SendTransaction: Txn verified', {
            coinId: sendFlow.coinId
          });
          setSendFlowVerified(true);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_REJECTED);

          logger.info('SendTransaction: Txn rejected from device', {
            coinId: sendFlow.coinId,
            command: val
          });

          if (val === 0) {
            cyError.pushSubErrors(CysyncError.SEND_TXN_REJECTED_AT_ADDRESS);
          } else if (val === 2) {
            cyError.pushSubErrors(CysyncError.SEND_TXN_REJECTED_AT_AMOUNT);
          } else if (val === 3) {
            cyError.pushSubErrors(CysyncError.SEND_TXN_REJECTED_AT_FEE);
          } else {
            cyError.pushSubErrors(CysyncError.SEND_TXN_REJECTED_AT_UNKNOWN);
          }
          setErrorObj(handleErrors(errorObj, cyError, flowName));
        }
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.SEND_FLOW_PASSPHRASE_ENTERED,
        () => {
          logger.verbose(
            'SwapTransaction: SendTransaction: Passphrase entered',
            { coinId: sendFlow.coinId }
          );
          setSendFlowPassphraseEntered(true);
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.SEND_FLOW_PIN_ENTERED, pin => {
        if (pin) {
          logger.verbose('SwapTransaction: SendTransaction: Pin entered', {
            coinId: sendFlow.coinId
          });
          setSendFlowPinEntered(true);
        } else {
          const cyError = new CyError(
            CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
          );
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              coinId: sendFlow.coinId
            })
          );
        }
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.SEND_FLOW_CARD_TAPPED,
        cards => {
          if (cards) {
            logger.verbose('SendTransaction: Cards tapped', {
              coinId: sendFlow.coinId
            });
            setSendFlowCardsTapped(true);
          }
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.SIGNED_TRANSACTION, txn => {
        if (txn) {
          logger.verbose(
            'SwapTransaction: SendTransaction: Signed txn generated',
            { coinId: sendFlow.coinId }
          );
          setSignedTxn(txn);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
          cyError.pushSubErrors(CysyncError.SEND_TXN_SIGNED_TXN_NOT_FOUND);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              txn,
              coinId: sendFlow.coinId
            })
          );
        }
      });

      // Why is this not treated as an error?
      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.SIGNATURE_VERIFY,
        ({ isVerified, index, error }) => {
          if (error) {
            logger.warn(
              `${CysyncError.SEND_TXN_VERIFICATION_FAILED} SwapTransaction: Error in verifying txn signature.`
            );
            logger.warn(error);
            return;
          }

          if (isVerified) {
            logger.info('Txn signature verified successfully');
          } else {
            logger.warn(
              `Txn signature was not verified at input index ${index}`
            );
          }
        }
      );

      try {
        setIsInFlow(true);

        await swapTransaction.run({
          connection,
          sdkVersion,
          sendAmount,
          receiveAmount,
          changellyFee,
          transactionReceiverRunOptions: {
            connection,
            sdkVersion,
            addressDB: addressDb,
            walletId: receiveFlow.walletId,
            accountId: receiveFlow.accountId,
            accountIndex: receiveFlow.accountIndex,
            coinId: receiveFlow.coinId,
            xpub: receiveFlow.xpub,
            contractAbbr: receiveFlow.contractAbbr || receiveFlow.coinId,
            passphraseExists: receiveFlow.passphraseExists,
            customAccount: receiveFlow.customAccount,
            userAction: userAction.current,
            replaceAccountAction: replaceAccountAction.current
          },
          transactionSenderRunOptions: {
            connection,
            sdkVersion,
            addressDB: addressDb,
            transactionDB: transactionDb,
            walletId: sendFlow.walletId,
            accountId: sendFlow.accountId,
            accountIndex: sendFlow.accountIndex,
            accountType: sendFlow.accountType,
            pinExists: sendFlow.pinExists,
            passphraseExists: sendFlow.passphraseExists,
            xpub: sendFlow.xpub,
            customAccount: sendFlow.customAccount,
            newAccountId: sendFlow.newAccountId,
            coinId: sendFlow.coinId,
            outputList: sendFlow.outputList,
            fee: sendFlow.fees,
            isSendAll: sendFlow.isSendAll,
            data: sendFlow.data
          }
        });

        setIsInFlow(false);
        logger.info('SendTransaction: Completed', {
          sendCoinId: sendFlow.coinId,
          receiveCoinId: receiveFlow.coinId
        });
        setCompleted(true);
      } catch (error) {
        setIsInFlow(false);
        const cyError = new CyError(CysyncError.RECEIVE_TXN_UNKNOWN_ERROR);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            error,
            receiveCoinId: receiveFlow.coinId,
            sendCoinId: sendFlow.coinId
          })
        );
        swapTransaction.removeAllListeners();
      }
    };

  const cancelSwapTransaction = async (connection: DeviceConnection) => {
    setIsCancelled(true);
    return swapTransaction
      .cancel(connection)
      .then(cancelled => {
        if (cancelled) {
          logger.info('SwapTransaction: Cancelled');
        }
      })
      .catch(e => {
        logger.error(
          `${CysyncError.RECEIVE_TXN_CANCEL_FAILED}  SwapTransaction: Error in flow cancel`
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

  return {
    handleSwapTransaction,
    cancelSwapTransaction,
    receiveFlow: {
      receiveAddress,
      transactionMetadataSent,
      receiveFlowPinEntered,
      receiveFlowCardTapped,
      receiveAddressVerified,
      receiveFlowPassphraseEntered,
      receiveCoinsConfirmed,
      receiveAccountExists
    },
    sendFlow: {
      sendCoinsConfirmed,
      totalFees,
      txnInputs,
      txnOutputs,
      sendFlowVerified,
      sendFlowPassphraseEntered,
      sendFlowPinEntered,
      sendFlowCardsTapped,
      signedTxn,
      completed
    },
    changellyAddress,
    changellyTxnId
  };
};
