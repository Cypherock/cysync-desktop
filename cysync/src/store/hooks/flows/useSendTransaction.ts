import {
  CoinGroup,
  COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType,
  EthCoinData,
  NearCoinData
} from '@cypherock/communication';
import {
  InputOutput,
  IOtype,
  SentReceive,
  Transaction
} from '@cypherock/database';
import { TransactionSender, WalletStates } from '@cypherock/protocols';
import Server from '@cypherock/server-wrapper';
import { WalletError, WalletErrorType } from '@cypherock/wallet';
import BigNumber from 'bignumber.js';
import WAValidator from 'multicoin-address-validator';
import { useEffect, useState } from 'react';

import {
  CyError,
  CysyncError,
  handleAxiosErrors,
  handleDeviceErrors,
  handleErrors,
  handleWalletErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';
import { addressDb, coinDb, transactionDb } from '../../database';

import * as flowHandlers from './handlers';

const flowName = Analytics.Categories.SEND_TXN;

export const changeFormatOfOutputList = (
  targetList: any,
  coinType: string,
  token: any
): Array<{ address: string; value?: BigNumber }> => {
  const coin = COINS[token ? token.coin : coinType];

  if (!coin) {
    throw new Error(`Invalid coinType ${coinType}`);
  }

  return targetList.map((rec: any) => {
    return {
      address: rec.recipient.trim(),

      value:
        rec.amount === undefined
          ? undefined
          : new BigNumber(rec.amount).multipliedBy(
              new BigNumber(coin.multiplier)
            )
    };
  });
};

export const broadcastTxn = async (
  signedTxn: string,
  coinType: string
): Promise<string> => {
  const coin = COINS[coinType];

  if (!coin) {
    throw new Error(`Invalid coinType ${coinType}`);
  }

  if (coin instanceof EthCoinData) {
    const resp = await Server.eth.transaction
      .broadcastTxn({
        transaction: signedTxn,
        network: coin.network
      })
      .request();
    if (resp.status === 0) {
      throw new Error('brodcast-failed');
    }
    return resp.data.result.toUpperCase();
  } else if (coin instanceof NearCoinData) {
    const resp = await Server.near.transaction
      .broadcastTxn({
        transaction: signedTxn,
        network: coin.network
      })
      .request();
    if (resp.status === 0) {
      throw new Error('brodcast-failed');
    }
    return resp.data.transaction.hash;
  } else {
    const res = await Server.bitcoin.transaction
      .broadcastTxn({
        transaction: signedTxn,
        coinType
      })
      .request();
    return res.data.tx.hash;
  }
};

export const verifyAddress = (address: string, coin: string) => {
  const coinDetails = COINS[coin];

  if (!coinDetails) {
    throw new Error(`Cannot find coin details for coin: ${coin}`);
  }

  if (coinDetails.group === CoinGroup.Near) {
    const regexImplicit = /^[a-f0-9]{64}$/;
    const regexRegistered =
      /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/; // any number of top level accounts are valid here
    return regexImplicit.test(address) || regexRegistered.test(address);
  }
  return WAValidator.validate(
    address,
    coinDetails.validatorCoinName,
    coinDetails.validatorNetworkType
  );
};

export interface HandleSendTransactionOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  walletId: string;
  pinExists: boolean;
  passphraseExists: boolean;
  xpub: string;
  zpub: string | undefined;
  customAccount: string | undefined;
  newAccountId: string | undefined;
  coinType: string;
  outputList: any[];
  fees: number;
  isSendAll: boolean | undefined;
  data: any;
}

