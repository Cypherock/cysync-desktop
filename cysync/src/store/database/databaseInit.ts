import { ipcRenderer } from 'electron';

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
