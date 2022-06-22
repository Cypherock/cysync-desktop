import {
  ALLCOINS as COINS,
  CoinGroup,
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
import { TransactionSender } from '@cypherock/protocols';
import Server from '@cypherock/server-wrapper';
import { WalletError, WalletErrorType } from '@cypherock/wallet';
import BigNumber from 'bignumber.js';
import WAValidator from 'multicoin-address-validator';
import { useEffect, useState } from 'react';

import logger from '../../../utils/logger';
import { addressDb, coinDb, transactionDb } from '../../database';
import { useI18n } from '../../provider';

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

  if (coinDetails.group === coinGroup.Near) {
    const regex =
      coinDetails.validatorNetworkType === 'testnet'
        ? /^([a-z0-9]{2,56}[-_]?)+\.testnet$|^[a-f0-9]{64}$/
        : /^([a-z0-9]{2,59}[-_]?)+\.near$|^[a-f0-9]{64}$/;
    return regex.test(address);
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
    amount: number
  ) => Promise<any>;
  deviceConnected: boolean;
  setDeviceConnected: React.Dispatch<React.SetStateAction<boolean>>;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
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
  sendMaxAmount: number;
  resetHooks: () => void;
  cancelSendTxn: (connection: DeviceConnection) => void;
  handleEstimateFee: (
    xpub: string,
    zpub: string | undefined,
    coinType: string,
    outputList: any[],
    fees: number,
    isSendAll: boolean | undefined,
    data: any
  ) => Promise<void>;
  onTxnBroadcast: (params: {
    walletId: string;
    coin: string;
    txHash: string;
    token?: string;
  }) => void;
  estimationError: string;
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
  const [externalErrorMsg, setExternalErrorMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hash, setHash] = useState('');
  const [metadataSent, setMetadataSent] = useState(false);
  const sendTransaction = new TransactionSender();
  const [totalFees, setTotalFees] = useState(0);
  const [txnInputs, setTxnInputs] = useState<TxInputOutput[]>([]);
  const [txnOutputs, setTxnOutputs] = useState<TxInputOutput[]>([]);
  const [approxTotalFee, setApproxTotalFees] = useState(0);
  const [sendMaxAmount, setSendMaxAmount] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [estimationError, setEstimationError] = useState(undefined);

  const { langStrings } = useI18n();

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
    setSendMaxAmount(0);
    sendTransaction.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    setErrorMessage('');
    setExternalErrorMsg('');
    resetHooks();
  };

  const handleEstimateFee: UseSendTransactionValues['handleEstimateFee'] =
    async (xpub, zpub, coinType, outputList, fees, isSendAll, data) => {
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
          setSendMaxAmount(0);
          setEstimationError(undefined);
          return;
        }
      }

      logger.info('EstimateFee: Initiated', { coinType, fees, isSendAll });

      sendTransaction.on('approxTotalFee', fee => {
        logger.verbose('EstimateFee: Total fee generated', { coinType });
        setApproxTotalFees(Number(fee));
      });

      sendTransaction.on('sendMaxAmount', amt => {
        logger.verbose('EstimateFee: Send Max amount generated', { coinType });
        setSendMaxAmount(Number(amt));
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
          data
        )
        .then(() => {
          setEstimationError(undefined);
          logger.info('EstimateFee: Completed', { coinType });
        })
        .catch(error => {
          logger.info('EstimateFee: Error', { coinType });
          logger.error(error);
          // Don't show error other than network error, because the data may be
          // insufficient for the calculation
          if (error.isAxiosError) {
            if (error.response) {
              setErrorMessage(langStrings.ERRORS.NETWORK_ERROR);
            } else {
              setErrorMessage(
                langStrings.ERRORS.NETWORK_ERROR_WITH_NO_RESPONSE
              );
            }
          } else {
            if (error instanceof WalletError)
              setEstimationError(
                langStrings.ERRORS.SEND_TXN_SUFFICIENT_CONFIRMED_BALANCE
              );
            else if (error.errorType === WalletErrorType.INSUFFICIENT_FUNDS)
              setEstimationError(
                langStrings.ERRORS.SEND_TXN_INSUFFICIENT_BALANCE(coinType)
              );
            else setEstimationError(error.message);
          }
        });
    };

  const handleEstimateGasLimit = async (
    fromAddress: string,
    toAddress: string,
    network: string,
    contractAddress: string,
    amount: number
  ) => {
    return new Promise(resolve => {
      logger.info('EstimateGasLimit: Initiated', { contractAddress });
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
          logger.info('EstimateGasLimit: Completed', { contractAddress });
          resolve(res.data);
        })
        .catch(e => {
          logger.info('EstimateGasLimit: Error', { contractAddress });
          logger.error(e);
          // Don't show any other error because it may be due to
          // incorrect amount or address which the user may change.
          if (e.isAxiosError && !e.response) {
            setErrorMessage(langStrings.ERRORS.NETWORK_ERROR_WITH_NO_RESPONSE);
          }
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
        logger.error('SendTransaction: Failed - Device not connected', {
          coinType
        });
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
        return;
      }

      sendTransaction.on('connectionOpen', () => {
        logger.info('SendTransaction: Connection Opened');
      });

      sendTransaction.on('connectionClose', () => {
        logger.info('SendTransaction: Connection Closed');
      });

      sendTransaction.on('cardError', () => {
        logger.error('SendTransaction: Card Error', { coinType });
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      });

      sendTransaction.on('error', err => {
        logger.error('SendTransaction: Error occurred', { coinType });
        logger.error(err);
        if (
          err instanceof WalletError &&
          err.errorType === WalletErrorType.INSUFFICIENT_FUNDS
        ) {
          setErrorMessage(
            langStrings.ERRORS.SEND_TXN_INSUFFICIENT_BALANCE(
              COINS[coinType].name
            )
          );
        } else if (err.isAxiosError) {
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

      sendTransaction.on('locked', () => {
        logger.info('SendTransaction: Wallet Locked', { coinType });
        setErrorMessage(langStrings.ERRORS.WALLET_LOCKED);
      });

      sendTransaction.on('notReady', () => {
        logger.info('SendTransaction: Device Locked', { coinType });
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
      });

      sendTransaction.on('coinsConfirmed', coins => {
        if (coins) {
          logger.verbose('SendTransaction: Txn confirmed', { coinType });
          setCoinsConfirmed(true);
        } else {
          logger.info('SendTransaction: Txn rejected from device', {
            coinType
          });
          setErrorMessage(
            langStrings.ERRORS.SEND_TXN_REJECTED(COINS[coinType].name)
          );
        }
      });

      sendTransaction.on('txnTooLarge', () => {
        logger.info('SendTransaction: Txn Too large', { coinType });
        setErrorMessage(langStrings.ERRORS.SEND_TXN_SIZE_TOO_LARGE);
      });

      sendTransaction.on('noWalletFound', (inPartialState: boolean) => {
        logger.info('SendTransaction: Wallet not found', {
          coinType,
          inPartialState
        });
        if (inPartialState) {
          setErrorMessage(langStrings.ERRORS.WALLET_PARTIAL_STATE);
        } else {
          setErrorMessage(langStrings.ERRORS.WALLET_NOT_FOUND);
        }
      });

      sendTransaction.on('noWalletOnCard', () => {
        logger.info('SendTransaction: No Wallet on card', { coinType });
        setErrorMessage(langStrings.ERRORS.WALLET_NOT_ON_CARD);
      });

      sendTransaction.on('totalFees', fee => {
        logger.info('SendTransaction: Total fee generated', { coinType, fee });
        setTotalFees(fee);
      });

      sendTransaction.on('sendMaxAmount', amt => {
        logger.info('SendTransaction: Send Max amount generated', {
          coinType,
          amt
        });
        setSendMaxAmount(Number(amt));
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
          logger.info('SendTransaction: Not enough funds', { coinType });
          setErrorMessage(
            langStrings.ERRORS.SEND_TXN_INSUFFICIENT_BALANCE(
              COINS[coinType].name
            )
          );
        }
      });

      // Verified receives `true` if verified, otherwise the index of the rejection screen
      sendTransaction.on('verified', val => {
        if (val === true) {
          logger.verbose('SendTransaction: Txn verified', { coinType });
          setVerified(true);
        } else {
          logger.info('SendTransaction: Txn rejected from device', {
            coinType,
            command: val
          });
          setErrorMessage(langStrings.ERRORS.SEND_TXN_REJECTED);

          if (val === 0) {
            logger.info('SendTransaction: Txn was rejected on address screen');
          } else if (val === 2) {
            logger.info('SendTransaction: Txn was rejected on amount screen');
          } else if (val === 3) {
            logger.info('SendTransaction: Txn was rejected on fee screen');
          } else {
            logger.info('SendTransaction: Txn was rejected on unknown screen');
          }
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
          logger.info('SendTransaction: Pin incorrect', { coinType });
          setErrorMessage(
            langStrings.ERRORS.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
          );
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
          logger.info('SendTransaction: Signed txn not found', { coinType });
          setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
        }
      });

      sendTransaction.on('signatureVerify', ({ isVerified, index, error }) => {
        if (error) {
          logger.warn('Error in verifying txn signature.');
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
          walletId,
          pinExists,
          passphraseExists,
          xpub,
          zpub,
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
        logger.error('SendTransaction: Error', { coinType });
        logger.error(e);
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
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
        logger.error('SendTransaction: Error in flow cancel');
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
          hash: txHash.toLowerCase(),
          amount: amount.toString(),
          total: amount.plus(fees).toString(),
          fees: fees.toString(),
          walletId,
          slug: coin.toLowerCase(),
          confirmations: 0,
          status: 0,
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
      logger.error('Error in onTxnBroadcast');
      logger.error(error);
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
    handleSendTransaction,
    handleEstimateGasLimit,
    deviceConnected,
    setDeviceConnected,
    errorMessage: externalErrorMsg,
    setErrorMessage: onSetErrorMsg,
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
