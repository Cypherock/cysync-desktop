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
    coinType: string;
    xpub: string;
    zpub?: string;
    customAccount?: string;
    newAccountId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputList: any[];
    fees: number;
    isSendAll?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
  };
  receiveFlow: {
    walletId: string;
    coinType: string;
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
    // setCoinsConfirmed(false);
    setReceiveAddressVerified(false);
    // setVerified(false);
    setCompleted(false);
    setReceiveAddress('');
    setTransactionMetadataSent(false);
    // setPathSent(false);
    // setCardTapped(false);
    setReceiveFlowCardTapped(false);
    setSendFlowCardsTapped(false);
    setReceiveFlowPassphraseEntered(false);
    setSendFlowPassphraseEntered(false);
    // setXpubMissing(false);
    setReceiveAccountExists(false);
    // setAccountExists(false);
    // setReplaceAccount(false);
    // setVerifiedAccountId(false);
    // setVerifiedReplaceAccount(false);
    // setReplaceAccountStarted(false);
    setTotalFees('0');
    setSendFlowVerified(false);
    setSendFlowPinEntered(false);
    setSignedTxn('');
    userAction.current = new DeferredReference<void>();
    replaceAccountAction.current = new DeferredReference<void>();
    swapTransaction.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    // clearErrorObj();
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
      // logger.info('Swap Transaction Send Flow Details', {
      //     walletId: sendFlow.walletId,
      //     coinType: sendFlow.coinType,
      //     contactAbbr: sendFlow.data.contractAbbr,
      // });
      logger.debug('SwapTransaction: Receive Flow Details', {
        walletId: receiveFlow.walletId,
        coinType: receiveFlow.coinType,
        contactAbbr: receiveFlow.contractAbbr
      });

      logger.debug('SwapTransaction: ReceiveAddress Xpub', {
        xpud: receiveFlow.xpub,
        zpub: receiveFlow.zpub
      });

      logger.info('SwapTransaction: SendTransaction Data', {
        walletId: sendFlow.walletId,
        pinExists: sendFlow.pinExists,
        coinType: sendFlow.coinType,
        outputList: sendFlow.outputList,
        fees: sendFlow.fees,
        isSendAll: sendFlow.isSendAll,
        data: sendFlow.data
      });
      logger.debug('SwapTransaction: SendTransaction Xpub', {
        xpub: sendFlow.xpub,
        zpub: sendFlow.zpub
      });

      if (!connection) {
        const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            connection,
            sendCoinType: sendFlow.coinType,
            receiveCoinType: receiveFlow.coinType
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
            receiveFlow.coinType,
            CysyncError.UNKNOWN_CARD_ERROR
          );
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.SEND_FLOW_CARD_ERROR, () => {
        handleSwapTransactionError(
          sendFlow.coinType,
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
          receiveFlow.coinType,
          CysyncError.WALLET_IS_LOCKED
        );
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.LOCKED, () => {
        handleSwapTransactionError(
          sendFlow.coinType,
          CysyncError.WALLET_IS_LOCKED
        );
      });

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.NOT_READY, () => {
        const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            sendCoinType: sendFlow.coinType,
            receiveCoinType: receiveFlow.coinType
          })
        );
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.NO_RECEIVE_WALLET_FOUND,
        (walletState: WalletStates) => {
          const cyError = flowHandlers.noWalletFound(walletState);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              coinType: receiveFlow.coinType,
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
              { coinType: receiveFlow.coinType }
            );
            setReceiveCoinsConfirmed(true);
          } else {
            const cyError = new CyError(
              CysyncError.RECEIVE_TXN_REJECTED,
              receiveFlow.coinName
            );
            setErrorObj(
              handleErrors(errorObj, cyError, flowName, {
                coinType: receiveFlow.coinType
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
                coinType: receiveFlow.coinType
              }
            );
            setReceiveAccountExists(true);
          }
        }
      );

      // EVENT CURRENTLY DOESN'T EXIST
      // receiveTransaction.on('replaceAccountRequired', value => {
      //     if (value) {
      //         logger.verbose(
      //             'ReceiveAddress: Device needs to replace an account to add a new one',
      //             {
      //                 coinType
      //             }
      //         );
      //         setReplaceAccount(true);
      //     }
      // });

      // EVENT CURRENTLY DOESN'T EXIST
      // receiveTransaction.on('accountVerified', value => {
      //     if (value) {
      //         logger.verbose('ReceiveAddress: Account confirmed on device', {
      //             coinType
      //         });
      //         setVerifiedAccountId(true);
      //     } else {
      //         const cyError = new CyError(
      //             CysyncError.RECEIVE_TXN_REJECTED,
      //             coinName
      //         );
      //         setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      //     }
      // });

      // EVENT CURRENTLY DOESN'T EXIST
      // receiveTransaction.on('replaceAccountSelected', value => {
      //     if (value) {
      //         logger.verbose('ReceiveAddress: Replace account selected on device', {
      //             coinType
      //         });
      //         setReplaceAccountSelected(true);
      //     } else {
      //         setReplaceAccountSelected(false);
      //     }
      // });

      // EVENT CURRENTLY DOESN'T EXIST
      // receiveTransaction.on('replaceAccountVerified', value => {
      //     if (value) {
      //         logger.verbose(
      //             'ReceiveAddress: Replace account confirmed on device',
      //             { coinType }
      //         );
      //         setVerifiedReplaceAccount(true);
      //     } else {
      //         const cyError = new CyError(
      //             CysyncError.RECEIVE_TXN_REJECTED,
      //             coinName
      //         );
      //         setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      //     }
      // });

      // EVENT WAS ONLY ON RUN LEGACY
      // receiveTransaction.on('noXpub', () => {
      //     setTimeout(() => {
      //         setXpubMissing(true);
      //         const cyError = new CyError(
      //             CysyncError.RECEIVE_TXN_DEVICE_MISCONFIGURED
      //         );
      //         cyError.pushSubErrors(
      //             CysyncError.RECEIVE_TXN_XPUB_MISSING,
      //             'Xpub missing on device'
      //         );
      //         setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      //     }, 3000);
      // });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.SWAP_TRANSACTION_METADATA_SENT,
        () => {
          logger.verbose('SwapTransaction: Swap Details sent', {
            sendCoinType: sendFlow.coinType,
            receiveCoinType: receiveFlow.coinType
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
              'ReceiveAddress: Received address generated on device',
              {
                deviceAddress: val,
                coinType: receiveFlow.coinType,
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
                receiveFlow.coinType
              );
            }
            if (receiveFlow.customAccount) {
              logger.verbose(
                'ReceiveAddress: Address comparison skipped, found customAccount',
                receiveFlow.coinType
              );
            }

            setReceiveAddressVerified(true);
            onNewReceiveAddr(
              recAddr,
              receiveFlow.walletId,
              receiveFlow.coinType
            );
          } else {
            cyError.setError(CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER);
          }
          if (cyError.isSet)
            setErrorObj(
              handleErrors(errorObj, cyError, flowName, {
                coinType: receiveFlow.coinType
              })
            );
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.RECEIVE_ADDRESS, address => {
        logger.info('ReceiveAddress: Address generated', {
          coinType: receiveFlow.coinType,
          address
        });
        setReceiveAddress(address);
        recAddr = address;
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_FLOW_PASSPHRASE_ENTERED,
        () => {
          logger.info('SwapTransaction: ReceiveAddress: Passphrase entered', {
            coinType: receiveFlow.coinType
          });
          setReceiveFlowPassphraseEntered(true);
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.RECEIVE_FLOW_PIN_ENTERED,
        pin => {
          if (pin) {
            logger.verbose('SwapTransaction: ReceiveAddress: Pin entered', {
              coinType: receiveFlow.coinType
            });
            setReceiveFlowCardTapped(true);
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
            coinType: receiveFlow.coinType
          });
          setReceiveFlowCardTapped(true);
        }
      );

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.SEND_COINS_CONFIRMED,
        coins => {
          if (coins) {
            logger.verbose('SendTransaction: Txn confirmed', {
              coinType: sendFlow.coinType
            });
            setSendCoinsConfirmed(true);
          } else {
            const cyError = new CyError(
              CysyncError.SEND_TXN_REJECTED,
              COINS[sendFlow.coinType].name
            );
            setErrorObj(
              handleErrors(errorObj, cyError, flowName, {
                coinType: sendFlow.coinType
              })
            );
          }
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.TRANSACTION_TOO_LARGE, () => {
        const cyError = new CyError(CysyncError.SEND_TXN_SIZE_TOO_LARGE);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            coinType: sendFlow.coinType
          })
        );
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.NO_SEND_WALLET_FOUND,
        (walletState: WalletStates) => {
          const cyError = flowHandlers.noWalletFound(walletState);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              coinType: sendFlow.coinType,
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
          coinType: sendFlow.coinType,
          fee
        });
        setTotalFees(fee);
      });

      swapTransaction.on('inputOutput', ({ inputs, outputs }) => {
        logger.info('SendTransaction: Txn input output generated', {
          coinType: sendFlow.coinType,
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
            COINS[sendFlow.coinType].name
          );
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              coinType: sendFlow.coinType,
              funds
            })
          );
        }
      });

      // Verified receives `true` if verified, otherwise the index of the rejection screen
      swapTransaction.on(SWAP_TRANSACTION_EVENTS.SEND_FLOW_VERIFIED, val => {
        if (val === true) {
          logger.verbose('SendTransaction: Txn verified', {
            coinType: sendFlow.coinType
          });
          setSendFlowVerified(true);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_REJECTED);

          logger.info('SendTransaction: Txn rejected from device', {
            coinType: sendFlow.coinType,
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
            { coinType: sendFlow.coinType }
          );
          setSendFlowPassphraseEntered(true);
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.SEND_FLOW_PIN_ENTERED, pin => {
        if (pin) {
          logger.verbose('SwapTransaction: SendTransaction: Pin entered', {
            coinType: sendFlow.coinType
          });
          setSendFlowPinEntered(true);
        } else {
          const cyError = new CyError(
            CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
          );
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              coinType: sendFlow.coinType
            })
          );
        }
      });

      swapTransaction.on(
        SWAP_TRANSACTION_EVENTS.SEND_FLOW_CARD_TAPPED,
        cards => {
          if (cards) {
            logger.verbose('SendTransaction: Cards tapped', {
              coinType: sendFlow.coinType
            });
            setSendFlowCardsTapped(true);
          }
        }
      );

      swapTransaction.on(SWAP_TRANSACTION_EVENTS.SIGNED_TRANSACTION, txn => {
        if (txn) {
          logger.verbose(
            'SwapTransaction: SendTransaction: Signed txn generated',
            { coinType: sendFlow.coinType }
          );
          setSignedTxn(txn);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
          cyError.pushSubErrors(CysyncError.SEND_TXN_SIGNED_TXN_NOT_FOUND);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, {
              txn,
              coinType: sendFlow.coinType
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
            coinType: receiveFlow.coinType,
            xpub: receiveFlow.xpub,
            zpub: receiveFlow.zpub,
            contractAbbr: receiveFlow.contractAbbr || receiveFlow.coinType,
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
            pinExists: sendFlow.pinExists,
            passphraseExists: sendFlow.passphraseExists,
            xpub: sendFlow.xpub,
            zpub: sendFlow.zpub,
            customAccount: sendFlow.customAccount,
            newAccountId: sendFlow.newAccountId,
            coinType: sendFlow.coinType,
            outputList: sendFlow.outputList,
            fee: sendFlow.fees,
            isSendAll: sendFlow.isSendAll,
            data: sendFlow.data
          }
        });

        setIsInFlow(false);
        logger.info('SendTransaction: Completed', {
          sendCoinType: sendFlow.coinType,
          receiveCoinType: receiveFlow.coinType
        });
        setCompleted(true);
      } catch (error) {
        setIsInFlow(false);
        const cyError = new CyError(CysyncError.RECEIVE_TXN_UNKNOWN_ERROR);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            error,
            receiveCoinType: receiveFlow.coinType,
            sendCoinType: sendFlow.coinType
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
    }
  };
};
