import { COINS, EthCoinData, EthList } from '@cypherock/communication';
import Wallet from '@cypherock/wallet';
import { Core } from '@walletconnect/core';
import WalletConnect from '@walletconnect/legacy-client';
import { SessionTypes } from '@walletconnect/types';
import {
  buildApprovedNamespaces,
  getSdkError,
  normalizeNamespaces,
  parseUri
} from '@walletconnect/utils';
import { Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet';
import { Web3Wallet as Web3WalletType } from '@walletconnect/web3wallet/dist/types/client';
import { ipcRenderer } from 'electron';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import logger from '../../../utils/logger';
import {
  Account,
  addressDb,
  getCoinWithPrices,
  Wallet as IWallet
} from '../../database';

import {
  ChainMappedAccount,
  IAccount,
  WalletConnectCallRequestData,
  WalletConnectCallRequestMethodMap,
  WalletConnectConnectionState,
  WalletConnectionConnectionClientMeta
} from './type';

export * from './type';

const ACCEPTED_CALL_METHODS = [
  WalletConnectCallRequestMethodMap.ETH_SIGN_TXN,
  WalletConnectCallRequestMethodMap.ETH_SEND_TXN,
  WalletConnectCallRequestMethodMap.ETH_SIGN,
  WalletConnectCallRequestMethodMap.SIGN_PERSONAL,
  WalletConnectCallRequestMethodMap.SIGN_TYPED,
  WalletConnectCallRequestMethodMap.SIGN_TYPED_V4
];

const CONNECTION_TIMEOUT = 5000;
const WALLET_CONNECT_PROJECT_ID = '892cb46355562fd3e2d37d2361f44c1d';

export interface WalletConnectContextInterface {
  isOpen: boolean;
  openDialog: () => void;
  handleClose: () => void;
  connectionState: WalletConnectConnectionState;
  createConnection: (url: string) => Promise<void>;
  connectionError: string;
  selectAccount: (walletData: IWallet, coin: Account) => Promise<void>;
  connectionClientMeta: WalletConnectionConnectionClientMeta | undefined;
  approveCallRequest: (result: string) => void;
  rejectCallRequest: (reason?: string) => void;
  callRequestData: WalletConnectCallRequestData;
  selectedAccount: IAccount | undefined;
  selectedWallet: IWallet | undefined;
  setSelectedWallet: (wallet: IWallet) => void;
  selectedAccountList: React.MutableRefObject<ChainMappedAccount>;
  approveSessionRequest: (data: ChainMappedAccount) => void;
  currentVersion: number;
  requiredNamespaces: string[];
  optionalNamespaces: string[];
}

export const WalletConnectContext: React.Context<WalletConnectContextInterface> =
  React.createContext<WalletConnectContextInterface>(
    {} as WalletConnectContextInterface
  );

export const WalletConnectProvider: React.FC = ({ children }) => {
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
  const [callRequestData, setCallRequestData] = React.useState<
    WalletConnectCallRequestData | undefined
  >(undefined);

  const currentConnector = React.useRef<WalletConnect | undefined>(undefined);
  const currentConnectionState = React.useRef<
    WalletConnectConnectionState | undefined
  >(WalletConnectConnectionState.SELECT_ACCOUNT);
  const connectionTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const [currentVersion, setCurrentVersion] = React.useState(2);
  const [requiredNamespaces, setRequiredNamespaces] = React.useState<string[]>(
    []
  );
  const [optionalNamespaces, setOptionalNamespaces] = React.useState<string[]>(
    []
  );
  const currentWeb3Wallet = React.useRef<Web3WalletType | undefined>(undefined);
  const currentProposal = React.useRef<
    Web3WalletTypes.SessionProposal | undefined
  >(undefined);
  const currentSession = React.useRef<SessionTypes.Struct | undefined>(
    undefined
  );
  const selectedAccountList = React.useRef<ChainMappedAccount>({});

  const resetStates = () => {
    setConnectionClientMeta(undefined);
    setCallRequestData(undefined);
    setSelectedAccount(undefined);
    currentConnector.current = undefined;

    setRequiredNamespaces(undefined);
    setOptionalNamespaces(undefined);
    setCurrentVersion(2);
    currentWeb3Wallet.current = undefined;
    currentProposal.current = undefined;
    selectedAccountList.current = {};
  };

  const setConnectionState = (val: WalletConnectConnectionState) => {
    currentConnectionState.current = val;
    if (val === WalletConnectConnectionState.NOT_CONNECTED) {
      resetStates();
    }
    _setConnectionState(val);
  };

  const openDialog = () => {
    setIsOpen(true);
  };

  const disconnect = async () => {
    currentConnector.current?.killSession();
    if (connectionState === WalletConnectConnectionState.CONNECTED) {
      await currentWeb3Wallet.current?.disconnectSession({
        topic: currentSession.current.topic,
        reason: getSdkError('USER_DISCONNECTED')
      });
    } else {
      await currentWeb3Wallet.current?.rejectSession({
        id: currentProposal.current.id,
        reason: getSdkError('USER_REJECTED')
      });
    }
    setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);
  };

  const handleClose = () => {
    disconnect();
    setSelectedWallet(undefined);
    setConnectionError('');
    setIsOpen(false);
  };

  const selectAccount = async (walletData: IWallet, coin: Account) => {
    try {
      const coinMeta = COINS[coin.coinId];

      if (!(coinMeta instanceof EthCoinData)) {
        throw new Error('Non ETH coin received in wallet connect');
      }

      const wallet = Wallet({
        coinId: coin.coinId,
        xpub: coin.xpub,
        walletId: coin.walletId,
        addressDB: addressDb,
        accountType: coin.accountType,
        accountIndex: coin.accountIndex,
        accountId: coin.accountId
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
        name: coin.name,
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

  const approveCallRequest = async (result: string) => {
    logger.info('WalletConnect: Approving call request', { result });
    if (currentVersion === 2) {
      await currentWeb3Wallet.current.respondSessionRequest({
        topic: callRequestData.topic,
        response: {
          id: callRequestData.id,
          jsonrpc: '2.0',
          result
        }
      });
    } else if (callRequestData?.id) {
      currentConnector.current?.approveRequest({
        id: callRequestData.id,
        result
      });
    }
    setCallRequestData(undefined);
  };

  const rejectCallRequest = async (message?: string) => {
    logger.info('WalletConnect: Rejecting call request', { message });
    if (currentVersion === 2) {
      await currentWeb3Wallet.current.respondSessionRequest({
        topic: callRequestData.topic,
        response: {
          id: callRequestData.id,
          jsonrpc: '2.0',
          error: {
            code: 5000,
            message: message ?? 'User rejected'
          }
        }
      });
    } else if (callRequestData?.id) {
      currentConnector.current?.rejectRequest({
        id: callRequestData.id,
        error: {
          message
        }
      });
    }
    setCallRequestData(undefined);
  };

  const walletConnectV1Methods = {
    handleSessionRequest: (error: Error, payload: any) => {
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
    },

    handleCallRequest: (error: Error, payload: any) => {
      if (error) {
        logger.error('WalletConnect: Session request error', error);
        return;
      }

      if (
        payload?.id &&
        payload?.params &&
        ACCEPTED_CALL_METHODS.includes(payload?.method)
      ) {
        ipcRenderer.send('focus');
        logger.info('WalletConnect: Call Request received', { payload });
        const { params } = payload;
        setCallRequestData({ params, id: payload.id, method: payload.method });
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
    },

    handleDisconnect: (error: Error, _payload: any) => {
      logger.info('WalletConnect: Disconnect');
      if (error) {
        logger.error(error);
      }
      setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);
      setConnectionError('');
      setIsOpen(false);
    },

    handleConnect: (error: Error, _payload: any) => {
      logger.info('WalletConnect: Connected');
      if (error) {
        logger.error(error);
      }
      setConnectionState(WalletConnectConnectionState.CONNECTED);
    }
  };

  const areChainsSupported = async (
    proposal: Web3WalletTypes.SessionProposal
  ) => {
    const requiredChainList = proposal.params.requiredNamespaces;
    const optionalChainList = proposal.params.optionalNamespaces;
    const requiredChains = Object.values(normalizeNamespaces(requiredChainList))
      .map(namespace => namespace.chains)
      .flat();
    const optionalChains = Object.values(normalizeNamespaces(optionalChainList))
      .map(namespace => namespace.chains)
      .flat();
    const supportedNamespaces = EthList.map(item => `eip155:${item.chain}`);
    const unsupportedChains = requiredChains.filter(
      chain => !supportedNamespaces.includes(chain)
    );

    if (unsupportedChains.length === 0) {
      const supportedOptionalChains = supportedNamespaces.filter(chain =>
        optionalChains.includes(chain)
      );
      setRequiredNamespaces(requiredChains);
      setOptionalNamespaces(supportedOptionalChains);
      return true;
    }

    await currentWeb3Wallet.current.rejectSession({
      id: proposal.id,
      reason: getSdkError('UNSUPPORTED_CHAINS')
    });

    setConnectionError(
      `cySync doesn't support the following chains: ${unsupportedChains.join(
        '\n'
      )}`
    );
    setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);

    logger.info('WalletConnect: Rejected due to unsupported chains');
    return false;
  };

  const walletConnectV2Methods = {
    handleSessionProposal: async (
      proposal: Web3WalletTypes.SessionProposal
    ) => {
      logger.info('WalletConnect: Session proposal received', proposal);

      currentProposal.current = proposal;

      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }

      if (!(await areChainsSupported(proposal))) return;

      setConnectionClientMeta(proposal.params.proposer.metadata);
      setConnectionState(WalletConnectConnectionState.SELECT_ACCOUNT);
      if (!isOpen) {
        openDialog();
      }
    }
  };

  const walletConnectInit = async (uri: string) => {
    const { version } = parseUri(uri);
    setCurrentVersion(version);

    const cysyncMetadata = {
      description: 'Cypherock CySync',
      url: 'https://www.cypherock.com',
      icons: ['https://www.cypherock.com/assets/logo.png'],
      name: 'Cypherock CySync'
    };

    if (version === 1) {
      const connector = new WalletConnect({
        // Required
        uri,
        // Required
        clientMeta: cysyncMetadata
      });
      currentConnector.current = connector;

      connector.on(
        'session_request',
        walletConnectV1Methods.handleSessionRequest
      );
      connector.on('call_request', walletConnectV1Methods.handleCallRequest);
      connector.on('disconnect', walletConnectV1Methods.handleDisconnect);
      connector.on('connect', walletConnectV1Methods.handleConnect);
    } else if (version === 2) {
      const core = new Core({
        projectId: WALLET_CONNECT_PROJECT_ID
      });

      const web3wallet = await Web3Wallet.init({
        core,
        metadata: cysyncMetadata
      });

      currentWeb3Wallet.current = web3wallet;

      web3wallet.on(
        'session_proposal',
        walletConnectV2Methods.handleSessionProposal
      );
      web3wallet.on('session_delete', () => {
        setConnectionState(WalletConnectConnectionState.NOT_CONNECTED);
        setConnectionError('');
        setIsOpen(false);
      });
      web3wallet.on('session_request', async event => {
        const { account, wallet } =
          selectedAccountList.current[event.params.chainId];
        setSelectedWallet(wallet);
        setSelectedAccount(account);
        setCallRequestData({
          id: event.id,
          topic: event.topic,
          params: event.params.request.params,
          method: event.params.request.method as any
        });
        ipcRenderer.send('focus');
        logger.info('WalletConnect: Call Request received', { event });
      });

      await web3wallet.core.pairing.pair({ uri });
    } else {
      throw new Error('Unsupported WalletConnect version');
    }
  };

  const createConnection = async (url: string) => {
    try {
      logger.info('WalletConnect: Creating connection', { url });
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }

      setConnectionError('');
      setConnectionState(WalletConnectConnectionState.CONNECTING);

      await walletConnectInit(url);

      connectionTimeout.current = setTimeout(() => {
        logger.info(
          'WalletConnect: Connection timeout exceeded, disconnecting...',
          { url }
        );
        setConnectionError('Timeout exceeded, Try again with latest URI');
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

  const getAddresses = async (data: ChainMappedAccount) => {
    const addresses = [];
    const accountList: ChainMappedAccount = {};
    for (const key of Object.keys(data)) {
      const { account, wallet: walletData } = data[key];
      const coinMeta = COINS[account.coinId];

      if (!(coinMeta instanceof EthCoinData)) {
        throw new Error('Non ETH coin received in wallet connect');
      }
      const wallet = Wallet({
        coinId: account.coinId,
        xpub: account.xpub,
        walletId: account.walletId,
        addressDB: addressDb,
        accountType: account.accountType,
        accountIndex: account.accountIndex,
        accountId: account.accountId
      });

      const address = (await wallet.newReceiveAddress()).toLowerCase();

      addresses.push(`${key}:${address}`);
      accountList[key] = {
        account: {
          ...(await getCoinWithPrices(account)),
          chain: coinMeta.chain,
          name: account.name,
          address,
          passphraseExists: walletData.passphraseSet,
          pinExists: walletData.passwordSet
        },
        wallet: walletData
      };
    }
    selectedAccountList.current = cloneDeep(accountList);
    return addresses;
  };

  const approveSessionRequest = async (data: ChainMappedAccount) => {
    const reqNamespaces = buildApprovedNamespaces({
      proposal: currentProposal.current.params,
      supportedNamespaces: {
        eip155: {
          methods: ACCEPTED_CALL_METHODS,
          chains: EthList.map(item => `eip155:${item.chain}`),
          events: ['chainChanged', 'accountsChanged'],
          accounts: await getAddresses(data)
        }
      }
    });
    const session = await currentWeb3Wallet.current.approveSession({
      id: currentProposal.current.id,
      namespaces: reqNamespaces
    });
    setConnectionState(WalletConnectConnectionState.CONNECTED);

    currentSession.current = session;
  };

  const onExternalLink = (_event: any, uri: string) => {
    logger.info('WalletConnect: Open', { uri });
    if (connectionState === WalletConnectConnectionState.NOT_CONNECTED) {
      createConnection(uri);
    }
  };

  const getInitialUri = async () => {
    const uri = await ipcRenderer.invoke('wc-url-init');
    if (uri) onExternalLink(null, uri);
  };

  React.useEffect(() => {
    ipcRenderer.on('wallet-connect', onExternalLink);
    getInitialUri();
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
        callRequestData,
        selectedAccount,
        selectedWallet,
        setSelectedWallet,
        currentVersion,
        requiredNamespaces,
        optionalNamespaces,
        selectedAccountList,
        approveSessionRequest
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
