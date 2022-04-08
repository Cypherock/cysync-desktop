import {
    AddressDB,
    DeviceDB,
    Erc20DB,
    NotificationDB,
    PassEncrypt,
    PriceDB,
    ReceiveAddressDB,
    TransactionDB,
    WalletDB,
    XpubDB,
    LatestPriceDB
  } from '@cypherock/database';
  
  
  // import { getAnalyticsId } from '../../utils/analytics';
  
  const dbPath = process.env.userDataPath;
  
  const passEnDb = new PassEncrypt('adfds-dsfaf');
  
  const priceDb = new PriceDB(dbPath);
  const xpubDb = new XpubDB(dbPath, passEnDb);
  const transactionDb = new TransactionDB(dbPath);
  const walletDb = new WalletDB(dbPath);
  const erc20tokenDb = new Erc20DB(dbPath);
  const addressDb = new AddressDB(dbPath);
  const receiveAddressDb = new ReceiveAddressDB(dbPath);
  const notificationDb = new NotificationDB(dbPath);
  const deviceDb = new DeviceDB(dbPath);
export const latestPriceDb = new LatestPriceDB(dbPath);
  
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