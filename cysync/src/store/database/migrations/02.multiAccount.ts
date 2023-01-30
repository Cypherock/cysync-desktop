import {
  AbsCoinData,
  BitcoinAccountTypes,
  BtcCoinData,
  BtcCoinMap,
  CoinData,
  COINS,
  EthCoinData,
  EthCoinMap,
  NearCoinData,
  NearCoinMap,
  SolanaAccountTypes,
  SolanaCoinData,
  SolanaCoinMap
} from '@cypherock/communication';
import {
  Account,
  AccountDB,
  Address,
  Coin,
  CoinPrice,
  CustomAccount,
  PriceHistory,
  ReceiveAddress,
  Token,
  Transaction
} from '@cypherock/database';
import {
  BitcoinWallet,
  EthereumWallet,
  NearWallet,
  SolanaWallet
} from '@cypherock/wallet';

import logger from '../../../utils/logger';

import { MigrationFunction, MigrationFunctionParams } from './types';

interface MapFunctionParams extends MigrationFunctionParams {
  allCoins: Coin[];
  allAccounts: Account[];
}

type MapFunction<T> = (params: MapFunctionParams) => Promise<T[]>;

const getDerivationPath = (partialAccount: Account) => {
  const coinData = COINS[partialAccount.coinId];

  const params = {
    accountIndex: partialAccount.accountIndex,
    accountType: partialAccount.accountType,
    coinIndex: coinData.coinIndex
  };

  let path = '';

  if (coinData instanceof BtcCoinData) {
    path = BitcoinWallet.getDerivationPath(params);
  } else if (coinData instanceof EthCoinData) {
    path = EthereumWallet.getDerivationPath({
      ...params,
      chainId: coinData.chain
    });
  } else if (coinData instanceof NearCoinData) {
    path = NearWallet.getDerivationPath({
      ...params,
      addressIndex: partialAccount.accountIndex
    });
  } else if (coinData instanceof SolanaCoinData) {
    path = SolanaWallet.getDerivationPath(params);
  } else {
    throw new Error('Invalid coin type: ' + partialAccount.coinId);
  }

  return path;
};

const mapFromCoinDbToAccountDb: MapFunction<Account> = async ({ allCoins }) => {
  const accountList: Account[] = [];

  for (const coin of allCoins) {
    const coinObj = Object.values(COINS).find(
      elem => elem.oldId && elem.oldId === coin.slug
    );

    if (!coinObj) {
      logger.warn('Invalid slug found in coinDb', { coin });
      continue;
    }

    if (
      ([BtcCoinMap.bitcoin, 'bitcoin-testnet'] as string[]).includes(coinObj.id)
    ) {
      const accountX: Account = {
        name: '',
        accountId: '',
        derivationPath: '',
        walletId: coin.walletId,
        coinId: coinObj.id,
        xpub: coin.xpub,
        accountType: BitcoinAccountTypes.legacy,
        accountIndex: 0,
        totalBalance: coin.xpubBalance,
        totalUnconfirmedBalance: coin.xpubUnconfirmedBalance
      };
      accountX.accountId = AccountDB.buildAccountIndex(accountX);
      accountX.name = AccountDB.createAccountName(accountX);
      accountX.derivationPath = getDerivationPath(accountX);

      accountList.push(accountX);

      if (coin.zpub) {
        const accountY: Account = {
          name: '',
          accountId: '',
          derivationPath: '',
          walletId: coin.walletId,
          coinId: coinObj.id,
          xpub: coin.zpub,
          accountType: BitcoinAccountTypes.nativeSegwit,
          accountIndex: 0,
          totalBalance: coin.zpubBalance,
          totalUnconfirmedBalance: coin.zpubUnconfirmedBalance
        };
        accountY.accountId = AccountDB.buildAccountIndex(accountY);
        accountY.name = AccountDB.createAccountName(accountY);
        accountY.derivationPath = getDerivationPath(accountY);

        accountList.push(accountY);
      }
    } else {
      let accountType = '';
      let accountIndex = 0;

      if (coinObj.id === SolanaCoinMap.solana) {
        accountType = SolanaAccountTypes.ledger;
      }

      if (coinObj.id === NearCoinMap.near) {
        accountIndex = 1;
      }

      const account: Account = {
        name: '',
        accountId: '',
        derivationPath: '',
        walletId: coin.walletId,
        coinId: coinObj.id,
        xpub: coin.xpub,
        accountType,
        accountIndex,
        totalBalance: coin.totalBalance,
        totalUnconfirmedBalance: coin.totalUnconfirmedBalance
      };

      account.accountId = AccountDB.buildAccountIndex(account);
      account.name = AccountDB.createAccountName(account);
      account.derivationPath = getDerivationPath(account);

      accountList.push(account);
    }
  }

  return accountList;
};

