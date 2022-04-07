import {
  AddressDB,
  DeviceDB,
  Erc20DB,
  LatestPriceDB,
  NotificationDB,
  PassEncrypt,
  PriceDB,
  ReceiveAddressDB,
  TransactionDB,
  WalletDB,
  XpubDB
} from '@cypherock/database';
import { ipcRenderer } from 'electron';

// import { getAnalyticsId } from '../../utils/analytics';

const dbPath = process.env.userDataPath;

export const passEnDb = new PassEncrypt('adfds-dsfaf');

export const priceDb = new PriceDB(dbPath);
export const latestPriceDb = new LatestPriceDB(dbPath);
export const xpubDb = new XpubDB(dbPath, passEnDb);
export const transactionDb = new TransactionDB(dbPath);
export const walletDb = new WalletDB(dbPath);
export const erc20tokenDb = new Erc20DB(dbPath);
export const addressDb = new AddressDB(dbPath);
export const receiveAddressDb = new ReceiveAddressDB(dbPath);
export const notificationDb = new NotificationDB(dbPath);
export const deviceDb = new DeviceDB(dbPath);

export const dbs = {
  priceDb,
  xpubDb,
  transactionDb,
  walletDb,
  erc20tokenDb,
  addressDb,
  receiveAddressDb,
  notificationDb,
  deviceDb,
  passEnDb
};

export enum Databases {
  PRICE = 'priceDb',
  XPUB = 'xpubDb',
  TRANSACTION = 'transactionDb',
  WALLET = 'walletDb',
  ERC20TOKEN = 'erc20tokenDb',
  ADDRESS = 'addressDb',
  RECEIVEADDRESS = 'receiveAddressDb',
  NOTIFICATION = 'notificationDb',
  DEVICE = 'deviceDb',
  PASSEN = 'passEnDb'
}

export const dbUtil = async (
  dbName: Databases,
  fnName: string,
  ...args: any
) => {
  return await ipcRenderer.invoke('database', dbName, fnName, ...args);
};

/**
 * Loads the data from disk. To be used only for encrypted databases.
 */
export const loadDatabases = async () => {
  await dbUtil(Databases.XPUB, 'loadData');
};

export * from '@cypherock/database';
