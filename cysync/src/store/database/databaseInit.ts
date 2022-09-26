import {
  AddressDB,
  CoinDB,
  CustomAccountDB,
  DeviceDB,
  NotificationDB,
  PassEncrypt,
  PriceHistoryDB,
  ReceiveAddressDB,
  TokenDB,
  TransactionDB,
  WalletDB
} from '@cypherock/database';

import { getAnalyticsId } from '../../utils/analytics';
import logger from '../../utils/logger';

export const passEnDb = new PassEncrypt(getAnalyticsId());

export const deviceDb = new DeviceDB();
export const walletDb = new WalletDB();
export const coinDb = new CoinDB(passEnDb);
export const tokenDb = new TokenDB();
export const customAccountDb = new CustomAccountDB();
export const addressDb = new AddressDB();
export const receiveAddressDb = new ReceiveAddressDB();
export const transactionDb = new TransactionDB();
export const notificationDb = new NotificationDB();
export const priceHistoryDb = new PriceHistoryDB();

export * from '@cypherock/database';

const deleteDepricatedCoins = async () => {
  try {
    const depricatedCoins = [{ abbr: 'ethr' }];

    const promiseList = [
      {
        name: 'Coins',
        promises: depricatedCoins.map(elem =>
          coinDb.delete({ slug: elem.abbr })
        )
      },
      {
        name: 'Price History',
        promises: depricatedCoins.map(elem =>
          priceHistoryDb.delete({ slug: elem.abbr })
        )
      },
      {
        name: 'ERC20 Tokens',
        promises: depricatedCoins.map(elem =>
          tokenDb.delete({ coin: elem.abbr })
        )
      },
      {
        name: 'Addresses',
        promises: depricatedCoins.map(elem =>
          addressDb.delete({ coinType: elem.abbr })
        )
      },
      {
        name: 'Receive Address',
        promises: depricatedCoins.map(elem =>
          receiveAddressDb.delete({ coinType: elem.abbr })
        )
      },
      {
        name: 'Transactions per slug',
        promises: depricatedCoins.map(elem =>
          transactionDb.delete({ slug: elem.abbr })
        )
      },
      {
        name: 'Transaction per coin',
        promises: depricatedCoins.map(elem =>
          transactionDb.delete({ coin: elem.abbr })
        )
      },
      {
        name: 'Custom Account',
        promises: depricatedCoins.map(elem =>
          customAccountDb.delete({ coin: elem.abbr })
        )
      }
    ];

    const promises: Array<Promise<any>> = [];

    for (const elem of promiseList) {
      promises.push(...elem.promises);
    }

    await Promise.all(promises);
  } catch (error) {
    logger.error('Error in deleting depricated coins.');
    logger.error(error);
  }
};

const initializeDatabases = async () => {
  await transactionDb.intialise();
  await notificationDb.intialise();
  await priceHistoryDb.intialise();
  await deviceDb.intialise();
  await walletDb.intialise();
  await coinDb.intialise();
  await tokenDb.intialise();
  await customAccountDb.intialise();
  await addressDb.intialise();
  await receiveAddressDb.intialise();
};

export const initDatabases = async () => {
  await initializeDatabases();
  await deleteDepricatedCoins();
};