const mapAddressDb: MapFunction<Address> = async ({
  addressDb,
  allAccounts
}) => {
  const newAddressList: Address[] = [];
  const allAddresses = await addressDb.getAll({ databaseVersion: 'v1' });

  for (const address of allAddresses) {
    const coinObj = Object.values(COINS).find(
      elem => elem.oldId && elem.oldId === address.coinType
    );

    if (!coinObj) {
      logger.warn('Invalid slug found in addressDb', { address });
      continue;
    }

    const account = allAccounts.find(
      acc => acc.walletId === address.walletId && coinObj.id === acc.coinId
    );

    if (!account) {
      logger.warn('No account found for addressDb entry', { address });
      continue;
    }

    const newAddress: Address = {
      accountId: account.accountId,
      walletId: account.walletId,
      coinId: coinObj.id,
      address: address.address,
      chainIndex: address.chainIndex,
      addressIndex: address.chainIndex,
      isSegwit: address.isSegwit
    };

    newAddressList.push(newAddress);
  }

  return newAddressList;
};

const mapCoinPriceDb: MapFunction<CoinPrice> = async ({
  allCoins,
  tokenDb
}) => {
  const newCoinPriceList: CoinPrice[] = [];

  for (const coin of allCoins) {
    const coinObj = Object.values(COINS).find(
      elem => elem.oldId && elem.oldId === coin.slug
    );

    if (!coinObj) {
      logger.warn('Invalid slug found in coinDb', { coin });
      continue;
    }

    const coinPrice: CoinPrice = {
      coinId: coinObj.id,
      price: coin.price,
      priceLastUpdatedAt: coin.priceLastUpdatedAt
    };

    newCoinPriceList.push(coinPrice);
  }

  const allTokens = await tokenDb.getAll({ databaseVersion: 'v1' });
  for (const token of allTokens) {
    const coinObj = Object.values(COINS).find(
      elem => elem.oldId && elem.oldId === token.coin
    );

    if (!coinObj) {
      logger.warn('Invalid coin found in tokenDb', { token });
      continue;
    }

    const tokenObj = Object.values(coinObj.tokenList).find(
      elem => elem.oldId && elem.oldId === token.slug
    );

    if (!tokenObj) {
      logger.warn('Invalid slug found in tokenDb', { token });
      continue;
    }

    const coinPrice: CoinPrice = {
      coinId: tokenObj.id,
      price: token.price,
      priceLastUpdatedAt: token.priceLastUpdatedAt
    };

    newCoinPriceList.push(coinPrice);
  }

  return newCoinPriceList;
};

const mapCustomAccountDb: MapFunction<CustomAccount> = async ({
  allAccounts,
  customAccountDb
}) => {
  const newCustomAccountList: CustomAccount[] = [];
  const allCustomAccounts = await customAccountDb.getAll({
    databaseVersion: 'v1'
  });

  for (const customAccount of allCustomAccounts) {
    const coinObj = Object.values(COINS).find(
      elem => elem.oldId && elem.oldId === customAccount.coin
    );

    if (!coinObj) {
      logger.warn('Invalid slug found in customAccountDb', { customAccount });
      continue;
    }

    const account = allAccounts.find(
      acc =>
        acc.walletId === customAccount.walletId && coinObj.id === acc.coinId
    );

    if (!account) {
      logger.warn('No account found for addressDb entry', { customAccount });
      continue;
    }

    const newCustomAccount: CustomAccount = {
      accountId: account.accountId,
      coinId: account.coinId,
      walletId: account.walletId,
      name: customAccount.name,
      balance: customAccount.balance
    };

    newCustomAccountList.push(newCustomAccount);
  }

  return newCustomAccountList;
};

