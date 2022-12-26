import {
  AccountDB,
  AddressDB,
  CoinDB,
  CoinPriceDB,
  CustomAccountDB,
  DeviceDB,
  NotificationDB,
  PriceHistoryDB,
  ReceiveAddressDB,
  TokenDB,
  TransactionDB,
  WalletDB
} from '@cypherock/database';

export type MigrationFunction = (params: {
  deviceDb: DeviceDB;
  walletDb: WalletDB;
  coinDb: CoinDB;
  tokenDb: TokenDB;
  customAccountDb: CustomAccountDB;
  addressDb: AddressDB;
  receiveAddressDb: ReceiveAddressDB;
  transactionDb: TransactionDB;
  notificationDb: NotificationDB;
  priceHistoryDb: PriceHistoryDB;
  accountDb: AccountDB;
  coinPriceDb: CoinPriceDB;
}) => Promise<void>;
