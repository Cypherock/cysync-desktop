import {
  AbsCoinData,
  CoinData,
  CoinGroup,
  COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType,
  EthCoinData,
  EthCoinMap,
  ETHCOINS,
  FeatureName,
  isFeatureEnabled,
  NearCoinData,
  NearCoinMap,
  SolanaCoinData,
  SolanaCoinMap
} from '@cypherock/communication';
import {
  InputOutput,
  IOtype,
  SentReceive,
  Status,
  Transaction
} from '@cypherock/database';
import { TransactionSender, WalletStates } from '@cypherock/protocols';
import Server from '@cypherock/server-wrapper';
import { WalletError, WalletErrorType } from '@cypherock/wallet';
import bech32 from 'bech32';
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
import {
  accountDb,
  addressDb,
  DisplayCoin,
  transactionDb
} from '../../database';
import { useStatusCheck } from '../../provider/transactionStatusProvider';

import * as flowHandlers from './handlers';

const flowName = Analytics.Categories.SEND_TXN;

export const changeFormatOfOutputList = (
  targetList: any,
  parentCoinId: string,
  coinId: string
): Array<{ address: string; value?: BigNumber }> => {
  const coin = COINS[parentCoinId];

  if (!coin) {
    throw new Error(`Invalid coinId ${parentCoinId}`);
  }

  let multiplier = coin.multiplier;

  if (coinId && coin instanceof EthCoinData) {
    const tokenObj = coin.tokenList[coinId];

    if (!tokenObj) {
      throw new Error(`Invalid token ${coinId}, in ${parentCoinId}`);
    }

    multiplier = tokenObj.multiplier;
  }

  const list = targetList.map((rec: any) => {
    return {
      address: rec.recipient.trim(),

      value:
        rec.amount === undefined
          ? undefined
          : new BigNumber(rec.amount).multipliedBy(new BigNumber(multiplier))
    };
  });

  return list;
};

export const broadcastTxn = async (
  signedTxn: string,
  coinId: string
): Promise<string> => {
  const coin = COINS[coinId];

  if (!coin) {
    throw new Error(`Invalid coinId ${coinId}`);
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
    return resp.data.result;
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

    if (resp.data?.status?.SuccessValue === undefined)
      throw new Error('transaction-failed');

    return resp.data.transaction.hash;
  } else if (coin instanceof SolanaCoinData) {
    const resp = await Server.solana.transaction
      .broadcastTxn({
        transaction: signedTxn,
        network: coin.network
      })
      .request();

    if (resp.status === 0) {
      throw new Error('brodcast-failed');
    }

    if (resp.data.cysyncError) throw resp.data.cysyncError;

    if (resp.data?.signature === undefined)
      throw new Error('transaction-failed');

    return resp.data.signature;
  } else {
    const res = await Server.bitcoin.transaction
      .broadcastTxn({
        transaction: signedTxn,
        coinType: coin.abbr
      })
      .request();
    return res.data.tx.hash;
  }
};

export const verifyAddress = (address: string, coin: DisplayCoin) => {
  const coinDetails = COINS[coin.coinId];

  if (!coinDetails) {
    throw new Error(`Cannot find coin details for coin: ${coin}`);
  }

  if (coinDetails.group === CoinGroup.Near) {
    const regexImplicit = /^[a-f0-9]{64}$/;
    const regexRegistered =
      /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/; // any number of top level accounts are valid here
    return regexImplicit.test(address) || regexRegistered.test(address);
  }

  if (
    coinDetails.coinListId === ETHCOINS[EthCoinMap.harmony].coinListId &&
    address.startsWith('one1')
  ) {
    try {
      const { prefix } = bech32.decode(address);
      return prefix === 'one';
    } catch (e) {
      return false;
    }
  }
  const validatorCoinName =
    coinDetails.group === CoinGroup.Ethereum
      ? 'eth'
      : coinDetails.validatorCoinName;

  return WAValidator.validate(
    address,
    validatorCoinName,
    coinDetails.validatorNetworkType
  );
};

export enum TriggeredBy {
  SendFlow = 0,
  WalletConnect
}

