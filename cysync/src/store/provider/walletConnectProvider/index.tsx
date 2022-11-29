import { COINS, EthCoinData } from '@cypherock/communication';
import Wallet from '@cypherock/wallet';
import WalletConnect from '@walletconnect/client';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import logger from '../../../utils/logger';
import {
  addressDb,
  Coin,
  getCoinWithPrices,
  Wallet as IWallet
} from '../../database';
import { useConnection } from '../connectionProvider';

import {
  IAccount,
  WalletConnectCallRequestMethod,
  WalletConnectCallRequestMethodMap,
  WalletConnectConnectionState,
  WalletConnectionConnectionClientMeta
} from './type';

export * from './type';

const ACCEPTED_CALL_METHODS = [
  WalletConnectCallRequestMethodMap.ETH_SIGN_TXN,
  WalletConnectCallRequestMethodMap.ETH_SEND_TXN,
  WalletConnectCallRequestMethodMap.ETH_SIGN,
  WalletConnectCallRequestMethodMap.SIGN_PERSONAL
];

const CONNECTION_TIMEOUT = 5000;

export interface WalletConnectContextInterface {
  isOpen: boolean;
  openDialog: () => void;
  handleClose: () => void;
  connectionState: WalletConnectConnectionState;
  createConnection: (url: string) => Promise<void>;
  connectionError: string;
  selectAccount: (walletData: IWallet, coin: Coin) => Promise<void>;
  connectionClientMeta: WalletConnectionConnectionClientMeta | undefined;
  approveCallRequest: (result: string) => void;
  rejectCallRequest: (reason?: string) => void;
  callRequestId: number | undefined;
  callRequestMethod: WalletConnectCallRequestMethod | undefined;
  callRequestParams: any;
  selectedAccount: IAccount | undefined;
  selectedWallet: IWallet | undefined;
}

export const WalletConnectContext: React.Context<WalletConnectContextInterface> =
  React.createContext<WalletConnectContextInterface>(
    {} as WalletConnectContextInterface
  );

export const WalletConnectProvider: React.FC = ({ children }) => {
  const deviceConnection = useConnection();

  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedWallet, setSelectedWallet] = React.useState<
    IWallet | undefined
  >(undefined);
  const [selectedAccount, setSelectedAccount] = React.useState<
    IAccount | undefined
  >(undefined);
  const [connectionError, setConnectionError] = React.useState('');
  const [connectionState, _setConnectionState] =
    React.useState<WalletConnectConnectionState>(
      WalletConnectConnectionState.NOT_CONNECTED
    );
  const [connectionClientMeta, setConnectionClientMeta] = React.useState<
    WalletConnectionConnectionClientMeta | undefined
  >(undefined);
  const [callRequestId, setCallRequestId] = React.useState<number | undefined>(
    undefined
  );
  const [callRequestMethod, setCallRequestMethod] = React.useState<
    WalletConnectCallRequestMethod | undefined
  >(undefined);
  const [callRequestParams, setCallRequestParams] =
    React.useState<any>(undefined);

  const currentConnector = React.useRef<WalletConnect | undefined>(undefined);
  const currentConnectionState = React.useRef<
    WalletConnectConnectionState | undefined
  >(WalletConnectConnectionState.NOT_CONNECTED);
  const connectionTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const resetStates = () => {
    deviceConnection.setBlockConnectionPopup(false);
    setConnectionClientMeta(undefined);
    setCallRequestMethod(undefined);
    setCallRequestParams(undefined);
    setSelectedAccount(undefined);
    setSelectedWallet(undefined);
    currentConnector.current = undefined;
  };

  const setConnectionState = (val: WalletConnectConnectionState) => {
    currentConnectionState.current = val;
    if (val === WalletConnectConnectionState.NOT_CONNECTED) {
      resetStates();
    }
    _setConnectionState(val);
  };

  const openDialog = () => {
    deviceConnection.setBlockConnectionPopup(true);
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

  const selectAccount = async (walletData: IWallet, coin: Coin) => {
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
        accounts: [address],
        chainId: coinMeta.chain
      });
      setSelectedWallet(walletData);
      setSelectedAccount({
        ...(await getCoinWithPrices(coin)),
        chain: coinMeta.chain,
        name: coinMeta.name,
        address,
        passphraseExists: walletData.passphraseSet,
        pinExists: walletData.passwordSet
      });
    } catch (error) {
      logger.error('WalletConnect: Error in selecting account');
      logger.error(error);
      disconnect();
    }
  };

  const approveCallRequest = (result: string) => {
    logger.info('WalletConnect: Approving call request', { result });
    if (callRequestId) {
      currentConnector.current?.approveRequest({
        id: callRequestId,
        result
      });
    }
    setCallRequestId(undefined);
    setCallRequestMethod(undefined);
    setCallRequestParams(undefined);
  };

  const rejectCallRequest = (message?: string) => {
    logger.info('WalletConnect: Rejecting call request', { message });
    if (callRequestId) {
      currentConnector.current?.rejectRequest({
        id: callRequestId,
        error: {
          message
        }
      });
    }
    setCallRequestId(undefined);
    setCallRequestMethod(undefined);
    setCallRequestParams(undefined);
  };

  const handleSessionRequest = (error: Error, payload: any) => {
    if (error) {
      logger.error('WalletConnect: Session request error', error);
      return;
    }

    logger.info('WalletConnect: Session request received', payload);
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
    }

    setConnectionClientMeta(currentConnector.current.peerMeta);
    setConnectionState(WalletConnectConnectionState.SELECT_ACCOUNT);
    if (!isOpen) {
      openDialog();
    }
  };

  const handleCallRequest = (error: Error, payload: any) => {
    if (error) {
      logger.error('WalletConnect: Session request error', error);
      return;
    }

    if (
      payload?.id &&
      payload?.params &&
      ACCEPTED_CALL_METHODS.includes(payload?.method)
    ) {
      logger.info('WalletConnect: Call Request received', { payload });
      const params = payload.params;
      setCallRequestParams(params);
      setCallRequestId(payload.id);
      setCallRequestMethod(payload.method);
    } else if (payload?.id) {
      logger.error('WalletConnect: Unsupported Call Request received', {
        payload
      });
      currentConnector.current?.rejectRequest({
        id: payload.id,
        error: {
          message: 'Unsupported method'
        }
      });
    }
  };

  const handleDisconnect = (error: Error, _payload: any) => {
    logger.info('WalletConnect: Disconnect');
    if (error) {
      logger.error(error);
    }
    setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);
    setConnectionError('');
    setIsOpen(false);
  };

  const handleConnect = (error: Error, _payload: any) => {
    logger.info('WalletConnect: Connected');
    if (error) {
      logger.error(error);
    }
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
      if (error) {
        logger.error('WalletConnect: Connection error');
        logger.error(error);
      }
      setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);
      setConnectionError(error.message);
    }
  };

  const onExternalLink = (_event: any, uri: string) => {
    logger.info('WalletConnect: Open', { uri });
    if (connectionState === WalletConnectConnectionState.NOT_CONNECTED) {
      createConnection(uri);
    }
  };

  React.useEffect(() => {
    ipcRenderer.on('wallet-connect', onExternalLink);

    return () => {
      ipcRenderer.removeListener('wallet-connect', onExternalLink);
    };
  }, []);

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
        connectionClientMeta,
        approveCallRequest,
        rejectCallRequest,
        callRequestId,
        callRequestMethod,
        callRequestParams,
        selectedAccount,
        selectedWallet
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