export interface UseSendTransactionValues {
  handleSendTransaction: (
    options: HandleSendTransactionOptions
  ) => Promise<void>;
  handleEstimateGasLimit: (
    fromAddress: string,
    toAddress: string,
    network: string,
    contractAddress: string,
    amount: string
  ) => Promise<any>;
  deviceConnected: boolean;
  setDeviceConnected: React.Dispatch<React.SetStateAction<boolean>>;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  errorObj: CyError;
  clearErrorObj: () => void;
  coinsConfirmed: boolean;
  metadataSent: boolean;
  verified: boolean;
  pinEntered: boolean;
  passphraseEntered: boolean;
  cardsTapped: boolean;
  signedTxn: string;
  hash: string;
  setHash: React.Dispatch<React.SetStateAction<string>>;
  totalFees: number;
  approxTotalFee: number;
  sendMaxAmount: string;
  resetHooks: () => void;
  cancelSendTxn: (connection: DeviceConnection) => void;
  handleEstimateFee: (
    xpub: string,
    zpub: string | undefined,
    coinType: string,
    outputList: any[],
    fees: number,
    isSendAll: boolean | undefined,
    data: any,
    customAccount: string | undefined
  ) => Promise<void>;
  onTxnBroadcast: (params: {
    walletId: string;
    coin: string;
    txHash: string;
    token?: string;
  }) => void;
  estimationError: CyError;
}

export type UseSendTransaction = () => UseSendTransactionValues;

export interface TxInputOutput {
  value: number | string;
  address: string;
  isMine: boolean;
  vout?: number;
  txId?: string;
}

