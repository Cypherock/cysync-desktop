import {
  AddressDB,
  CoinDB,
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

export const passEnDb = new PassEncrypt(getAnalyticsId());

export const deviceDb = new DeviceDB();
export const walletDb = new WalletDB();
export const coinDb = new CoinDB(passEnDb);
export const tokenDb = new TokenDB();
export const addressDb = new AddressDB();
export const receiveAddressDb = new ReceiveAddressDB();
export const transactionDb = new TransactionDB();
export const notificationDb = new NotificationDB();
export const priceHistoryDb = new PriceHistoryDB();
/**
 * Loads the data from disk. To be used only for encrypted databases.
 */
// export const loadDatabases = async () => {
//   await coinDb.loadData();
// };

export * from '@cypherock/database';
