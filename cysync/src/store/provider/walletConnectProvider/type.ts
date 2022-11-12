import { Coin } from '../../database';
import { EthCoinData } from '@cypherock/communication';

export interface IAccount extends Coin {
  chain: EthCoinData['chain'];
  name: EthCoinData['name'];
  address: string;
}

export const WalletConnectCallRequestMethodMap = {
  ETH_SEND_TXN: 'eth_sendTransaction',
  ETH_SIGN_TXN: 'eth_signTransaction',
  ETH_SIGN: 'eth_sign',
  SIGN_PERSONAL: 'personal_sign',
  SIGN_TYPED: 'eth_signTypedData'
} as const;

export type WalletConnectCallRequestMethod =
  typeof WalletConnectCallRequestMethodMap[keyof typeof WalletConnectCallRequestMethodMap];

export enum WalletConnectConnectionState {
  NOT_CONNECTED,
  CONNECTING,
  SELECT_ACCOUNT,
  CONNECTED
}