const mapPriceHistoryDb: MapFunction<PriceHistory> = async ({
  priceHistoryDb
}) => {
  const newPriceHistoryList: PriceHistory[] = [];
  const allPriceHistory = await priceHistoryDb.getAll({
    databaseVersion: 'v1'
  });

  for (const priceHistory of allPriceHistory) {
    const coinObj = [
      ...Object.values(COINS),
      ...Object.values(COINS).flatMap(elem => Object.values(elem.tokenList))
    ].find(elem => elem.oldId === priceHistory.slug);

    if (!coinObj) {
      logger.warn('Invalid slug found in priceHistoryDb', {
        priceHistory
      });
      continue;
    }

    const newPriceHistory: PriceHistory = {
      coinId: coinObj.id,
      interval: priceHistory.interval,
      data: priceHistory.data
    };

    newPriceHistoryList.push(newPriceHistory);
  }

  return newPriceHistoryList;
};

const mapReceiveAddressDb: MapFunction<ReceiveAddress> = async ({
  receiveAddressDb,
  allAccounts
}) => {
  const newReceiveAddressList: ReceiveAddress[] = [];
  const allReceiveAddress = await receiveAddressDb.getAll({
    databaseVersion: 'v1'
  });

  for (const receiveAddress of allReceiveAddress) {
    const coinObj = [
      ...Object.values(COINS),
      ...Object.values(COINS).flatMap(elem => Object.values(elem.tokenList))
    ].find(elem => elem.oldId === receiveAddress.coinType);

    if (!coinObj) {
      logger.warn('Invalid slug found in receiveAddressDb', {
        receiveAddress
      });
      continue;
    }

    const account = allAccounts.find(
      acc =>
        acc.walletId === receiveAddress.walletId && coinObj.id === acc.coinId
    );

    if (!account) {
      logger.warn('No account found for receiveAddressDb entry', {
        receiveAddress
      });
      continue;
    }

    const newReceiveAddress: ReceiveAddress = {
      coinId: coinObj.id,
      accountId: account.accountId,
      address: receiveAddress.address,
      walletId: account.walletId
    };

    newReceiveAddressList.push(newReceiveAddress);
  }

  return newReceiveAddressList;
};

const mapTokenDb: MapFunction<Token> = async () => {
  // Don't add ETH Tokens so the application will have to refresh the history
  return [];
  // const newTokenList: Token[] = [];
  // const allTokens = await tokenDb.getAll({
  //   databaseVersion: 'v1'
  // });

  // for (const token of allTokens) {
  //   const coinObj = Object.values(COINS).find(
  //     elem => elem.oldId && elem.oldId === token.coin
  //   );

  //   if (!coinObj) {
  //     logger.warn('Invalid slug found in tokenDb', {
  //       token
  //     });
  //     continue;
  //   }

  //   const tokenObj = Object.values(coinObj.tokenList).find(
  //     elem => elem.oldId && elem.oldId === token.slug
  //   );

  //   if (!tokenObj) {
  //     logger.warn('Invalid slug found in tokenDb', { token });
  //     continue;
  //   }

  //   const account = allAccounts.find(
  //     acc => acc.walletId === token.walletId && coinObj.id === acc.coinId
  //   );

  //   if (!account) {
  //     logger.warn('No account found for receiveAddressDb entry', {
  //       receiveAddress: token
  //     });
  //     continue;
  //   }

  //   const newToken: Token = {
  //     coinId: tokenObj.id,
  //     parentCoinId: coinObj.id,
  //     accountId: account.accountId,
  //     walletId: account.walletId,
  //     balance: token.balance
  //   };

  //   newTokenList.push(newToken);
  // }

  // return newTokenList;
};