export const useSendTransaction: UseSendTransaction = () => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [coinsConfirmed, setCoinsConfirmed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [pinEntered, setPinEntered] = useState(false);
  const [passphraseEntered, setPassphraseEntered] = useState(false);
  const [cardsTapped, setCardsTapped] = useState(false);
  const [signedTxn, setSignedTxn] = useState('');
  const [hash, setHash] = useState('');
  const [metadataSent, setMetadataSent] = useState(false);
  const sendTransaction = new TransactionSender();
  const [totalFees, setTotalFees] = useState(0);
  const [txnInputs, setTxnInputs] = useState<TxInputOutput[]>([]);
  const [txnOutputs, setTxnOutputs] = useState<TxInputOutput[]>([]);
  const [approxTotalFee, setApproxTotalFees] = useState(0);
  const [sendMaxAmount, setSendMaxAmount] = useState('0');
  const [isCancelled, setIsCancelled] = useState(false);

  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const [estimationError, setEstimationError] = useState<CyError>(
    new CyError()
  );

  const resetHooks = () => {
    setDeviceConnected(false);
    setCoinsConfirmed(false);
    setVerified(false);
    setPinEntered(false);
    setPassphraseEntered(false);
    setCardsTapped(false);
    setSignedTxn('');
    setCompleted(false);
    setMetadataSent(false);
    setEstimationError(undefined);
    setTotalFees(0);
    setSendMaxAmount('0');
    sendTransaction.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    clearErrorObj();
    resetHooks();
  };

  const handleEstimateFee: UseSendTransactionValues['handleEstimateFee'] =
    async (
      xpub,
      zpub,
      coinType,
      outputList,
      fees,
      isSendAll,
      data,
      customAccount
    ) => {
      // If it has no input, then set the tx fee and amount to 0.
      if (!isSendAll && outputList.length > 0) {
        let hasInput = false;
        for (const output of outputList) {
          if (output.value && (output.value as BigNumber).isGreaterThan(0)) {
            hasInput = true;
          }
        }

        if (!hasInput) {
          setApproxTotalFees(0);
          setSendMaxAmount('0');
          setEstimationError(undefined);
          return;
        }
      }

      const subFlowName = Analytics.Categories.ESTIMATE_FEE;
      logger.info(
        `${subFlowName}: Initiated , ${[coinType, fees, isSendAll].join(',')}`
      );

      sendTransaction.on('approxTotalFee', fee => {
        logger.verbose(`${subFlowName}: Total fee generated , ${coinType}`);
        setApproxTotalFees(Number(fee));
      });

      sendTransaction.on('sendMaxAmount', amt => {
        logger.verbose(
          `${subFlowName}: Send Max amount generated: ${[amt, coinType].join(
            ','
          )}`
        );
        setSendMaxAmount(amt);
      });

      const { walletId } = await coinDb.getOne({ xpub, slug: coinType });
      sendTransaction
        .calcApproxFee(
          xpub,
          zpub,
          walletId,
          coinType,
          outputList,
          fees,
          isSendAll,
          data,
          transactionDb,
          customAccount
        )
        .then(() => {
          setEstimationError(undefined);
          logger.info(`${subFlowName}: Completed', ${coinType}`);
        })
        .catch(error => {
          logger.info(`${subFlowName}: Error', ${coinType}`);
          logger.error(error);
          const cyError = new CyError();
          // Don't show error other than network error, because the data may be
          // insufficient for the calculation
          if (error.isAxiosError) {
            handleAxiosErrors(cyError, error);
            setErrorObj(handleErrors(errorObj, cyError, subFlowName));
            return;
          } else if (error instanceof WalletError) {
            handleWalletErrors(cyError, error, { coinType });
          } else {
            cyError.setError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
          }
          setEstimationError(
            handleErrors(estimationError, cyError, subFlowName, { error })
          );
        });
    };

  const handleEstimateGasLimit = async (
    fromAddress: string,
    toAddress: string,
    network: string,
    contractAddress: string,
    amount: string
  ) => {
    return new Promise(resolve => {
      const subFlowName = Analytics.Categories.ESTIMATE_GAS_LIMIT;
      logger.info(`${subFlowName}: Initiated', ${contractAddress}`);
      Server.eth.transaction
        .getContractFees({
          fromAddress,
          toAddress: toAddress.trim(),
          network,
          contractAddress,
          amount
        })
        .request()
        .then(res => {
          logger.info(`${subFlowName}: Completed', ${contractAddress}`);
          resolve(res.data);
        })
        .catch(e => {
          logger.info(`${subFlowName}: Error', ${contractAddress}`);
          logger.error(e);
          const cyError = new CyError();
          // Don't show any other error because it may be due to
          // incorrect amount or address which the user may change.
          if (e.isAxiosError) {
            if (!e.response) {
              handleAxiosErrors(cyError, e);
            }
          } else {
            cyError.setError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
          }
          setErrorObj(handleErrors(errorObj, cyError, subFlowName, { e }));
          resolve(null);
        });
    });
  };

  const handleSendTransaction: UseSendTransactionValues['handleSendTransaction'] =
    async ({
      connection,
      sdkVersion,
      setIsInFlow,
      walletId,
      pinExists,
      passphraseExists,
      xpub,
      zpub,
      customAccount,
      newAccountId,
      coinType,
      outputList,
      fees,
      isSendAll,
      data
    }) => {
      clearAll();

      logger.info('SendTransaction: Initiated', { coinType });
      logger.info('SendTransaction Data', {
        walletId,
        pinExists,
        coinType,
        outputList,
        fees,
        isSendAll,
        data
      });
      logger.debug('SendTransaction Xpub', {
        xpub,
        zpub
      });

      if (!connection) {
        const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
        return;
      }

      sendTransaction.on('connectionOpen', () => {
        logger.info('SendTransaction: Connection Opened');
      });

      sendTransaction.on('connectionClose', () => {
        logger.info('SendTransaction: Connection Closed');
      });

      sendTransaction.on('cardError', () => {
        const cyError = new CyError(CysyncError.UNKNOWN_CARD_ERROR);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      });

      sendTransaction.on('error', err => {
        const cyError = new CyError();
        if (err instanceof WalletError) {
          handleWalletErrors(cyError, err, { coinType });
        } else if (err.isAxiosError) {
          handleAxiosErrors(cyError, err);
        } else if (err instanceof DeviceError) {
          handleDeviceErrors(cyError, err, flowName);
        } else {
          cyError.setError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
        }
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      });

      sendTransaction.on('locked', () => {
        const cyError = new CyError(CysyncError.WALLET_IS_LOCKED);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      });

      sendTransaction.on('notReady', () => {
        const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      });

      sendTransaction.on('coinsConfirmed', coins => {
        if (coins) {
          logger.verbose('SendTransaction: Txn confirmed', { coinType });
          setCoinsConfirmed(true);
        } else {
          const cyError = new CyError(
            CysyncError.ADD_COIN_REJECTED,
            COINS[coinType].name
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
        }
      });

      sendTransaction.on('txnTooLarge', () => {
        const cyError = new CyError(CysyncError.SEND_TXN_SIZE_TOO_LARGE);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
      });

      sendTransaction.on('noWalletFound', (walletState: WalletStates) => {
        const cyError = flowHandlers.noWalletFound(walletState);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            coinType,
            walletState
          })
        );
      });

      sendTransaction.on('noWalletOnCard', () => {
        const cyError = new CyError(CysyncError.WALLET_NOT_FOUND_IN_CARD);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      });

      sendTransaction.on('totalFees', fee => {
        logger.info('SendTransaction: Total fee generated', { coinType, fee });
        setTotalFees(fee);
      });

      sendTransaction.on('inputOutput', ({ inputs, outputs }) => {
        logger.info('SendTransaction: Txn input output generated', {
          coinType,
          inputs,
          outputs
        });
        setTxnInputs(inputs);
        setTxnOutputs(outputs);
      });

      sendTransaction.on('insufficientFunds', funds => {
        if (funds) {
          const cyError = new CyError(
            WalletErrorType.INSUFFICIENT_FUNDS,
            COINS[coinType].name
          );
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, { coinType, funds })
          );
        }
      });

      // Verified receives `true` if verified, otherwise the index of the rejection screen
      sendTransaction.on('verified', val => {
        if (val === true) {
          logger.verbose('SendTransaction: Txn verified', { coinType });
          setVerified(true);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_REJECTED);

          logger.info('SendTransaction: Txn rejected from device', {
            coinType,
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

      sendTransaction.on('passphraseEntered', () => {
        logger.verbose('SendTransaction: Passphrase entered', { coinType });
        setPassphraseEntered(true);
      });

      sendTransaction.on('pinEntered', pin => {
        if (pin) {
          logger.verbose('SendTransaction: Pin entered', { coinType });
          setPinEntered(true);
        } else {
          const cyError = new CyError(
            CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType }));
        }
      });

      sendTransaction.on('cardsTapped', cards => {
        if (cards) {
          logger.verbose('SendTransaction: Cards tapped', { coinType });
          setCardsTapped(true);
        }
      });

      sendTransaction.on('metadataSent', () => {
        logger.verbose('SendTransaction: Metadata sent', { coinType });
        setMetadataSent(true);
      });

      sendTransaction.on('signedTxn', txn => {
        if (txn) {
          logger.verbose('SendTransaction: Signed txn generated', { coinType });
          setSignedTxn(txn);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
          cyError.pushSubErrors(CysyncError.SEND_TXN_SIGNED_TXN_NOT_FOUND);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, { txn, coinType })
          );
        }
      });

      // Why is this not treated as an error?
      sendTransaction.on('signatureVerify', ({ isVerified, index, error }) => {
        if (error) {
          logger.warn(
            `${CysyncError.SEND_TXN_VERIFICATION_FAILED} : Error in verifying txn signature.`
          );
          logger.warn(error);
          return;
        }

        if (isVerified) {
          logger.info('Txn signature verified successfully');
        } else {
          logger.warn(`Txn signature was not verified at input index ${index}`);
        }
      });

      try {
        setIsInFlow(true);
        /**
         * Error will be thrown in rare conditions where the implementation
         * itself has broken.
         */
        await sendTransaction.run({
          connection,
          sdkVersion,
          addressDB: addressDb,
          transactionDB: transactionDb,
          walletId,
          pinExists,
          passphraseExists,
          xpub,
          zpub,
          customAccount,
          newAccountId,
          coinType,
          outputList,
          fee: fees,
          isSendAll,
          data
        });
        setIsInFlow(false);
        logger.info('SendTransaction: Completed', { coinType });
        setCompleted(true);
      } catch (e) {
        setIsInFlow(false);
        const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinType, e }));
        sendTransaction.removeAllListeners();
      }
    };

  const cancelSendTxn = async (connection: DeviceConnection) => {
    setIsCancelled(true);
    return sendTransaction
      .cancel(connection)
      .then(canclled => {
        if (canclled) {
          logger.info('SendTransaction: Cancelled');
        }
      })
      .catch(e => {
        logger.error(
          `${CysyncError.SEND_TXN_CANCEL_FAILED} SendTransaction: Error in flow cancel`
        );
        logger.error(e);
      });
  };

  const onTxnBroadcast = ({
    walletId,
    coin,
    txHash,
    token
  }: {
    walletId: string;
    coin: string;
    txHash: string;
    token?: string;
  }) => {
    try {
      const coinObj = COINS[coin];
      if (!coinObj) {
        throw new Error(`Cannot find coinType: ${coin}`);
      }

      let tx: Transaction;
      let amount = new BigNumber(0);
      let fees = new BigNumber(0);
      const formattedInputs: InputOutput[] = [];
      const formattedOutputs: InputOutput[] = [];

      if (totalFees) {
        fees = new BigNumber(totalFees).multipliedBy(coinObj.multiplier);
      }

      if (txnInputs) {
        for (const [i, input] of txnInputs.entries()) {
          amount = amount.plus(new BigNumber(input.value));
          formattedInputs.push({
            address: input.address,
            indexNumber: i,
            value: String(input.value),
            isMine: input.isMine,
            type: IOtype.INPUT
          });
        }
      }

      if (txnOutputs) {
        for (const [i, output] of txnOutputs.entries()) {
          if (output.isMine) {
            amount = amount.minus(new BigNumber(output.value));
          }
          formattedOutputs.push({
            address: output.address,
            indexNumber: i,
            value: String(output.value),
            isMine: output.isMine,
            type: IOtype.OUTPUT
          });
        }
      }

      if (coinObj.group === CoinGroup.BitcoinForks) {
        if (totalFees) {
          amount = amount.minus(fees);
        }
      }

      if (token) {
        tx = {
          hash: txHash.toLowerCase(),
          amount: amount.toString(),
          total: amount.toString(),
          fees: fees.toString(),
          walletId,
          slug: token.toLowerCase(),
          confirmations: 0,
          status: 0,
          sentReceive: SentReceive.SENT,
          confirmed: new Date(),
          blockHeight: -1,
          coin,
          inputs: formattedInputs,
          outputs: formattedOutputs
        };
        const feeTxn: Transaction = {
          hash: txHash.toLowerCase(),
          amount: fees.toString(),
          total: fees.toString(),
          fees: '0',
          walletId,
          slug: coin.toLowerCase(),
          confirmations: 0,
          status: 0,
          sentReceive: SentReceive.FEES,
          confirmed: new Date(),
          blockHeight: -1,
          coin
        };
        transactionDb.insert(feeTxn);
      } else {
        tx = {
          hash: coin.toLowerCase() === 'near' ? txHash : txHash.toLowerCase(),
          amount: amount.toString(),
          total: amount.plus(fees).toString(),
          fees: fees.toString(),
          walletId,
          slug: coin.toLowerCase(),
          confirmations: 0,
          status: coin.toLowerCase() === 'near' ? 1 : 0,
          sentReceive: SentReceive.SENT,
          confirmed: new Date(),
          blockHeight: -1,
          inputs: formattedInputs,
          outputs: formattedOutputs
        };
      }
      transactionDb.insert(tx).then(() => {
        transactionDb.blockUTXOS(txnInputs, tx.slug, tx.walletId);
        logger.info('UTXOS blocked');
        logger.info(txnInputs);
      });
    } catch (error) {
      const cyError = new CyError(CysyncError.SEND_TXN_BROADCAST_FAILED);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { error }));
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
    handleSendTransaction,
    handleEstimateGasLimit,
    deviceConnected,
    setDeviceConnected,
    errorObj,
    clearErrorObj,
    completed,
    setCompleted,
    coinsConfirmed,
    verified,
    pinEntered,
    passphraseEntered,
    cardsTapped,
    signedTxn,
    metadataSent,
    hash,
    setHash,
    resetHooks,
    cancelSendTxn,
    totalFees,
    approxTotalFee,
    handleEstimateFee,
    sendMaxAmount,
    onTxnBroadcast,
    estimationError
  } as UseSendTransactionValues;
};