export interface HandleSendTransactionOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
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
  data: {
    gasLimit: number;
    contractAddress?: string;
    contractAbbr?: string;
    contractData?: string;
    nonce?: string;
    subCoinId?: string;
  };
  onlySignature?: boolean;
  triggeredBy?: TriggeredBy;
}

export interface UseSendTransactionValues {
  handleSendTransaction: (
    options: HandleSendTransactionOptions
  ) => Promise<void>;
  handleEstimateGasLimit: (
    fromAddress: string,
    toAddress: string,
    network: string,
    amount: string,
    contractAddress?: string,
    data?: string
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
  signature: string;
  hash: string;
  setHash: React.Dispatch<React.SetStateAction<string>>;
  totalFees: string;
  approxTotalFee: number;
  sendMaxAmount: string;
  resetHooks: () => void;
  cancelSendTxn: (connection: DeviceConnection) => void;
  handleEstimateFee: (params: {
    xpub: string;
    coinId: string;
    accountId: string;
    accountIndex: number;
    accountType: string;
    outputList: any[];
    fees: number;
    isSendAll: boolean | undefined;
    data?: {
      gasLimit: number;
      contractAddress?: string;
      contractAbbr?: string;
      subCoinId?: string;
    };
    customAccount: string | undefined;
  }) => Promise<void>;
  onTxnBroadcast: (params: {
    walletId: string;
    accountId: string;
    coinId: string;
    parentCoinId?: string;
    txHash: string;
  }) => void;
  onAddAccountTxnBroadcast: (params: {
    walletId: string;
    coinId: string;
    txHash: string;
    accountId: string;
  }) => void;
  estimationError: CyError;
  isEstimatingFees: boolean;
  setIsEstimatingFees: (val: boolean) => void;
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
  const [signature, setSignature] = useState('');
  const [hash, setHash] = useState('');
  const [metadataSent, setMetadataSent] = useState(false);
  const sendTransaction = new TransactionSender();
  const [totalFees, setTotalFees] = useState('0');
  const [txnInputs, setTxnInputs] = useState<TxInputOutput[]>([]);
  const [txnOutputs, setTxnOutputs] = useState<TxInputOutput[]>([]);
  const [approxTotalFee, setApproxTotalFees] = useState(0);
  const [sendMaxAmount, setSendMaxAmount] = useState('0');
  const [isCancelled, setIsCancelled] = useState(false);

  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const [estimationError, setEstimationError] = useState<CyError>(
    new CyError()
  );
  const [isEstimatingFees, setIsEstimatingFees] = useState(false);
  const { addTransactionStatusCheckItem } = useStatusCheck();

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
    setIsEstimatingFees(false);
    setTotalFees('0');
    setSendMaxAmount('0');
    sendTransaction.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    clearErrorObj();
    resetHooks();
  };

