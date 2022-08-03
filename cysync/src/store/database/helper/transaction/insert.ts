import {
  BtcCoinData,
  CoinGroup,
  COINS,
  EthCoinData
} from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

import logger from '../../../../utils/logger';
import { transactionDb } from '../../databaseInit';
import {
  AddressDB,
  InputOutput,
  IOtype,
  SentReceive,
  Status,
  Transaction
} from '../../index';

export const insertFromFullTxn = async (transaction: {
  txn: any;
  xpub: string;
  addresses: any[];
  walletId: string;
  coinType: string;
  addressDB: AddressDB;
  walletName?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
}) => {
  const {
    txn,
    xpub,
    addresses,
    walletId,
    walletName,
    coinType,
    addressDB,
    status
  } = transaction;

  let statusCode: Status;

  if (status) {
    statusCode = status === 'PENDING' ? 0 : status === 'SUCCESS' ? 1 : 2;
  } else {
    if (txn.confirmations && txn.confirmations >= 1) {
      statusCode = 1;
    } else {
      statusCode = 0;
    }
  }

  const coin = COINS[coinType.toLowerCase()];
  if (!coin) {
    throw new Error('Invalid coin');
  }

  if (coin instanceof BtcCoinData) {
    let myAddresses: string[] = [];

    if (addresses && addresses.length > 0) {
      myAddresses = addresses;
    }

    // Get all addresses of that xpub and coin
    // This is because the address from the API is of only 1 wallet,
    // Whereas there are 2 (or 4 in case od BTC & BTCT) wallets.
    const addressFromDB = await addressDB.getAll({ walletId, coinType });

    if (addressFromDB && addressFromDB.length > 0) {
      myAddresses = myAddresses.concat(
        addressFromDB.map(elem => {
          if (elem?.address) return elem.address;
          return '';
        })
      );
    }

    let inputs: InputOutput[] = [];
    let outputs: InputOutput[] = [];
    let totalValue = new BigNumber(0);
    let sentReceive: SentReceive;

    if (txn.inputs && txn.inputs.length > 0) {
      inputs = txn.inputs.map((elem: any, i: number) => {
        return {
          address: elem.addresses ? elem.addresses[0] : '',
          value: String(elem.output_value),
          indexNumber: i,
          isMine: elem.addresses
            ? myAddresses.includes(elem.addresses[0])
            : false
        } as InputOutput;
      });
    }

    if (txn.outputs && txn.outputs.length > 0) {
      outputs = txn.outputs.map((elem: any, i: number) => {
        return {
          address: elem.addresses ? elem.addresses[0] : '',
          value: String(elem.value),
          indexNumber: i,
          isMine: elem.addresses
            ? myAddresses.includes(elem.addresses[0])
            : false
        } as InputOutput;
      });
    }

    const existingTxns = await transactionDb.getAll({
      hash: txn.hash,
      walletId,
      slug: coinType
    });

    if (existingTxns && existingTxns.length > 0) {
      const existingTxn = existingTxns[0];
      const prevInputs = existingTxn.inputs;
      const prevOutputs = existingTxn.outputs;

      if (prevInputs && prevInputs.length > 0) {
        for (const input of prevInputs) {
          const index = inputs.findIndex(
            elem => elem.indexNumber === input.indexNumber
          );

          if (input.isMine) {
            inputs[index].isMine = true;
          }
        }
      }

      if (prevOutputs && prevOutputs.length > 0) {
        for (const output of prevOutputs) {
          const index = outputs.findIndex(
            elem => elem.indexNumber === output.indexNumber
          );

          if (output.isMine) {
            outputs[index].isMine = true;
          }
        }
      }
    }

    for (const input of inputs) {
      if (input.isMine) {
        totalValue = totalValue.minus(new BigNumber(input.value));
      }
    }

    for (const output of outputs) {
      if (output.isMine) {
        totalValue = totalValue.plus(new BigNumber(output.value));
      }
    }

    if (totalValue.isGreaterThan(0)) {
      sentReceive = SentReceive.RECEIVED;
    } else {
      sentReceive = SentReceive.SENT;
      totalValue = totalValue.plus(new BigNumber(txn.fees));
    }

    const newTxn: Transaction = {
      hash: txn.hash,
      total: String(txn.total),
      fees: String(txn.fees),
      amount: totalValue.absoluteValue().toString(),
      confirmations: txn.confirmations || 0,
      walletId,
      walletName,
      slug: coinType,
      sentReceive,
      status: statusCode,
      confirmed: new Date(txn.confirmed),
      blockHeight: txn.block_height,
      inputs,
      outputs
    };

    // Update the confirmations of txns with same hash
    await transactionDb.findAndUpdate(
      { hash: txn.hash, walletId },
      {
        confirmations: newTxn.confirmations,
        blockHeight: newTxn.blockHeight,
        status: newTxn.status
      }
    );
    await transactionDb.insert(newTxn);
  } else if (coin instanceof EthCoinData) {
    // Derive address from Xpub (It'll always give a mixed case address with checksum)
    const myAddress =
      utils.HDNode.fromExtendedKey(xpub).derivePath(`0/0`).address;

    const amount = new BigNumber(txn.value);
    const fromAddr = txn.from;
    const inputs: InputOutput[] = [
      {
        address: txn.from.toLowerCase(),
        value: amount.toString(),
        isMine: txn.from.toLowerCase() === myAddress.toLowerCase(),
        indexNumber: 0,
        type: IOtype.INPUT
      }
    ];
    const outputs: InputOutput[] = [
      {
        address: txn.to.toLowerCase(),
        value: amount.toString(),
        isMine: txn.to.toLowerCase() === myAddress.toLowerCase(),
        indexNumber: 0,
        type: IOtype.OUTPUT
      }
    ];

    let token: string | undefined;

    const fees = new BigNumber(txn.gasUsed || txn.gas || 0).multipliedBy(
      txn.gasPrice || 0
    );

    if (txn.isErc20Token) {
      token = txn.tokenAbbr;

      if (!token) {
        logger.warn('Token abbr is not present in ERC20 Transaction');
        return;
      }

      const tokenData = coin.tokenList[token];
      if (!tokenData || tokenData.group !== CoinGroup.ERC20Tokens) {
        logger.warn('Invalid tokenAbbr in transaction', { token });
        return;
      }

      const feeTxn: Transaction = {
        hash: txn.hash,
        amount: fees.toString(),
        fees: '0',
        total: fees.toString(),
        confirmations: txn.confirmations || 0,
        walletId,
        coin: coinType,
        // 2 for failed, 1 for pass
        status: txn.isError ? 2 : 1,
        sentReceive: SentReceive.FEES,
        confirmed: new Date(txn.timeStamp),
        blockHeight: txn.blockNumber,
        slug: coinType,
        inputs: [],
        outputs: []
      };

      await transactionDb.insert(feeTxn);
    }

    const newTxn: Transaction = {
      hash: txn.hash,
      amount: amount.toString(),
      fees: fees.toString(),
      total: token ? amount.toString() : amount.plus(fees).toString(),
      confirmations: txn.confirmations || 0,
      walletId,
      slug: token ? token : coinType,
      // 2 for failed, 1 for pass
      status: txn.isError ? 2 : 1,
      sentReceive:
        myAddress.toLowerCase() === fromAddr.toLowerCase()
          ? SentReceive.SENT
          : SentReceive.RECEIVED,
      confirmed: new Date(txn.timeStamp),
      blockHeight: txn.blockNumber,
      coin: coinType,
      inputs,
      outputs
    };

    await transactionDb.insert(newTxn);
  }
};