const mapTransactionDb: MapFunction<Transaction> = async ({
  transactionDb,
  allAccounts
}) => {
  const newTransactions: Transaction[] = [];
  const allTransactions = await transactionDb.getAll({
    databaseVersion: 'v2'
  });

  for (const transaction of allTransactions) {
    let parentCoinObj: CoinData | undefined;
    let coinObj: AbsCoinData | undefined;

    if (transaction.coin && transaction.coin !== transaction.slug) {
      parentCoinObj = Object.values(COINS).find(
        elem => elem.oldId && elem.oldId === transaction.coin
      );

      if (!parentCoinObj) {
        logger.warn('Invalid coin found in transactionDb', {
          transaction
        });
        continue;
      }

      coinObj = Object.values(parentCoinObj.tokenList).find(
        elem => elem.oldId && elem.oldId === transaction.slug
      );
    } else {
      coinObj = Object.values(COINS).find(
        elem => elem.oldId && elem.oldId === transaction.slug
      );
    }

    if (!coinObj) {
      logger.warn('Invalid slug found in transactionDb', {
        transaction
      });
      continue;
    }

    // Don't add ETH Tokens so the application will have to refresh the history
    if (parentCoinObj?.id === EthCoinMap.ethereum) {
      continue;
    }

    const account = allAccounts.find(
      acc =>
        acc.walletId === transaction.walletId &&
        (parentCoinObj?.id || coinObj.id) === acc.coinId
    );

    if (!account) {
      logger.warn('No account found for transactionDb entry', {
        transaction
      });
      continue;
    }

    const newTransaction: Transaction = {
      parentCoinId: parentCoinObj?.id || coinObj.id,
      coinId: coinObj.id,
      accountId: account.accountId,
      walletId: account.walletId,
      isSub: !!parentCoinObj,
      hash: transaction.hash,
      total: transaction.total,
      fees: transaction.fees,
      amount: transaction.amount,
      confirmations: transaction.confirmations,
      walletName: transaction.walletName,
      status: transaction.status,
      sentReceive: transaction.sentReceive,
      confirmed: transaction.confirmed,
      blockHeight: transaction.blockHeight,
      inputs: transaction.inputs,
      outputs: transaction.outputs,
      blockedInputs: transaction.blockedInputs,
      blockedAt: transaction.blockedAt,
      customIdentifier: transaction.customIdentifier,
      type: transaction.type,
      description: transaction.description
    };

    newTransactions.push(newTransaction);
  }

  return newTransactions;
};

const multiAccountMigration: MigrationFunction = async params => {
  try {
    const {
      coinDb,
      accountDb,
      coinPriceDb,
      customAccountDb,
      receiveAddressDb,
      transactionDb,
      priceHistoryDb,
      tokenDb,
      addressDb
    } = params;
    const allCoins = await coinDb.getAll({ databaseVersion: 'v1' });
    const mapParams: MapFunctionParams = {
      ...params,
      allCoins,
      allAccounts: []
    };
    const newAccountList = await mapFromCoinDbToAccountDb(mapParams);
    const existingAccounts = await accountDb.getAll();
    mapParams.allAccounts = [...newAccountList, ...existingAccounts];

    const newAddressList = await mapAddressDb(mapParams);
    const newCoinPricesList = await mapCoinPriceDb(mapParams);
    const newCustomAccountList = await mapCustomAccountDb(mapParams);
    const newPriceHistoryList = await mapPriceHistoryDb(mapParams);
    const newReceiveAddressList = await mapReceiveAddressDb(mapParams);
    const newTokenList = await mapTokenDb(mapParams);
    const newTransactionList = await mapTransactionDb(mapParams);

    await coinDb.delete({ databaseVersion: 'v1' });
    await accountDb.insertMany(newAccountList);

    await coinPriceDb.insertMany(newCoinPricesList);

    await addressDb.delete({ databaseVersion: 'v1' });
    await addressDb.insertMany(newAddressList);

    await customAccountDb.delete({ databaseVersion: 'v1' });
    await customAccountDb.insertMany(newCustomAccountList);

    await priceHistoryDb.delete({ databaseVersion: 'v1' });
    await priceHistoryDb.insertMany(newPriceHistoryList);

    await receiveAddressDb.delete({ databaseVersion: 'v1' });
    await receiveAddressDb.insertMany(newReceiveAddressList);

    await tokenDb.delete({ databaseVersion: 'v1' });
    await tokenDb.insertMany(newTokenList);

    await transactionDb.delete({ databaseVersion: 'v2' });
    await transactionDb.insertMany(newTransactionList);
  } catch (error) {
    logger.error('Error in migrating database for multi account.');
    logger.error(error);
  }
};

export default multiAccountMigration;