  const handleEstimateFee: UseSendTransactionValues['handleEstimateFee'] =
    async ({
      xpub,
      coinId,
      accountId,
      accountIndex,
      accountType,
      outputList,
      fees,
      isSendAll,
      data,
      customAccount
    }) => {
      // If it has no input, then set the tx fee and amount to 0.
      if (!isSendAll && outputList.length > 0) {
        let hasInput = false;
        for (const output of outputList) {
          if (output.value && (output.value as BigNumber).isGreaterThan(0)) {
            hasInput = true;
          }
        }

        const coin = COINS[coinId];

        if (!coin) {
          throw new Error(`Invalid coinType ${coinId}`);
        }

        if (coin.group !== CoinGroup.Ethereum && !hasInput) {
          setApproxTotalFees(0);
          setSendMaxAmount('0');
          setEstimationError(undefined);
          setIsEstimatingFees(false);
          return;
        }
      }
      setIsEstimatingFees(true);

      const subFlowName = Analytics.Categories.ESTIMATE_FEE;
      logger.info(
        `${subFlowName}: Initiated , ${[coinId, fees, isSendAll].join(',')}`
      );

      sendTransaction.on('approxTotalFee', fee => {
        logger.verbose(`${subFlowName}: Total fee generated , ${coinId}`);
        setApproxTotalFees(Number(fee));
      });

      sendTransaction.on('sendMaxAmount', amt => {
        logger.verbose(
          `${subFlowName}: Send Max amount generated: ${[amt, coinId].join(
            ','
          )}`
        );
        setSendMaxAmount(amt);
      });

      const { walletId } = await accountDb.getOne({ accountId });
      sendTransaction
        .calcApproxFee({
          xpub,
          accountId,
          accountIndex,
          accountType,
          coinId,
          walletId,
          outputList,
          fee: fees,
          isSendAll,
          data,
          transactionDB: transactionDb,
          customAccount
        })
        .then(() => {
          setEstimationError(undefined);
          setIsEstimatingFees(false);
          logger.info(`${subFlowName}: Completed', ${coinId}`);
        })
        .catch(error => {
          logger.info(`${subFlowName}: Error', ${coinId}`);
          logger.error(error);
          const cyError = new CyError();
          // Don't show error other than network error, because the data may be
          // insufficient for the calculation
          if (error.isAxiosError) {
            handleAxiosErrors(cyError, error);
            setErrorObj(handleErrors(errorObj, cyError, subFlowName));
            return;
          } else if (error instanceof WalletError) {
            handleWalletErrors(cyError, error, { coinId });
          } else {
            cyError.setError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
          }
          setEstimationError(
            handleErrors(estimationError, cyError, subFlowName, { error })
          );
          setIsEstimatingFees(false);
        });
    };

