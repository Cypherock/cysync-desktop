import { COINS, EthCoinData } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React from 'react';
import WalletConnect from '@walletconnect/client';
import Wallet from '@cypherock/wallet';
import { Coin, addressDb } from '../../database';

import logger from '../../../utils/logger';

const CONNECTION_TIMEOUT = 5000;

export enum WalletConnectConnectionState {
  NOT_CONNECTED,
  CONNECTING,
  SELECT_ACCOUNT,
  CONNECTED
}

export interface WalletConnectContextInterface {
  isOpen: boolean;
  openDialog: () => void;
  handleClose: () => void;
  connectionState: WalletConnectConnectionState;
  createConnection: (url: string) => Promise<void>;
  connectionError: string;
  selectAccount: (coin: Coin) => void;
}

export const WalletConnectContext: React.Context<WalletConnectContextInterface> =
  React.createContext<WalletConnectContextInterface>(
    {} as WalletConnectContextInterface
  );

export const WalletConnectProvider: React.FC = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState('');
  const [connectionState, _setConnectionState] =
    React.useState<WalletConnectConnectionState>(
      WalletConnectConnectionState.NOT_CONNECTED
    );
  const [connectionClientMeta, setConnectionClientMeta] = React.useState<
    | {
        description?: string;
        url?: string;
        icons?: string[];
        name?: string;
      }
    | undefined
  >(undefined);

  const currentConnector = React.useRef<WalletConnect | undefined>(undefined);
  const currentConnectionState = React.useRef<
    WalletConnectConnectionState | undefined
  >(WalletConnectConnectionState.NOT_CONNECTED);
  const connectionTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const setConnectionState = (val: WalletConnectConnectionState) => {
    currentConnectionState.current = val;
    if (val === WalletConnectConnectionState.NOT_CONNECTED) {
      setConnectionClientMeta(undefined);
    }
    _setConnectionState(val);
  };

  const openDialog = () => {
    setIsOpen(true);
  };

  const disconnect = () => {
    currentConnector.current?.killSession();
    setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);
  };

  const handleClose = () => {
    disconnect();
    setConnectionError('');
    setIsOpen(false);
  };

  const selectAccount = async (coin: Coin) => {
    try {
      const coinMeta = COINS[coin.slug];

      if (!(coinMeta instanceof EthCoinData)) {
        throw new Error('Non ETH coin received in wallet connect');
      }

      const wallet = Wallet({
        coinType: coin.slug,
        xpub: coin.xpub,
        walletId: coin.walletId,
        zpub: coin.zpub,
        addressDB: addressDb
      });

      const address = (await wallet.newReceiveAddress()).toLowerCase();

      currentConnector.current?.approveSession({
        accounts: [address], //
        chainId: coinMeta.chain
      });
      setConnectionState(WalletConnectConnectionState.CONNECTED);
    } catch (error) {
      logger.error('WalletConnect: Error in selecting account');
      logger.error(error);
      disconnect();
    }
  };

  const handleSessionRequest = (error: Error, payload: any) => {
    console.log({ error, payload });
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
    }

    setConnectionClientMeta(currentConnector.current.peerMeta);
    setConnectionState(WalletConnectConnectionState.SELECT_ACCOUNT);
  };

  const handleCallRequest = (error: Error, payload: any) => {
    console.log({ error, payload });
  };

  const handleDisconnect = (error: Error, payload: any) => {
    console.log({ error, payload });
    setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);
  };

  const handleConnect = (error: Error, payload: any) => {
    console.log({ error, payload });
    setConnectionState(WalletConnectConnectionState.CONNECTED);
  };

  const createConnection = async (url: string) => {
    try {
      logger.info('WalletConnect: Creating connection', { url });
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }

      setConnectionError('');
      setConnectionState(WalletConnectConnectionState.CONNECTING);
      // Create connector
      const connector = new WalletConnect({
        // Required
        uri: url,
        // Required
        clientMeta: {
          description: 'Cypherock CySync',
          url: 'https://www.cypherock.com',
          icons: ['https://www.cypherock.com/assets/logo.png'],
          name: 'Cypherock CySync'
        }
      });
      currentConnector.current = connector;

      connector.on('session_request', handleSessionRequest);
      connector.on('call_request', handleCallRequest);
      connector.on('disconnect', handleDisconnect);
      connector.on('connect', handleConnect);

      connectionTimeout.current = setTimeout(() => {
        logger.info(
          'WalletConnect: Connection timeout exceeded, disconnecting...',
          { url }
        );
        disconnect();
      }, CONNECTION_TIMEOUT);
    } catch (error) {
      setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);
      setConnectionError(error.message);
      console.log(error);
    }
  };

  return (
    <WalletConnectContext.Provider
      value={{
        isOpen,
        handleClose,
        connectionState,
        createConnection,
        openDialog,
        connectionError,
        selectAccount,
        connectionClientMeta
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
};

WalletConnectProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useWalletConnect(): WalletConnectContextInterface {
  return React.useContext(WalletConnectContext);
}