export const prepareFromBlockbookTxn = async (transaction: {
  txn: any;
  xpub: string;
  addresses: any[];
  walletId: string;
  coinType: string;
  addressDB: AddressDB;
  walletName?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
}): Promise<Transaction> => {
  const {
    txn,
    xpub,
    addresses,
    walletId,
    walletName,
    coinType,
    addressDB,
    status
  } = transaction;

  let statusCode: number;

  if (status) {
    statusCode = status === 'PENDING' ? 0 : status === 'SUCCESS' ? 1 : 2;
  } else {
    if (txn.confirmations && txn.confirmations >= 1) {
      statusCode = 1;
    } else {
      statusCode = 0;
    }
  }

  const coin = COINS[coinType.toLowerCase()];
  if (!coin) {
    throw new Error('Invalid coin');
  }

  if (coin instanceof BtcCoinData) {
    let myAddresses: string[] = [];

    if (addresses && addresses.length > 0) {
      myAddresses = addresses;
    }

    // Get all addresses of that xpub and coin
    // This is because the address from the API is of only 1 wallet,
    // Whereas there are 2 (or 4 in case od BTC & BTCT) wallets.
    const addressFromDB = await addressDB.getAll({ walletId, coinType });

    if (addressFromDB && addressFromDB.length > 0) {
      myAddresses = myAddresses.concat(
        addressFromDB.map(elem => {
          if (elem) return elem.address;
          return '';
        })
      );
    }

    let inputs: InputOutput[] = [];
    let outputs: InputOutput[] = [];
    let totalValue = new BigNumber(0);
    let sentReceive: SentReceive;

    if (txn.vin && txn.vin.length > 0) {
      inputs = txn.vin.map((elem: any, i: number) => {
        return {
          address: elem.isAddress && elem.addresses ? elem.addresses[0] : '',
          value: String(elem.value),
          indexNumber: i,
          isMine:
            elem.isAddress && elem.addresses
              ? myAddresses.includes(elem.addresses[0])
              : false
        } as InputOutput;
      });
    }

    if (txn.vout && txn.vout.length > 0) {
      outputs = txn.vout.map((elem: any, i: number) => {
        return {
          address: elem.isAddress && elem.addresses ? elem.addresses[0] : '',
          value: String(elem.value),
          indexNumber: i,
          isMine:
            elem.isAddress && elem.addresses
              ? myAddresses.includes(elem.addresses[0])
              : false
        } as InputOutput;
      });
    }

    const existingTxns = await transactionDb.getAll({
      hash: txn.txid,
      walletId,
      slug: coinType
    });

    if (existingTxns && existingTxns.length > 0) {
      const existingTxn = existingTxns[0];
      const prevInputs = existingTxn.inputs;
      const prevOutputs = existingTxn.outputs;

      if (prevInputs && prevInputs.length > 0) {
        for (const input of prevInputs) {
          const index = inputs.findIndex(
            elem => elem.indexNumber === input.indexNumber
          );

          if (input.isMine) {
            inputs[index].isMine = true;
          }
        }
      }

      if (prevOutputs && prevOutputs.length > 0) {
        for (const output of prevOutputs) {
          const index = outputs.findIndex(
            elem => elem.indexNumber === output.indexNumber
          );

          if (output.isMine) {
            outputs[index].isMine = true;
          }
        }
      }
    }

    for (const input of inputs) {
      if (input.isMine) {
        totalValue = totalValue.minus(new BigNumber(input.value));
      }
    }

    for (const output of outputs) {
      if (output.isMine) {
        totalValue = totalValue.plus(new BigNumber(output.value));
      }
    }

    if (totalValue.isGreaterThan(0)) {
      sentReceive = SentReceive.RECEIVED;
    } else {
      sentReceive = SentReceive.SENT;
      totalValue = totalValue.plus(new BigNumber(txn.fees));
    }

    let confirmed = new Date();

    if (txn.blockTime) {
      confirmed = new Date(txn.blockTime * 1000);
    }

    const newTxn: Transaction = {
      hash: txn.txid,
      total: String(txn.value),
      fees: String(txn.fees),
      amount: totalValue.absoluteValue().toString(),
      confirmations: txn.confirmations || 0,
      walletId,
      walletName,
      slug: coinType,
      sentReceive,
      status: statusCode,
      confirmed,
      blockHeight: txn.blockHeight,
      inputs,
      outputs
    };

    // Update the confirmations of txns with same hash
    if (existingTxns && existingTxns.length > 0) {
      await transactionDb.findAndUpdate(
        {
          confirmations: newTxn.confirmations,
          blockHeight: newTxn.blockHeight,
          status: newTxn.status
        },
        { hash: txn.txid, walletId }
      );
    }
    return newTxn;
  } else if (coin instanceof EthCoinData) {
    // Derive address from Xpub (It'll always give a mixed case address with checksum)
    const myAddress =
      utils.HDNode.fromExtendedKey(xpub).derivePath(`0/0`).address;

    const amount = new BigNumber(txn.value);
    const fromAddr = txn.from;
    const inputs: InputOutput[] = [
      {
        address: txn.from.toLowerCase(),
        value: amount.toString(),
        isMine: txn.from.toLowerCase() === myAddress.toLowerCase(),
        indexNumber: 0,
        type: IOtype.INPUT
      }
    ];
    const outputs: InputOutput[] = [
      {
        address: txn.to.toLowerCase(),
        value: amount.toString(),
        isMine: txn.to.toLowerCase() === myAddress.toLowerCase(),
        indexNumber: 0,
        type: IOtype.OUTPUT
      }
    ];

    let token: string | undefined;

    const fees = new BigNumber(txn.gasUsed || txn.gas || 0).multipliedBy(
      txn.gasPrice || 0
    );

    if (txn.isErc20Token) {
      token = txn.tokenAbbr;

      if (!token) {
        logger.warn('Token abbr is not present in ERC20 Transaction');
        return;
      }

      const tokenData = coin.tokenList[token];
      if (!tokenData || tokenData.group !== CoinGroup.ERC20Tokens) {
        logger.warn('Invalid tokenAbbr in transaction', { token });
        return;
      }

      const feeTxn: Transaction = {
        hash: txn.hash,
        amount: fees.toString(),
        fees: '0',
        total: fees.toString(),
        confirmations: txn.confirmations || 0,
        walletId,
        slug: coinType,
        // 2 for failed, 1 for pass
        status: txn.isError ? 2 : 1,
        sentReceive: SentReceive.FEES,
        confirmed: new Date(txn.timeStamp),
        blockHeight: txn.blockNumber,
        coin: coinType,
        inputs: [],
        outputs: []
      };

      return feeTxn;
    }

    const newTxn: Transaction = {
      hash: txn.hash,
      amount: amount.toString(),
      fees: fees.toString(),
      total: token ? amount.toString() : amount.plus(fees).toString(),
      confirmations: txn.confirmations || 0,
      walletId,
      slug: token ? token : coinType,
      // 2 for failed, 1 for pass
      status: txn.isError ? 2 : 1,
      sentReceive:
        myAddress.toLowerCase() === fromAddr.toLowerCase()
          ? SentReceive.SENT
          : SentReceive.RECEIVED,
      confirmed: new Date(txn.timeStamp),
      blockHeight: txn.blockNumber,
      coin: coinType,
      inputs,
      outputs
    };

    return newTxn;
  }
};