  const handleEstimateGasLimit = async (
    fromAddress: string,
    toAddress: string,
    network: string,
    amount: string,
    contractAddress?: string,
    data?: string
  ) => {
    return new Promise(resolve => {
      const subFlowName = Analytics.Categories.ESTIMATE_GAS_LIMIT;
      logger.info(`${subFlowName}: Initiated', ${contractAddress}`);
      (data
        ? Server.eth.transaction.getEstimatedGas({
            from: fromAddress,
            to: toAddress,
            network,
            amount,
            data
          })
        : Server.eth.transaction.getContractFees({
            fromAddress,
            toAddress: toAddress.trim(),
            network,
            contractAddress,
            amount,
            responseType: 'v2'
          })
      )
        .request()
        .then(res => {
          logger.info(`${subFlowName}: Completed', ${contractAddress}`);
          if (res?.data?.fees === undefined)
            throw new Error('Invalid Response');
          resolve(res.data.fees);
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
          setErrorObj(handleErrors(errorObj, cyError, subFlowName, { err: e }));
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
      accountId,
      accountType,
      accountIndex,
      customAccount,
      newAccountId,
      coinId,
      outputList,
      fees,
      isSendAll,
      data,
      onlySignature,
      triggeredBy
    }) => {
      clearAll();

      logger.info('SendTransaction: Initiated', { coinId });
      logger.info('SendTransaction Data', {
        walletId,
        pinExists,
        coinId,
        outputList,
        fees,
        isSendAll,
        data,
        onlySignature,
        triggeredBy
      });
      logger.debug('SendTransaction Xpub', {
        xpub
      });

      if (!connection) {
        const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
        return;
      }

      if (
        !isFeatureEnabled(FeatureName.WalletConnectSupport, sdkVersion) &&
        triggeredBy === TriggeredBy.WalletConnect
      ) {
        const cyError = new CyError(DeviceErrorType.FEATURE_NOT_SUPPORTED);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, { coinId, sdkVersion })
        );
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
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      });

      sendTransaction.on('error', err => {
        const cyError = new CyError();
        if (err instanceof WalletError) {
          handleWalletErrors(cyError, err, { coinId });
        } else if (err.isAxiosError) {
          handleAxiosErrors(cyError, err);
        } else if (err instanceof DeviceError) {
          handleDeviceErrors(cyError, err, flowName);
        } else {
          cyError.setError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
        }
        setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
      });

      sendTransaction.on('locked', () => {
        const cyError = new CyError(CysyncError.WALLET_IS_LOCKED);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      });

      sendTransaction.on('notReady', () => {
        const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      });

      sendTransaction.on('coinsConfirmed', coins => {
        if (coins) {
          logger.verbose('SendTransaction: Txn confirmed', { coinId });
          setCoinsConfirmed(true);
        } else {
          const cyError = new CyError(
            CysyncError.SEND_TXN_REJECTED,
            COINS[coinId].name
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
        }
      });

      sendTransaction.on('txnTooLarge', () => {
        const cyError = new CyError(CysyncError.SEND_TXN_SIZE_TOO_LARGE);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      });

      sendTransaction.on('noWalletFound', (walletState: WalletStates) => {
        const cyError = flowHandlers.noWalletFound(walletState);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            coinId,
            walletState
          })
        );
      });

      sendTransaction.on('noWalletOnCard', () => {
        const cyError = new CyError(CysyncError.WALLET_NOT_FOUND_IN_CARD);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      });

      sendTransaction.on('totalFees', fee => {
        logger.info('SendTransaction: Total fee generated', { coinId, fee });
        setTotalFees(fee);
      });

      sendTransaction.on('inputOutput', ({ inputs, outputs }) => {
        logger.info('SendTransaction: Txn input output generated', {
          coinId,
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
            COINS[coinId].name
          );
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, { coinId, funds })
          );
        }
      });

      // Verified receives `true` if verified, otherwise the index of the rejection screen
      sendTransaction.on('verified', val => {
        if (val === true) {
          logger.verbose('SendTransaction: Txn verified', { coinId });
          setVerified(true);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_REJECTED);

          logger.info('SendTransaction: Txn rejected from device', {
            coinId,
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
        logger.verbose('SendTransaction: Passphrase entered', { coinId });
        setPassphraseEntered(true);
      });

      sendTransaction.on('pinEntered', pin => {
        if (pin) {
          logger.verbose('SendTransaction: Pin entered', { coinId });
          setPinEntered(true);
        } else {
          const cyError = new CyError(
            CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
        }
      });

      sendTransaction.on('cardsTapped', cards => {
        if (cards) {
          logger.verbose('SendTransaction: Cards tapped', { coinId });
          setCardsTapped(true);
        }
      });

      sendTransaction.on('metadataSent', () => {
        logger.verbose('SendTransaction: Metadata sent', { coinId });
        setMetadataSent(true);
      });

      sendTransaction.on('signature', sig => {
        if (sig) {
          logger.verbose('SendTransaction: Signature generated', { coinId });
          setSignature(sig);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
          cyError.pushSubErrors(CysyncError.SEND_TXN_SIGNED_TXN_NOT_FOUND);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, { txn: sig, coinId })
          );
        }
      });

      sendTransaction.on('signedTxn', txn => {
        if (txn) {
          logger.verbose('SendTransaction: Signed txn generated', { coinId });
          setSignedTxn(txn);
        } else {
          const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
          cyError.pushSubErrors(CysyncError.SEND_TXN_SIGNED_TXN_NOT_FOUND);
          setErrorObj(
            handleErrors(errorObj, cyError, flowName, { txn, coinId })
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
          coinId,
          accountId,
          accountIndex,
          accountType,
          sdkVersion,
          addressDB: addressDb,
          transactionDB: transactionDb,
          walletId,
          pinExists,
          passphraseExists,
          xpub,
          customAccount,
          newAccountId,
          outputList,
          fee: fees,
          isSendAll,
          data,
          onlySignature
        });
        setIsInFlow(false);
        logger.info('SendTransaction: Completed', { coinId });
        setCompleted(true);
      } catch (e) {
        setIsInFlow(false);
        const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId, e }));
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

  const onTxnBroadcast: UseSendTransactionValues['onTxnBroadcast'] = ({
    walletId,
    accountId,
    parentCoinId,
    coinId,
    txHash
  }) => {
    try {
      let parentCoinObj: CoinData;
      let coinObj: AbsCoinData;
      let isSub = false;

      if (parentCoinId && parentCoinId !== coinId) {
        parentCoinObj = COINS[parentCoinId];
        if (!parentCoinId) {
          throw new Error(`Cannot find coinId: ${parentCoinId}`);
        }

        coinObj = parentCoinObj.tokenList[coinId];
        isSub = true;
      } else {
        coinObj = COINS[coinId];
      }

      if (!coinObj) {
        throw new Error(`Cannot find coinId: ${coinId}`);
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

      if (isSub) {
        tx = {
          coinId,
          accountId,
          parentCoinId,
          isSub,
          hash: txHash,
          amount: amount.toString(),
          total: amount.toString(),
          fees: fees.toString(),
          walletId,
          confirmations: 0,
          status: 0,
          sentReceive: SentReceive.SENT,
          confirmed: new Date().toISOString(),
          blockHeight: -1,
          inputs: formattedInputs,
          outputs: formattedOutputs
        };
        const feeTxn: Transaction = {
          coinId: parentCoinId,
          accountId,
          parentCoinId,
          isSub: false,
          hash: txHash,
          amount: fees.toString(),
          total: fees.toString(),
          fees: '0',
          walletId,
          confirmations: 0,
          status: 0,
          sentReceive: SentReceive.FEES,
          confirmed: new Date().toISOString(),
          blockHeight: -1
        };
        transactionDb.insert(feeTxn);
      } else {
        tx = {
          coinId,
          accountId,
          parentCoinId: coinId,
          isSub: false,
          hash: txHash,
          customIdentifier:
            coinId === NearCoinMap.near
              ? formattedInputs[0].address
              : undefined,
          type:
            coinId === NearCoinMap.near || coinId === SolanaCoinMap.solana
              ? 'TRANSFER'
              : undefined,
          amount: amount.toString(),
          total: amount.plus(fees).toString(),
          fees: fees.toString(),
          walletId,
          confirmations: coinId === NearCoinMap.near ? 1 : 0,
          status: coinId === NearCoinMap.near ? Status.SUCCESS : Status.PENDING, // Near failed txn handled already
          sentReceive: SentReceive.SENT,
          confirmed: new Date().toISOString(),
          blockHeight: -1,
          inputs: formattedInputs,
          outputs: formattedOutputs
        };
      }
      transactionDb.insert(tx).then(() => {
        if (tx.status === Status.PENDING) {
          addTransactionStatusCheckItem(tx);
        }
        transactionDb.blockUTXOS(txnInputs, tx.accountId);
        logger.info('UTXOS blocked');
        logger.info(txnInputs);
      });
    } catch (error) {
      const cyError = new CyError(CysyncError.SEND_TXN_BROADCAST_FAILED);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { error }));
    }
  };

  const onAddAccountTxnBroadcast: UseSendTransactionValues['onAddAccountTxnBroadcast'] =
    ({ walletId, coinId, txHash, accountId }) => {
      try {
        const coinObj = COINS[coinId];
        if (!coinObj) {
          throw new Error(`Cannot find coinId: ${coinId}`);
        }

        let amount = new BigNumber(0);
        const fees = new BigNumber(0.0012).multipliedBy(coinObj.multiplier); // near function-call hardcoded fees
        const formattedInputs: InputOutput[] = [];
        const formattedOutputs: InputOutput[] = [];

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

        const tx: Transaction = {
          accountId,
          coinId,
          parentCoinId: coinId,
          isSub: false,
          hash: txHash,
          amount: amount.toString(),
          total: amount.plus(fees).toString(),
          fees: fees.toString(),
          customIdentifier:
            coinId === NearCoinMap.near
              ? formattedInputs[0].address
              : undefined,
          type: coinId === NearCoinMap.near ? 'FUNCTION_CALL' : undefined,
          description:
            coinId === NearCoinMap.near
              ? `Created account ${formattedOutputs[0]?.address}`
              : undefined,
          walletId,
          confirmations: 1,
          status: Status.SUCCESS,
          sentReceive: SentReceive.SENT,
          confirmed: new Date().toISOString(),
          blockHeight: -1,
          inputs: formattedInputs,
          outputs: formattedOutputs
        };

        transactionDb.insert(tx).then(() => {
          if (tx.status === Status.PENDING) addTransactionStatusCheckItem(tx);
          transactionDb.blockUTXOS(txnInputs, tx.accountId);
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
    signature,
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
    onAddAccountTxnBroadcast,
    estimationError,
    isEstimatingFees,
    setIsEstimatingFees
  };
};
