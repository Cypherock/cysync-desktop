import { EventEmitter } from 'events';

import logger from '../../../utils/logger';

import BlockbookSocket from './websocket';

export interface WebSocketServerInfo {
  name: string;
  url: string;
}

export interface AddressWalletMap {
  [key: string]: string | undefined;
}

export interface AddressInfo {
  address: string;
  walletId: string;
}

interface SocketInfo {
  socket: BlockbookSocket;
  info: WebSocketServerInfo;
  isSubscribedToBlock: boolean;
  connectRetryTimeout?: ReturnType<typeof setTimeout>;
  totalRetries: number;
  doConnect: boolean;
}

const MAX_CONNECTION_RETRIES = 50;

export default class BlockbookProvider extends EventEmitter {
  private websocketServerInfoList: WebSocketServerInfo[];
  private socketInfoList: SocketInfo[] = [];

  private addressesList: string[][] = [];

  private addressWalletMap: AddressWalletMap = {};

  constructor(serverInfo: WebSocketServerInfo[]) {
    super();
    if (serverInfo.length <= 0) {
      throw new Error('No websocket server info provided');
    }

    this.websocketServerInfoList = [...serverInfo];

    for (const server of this.websocketServerInfoList) {
      const socket = new BlockbookSocket({ url: server.url, keepAlive: true });

      const socketInfo = {
        socket,
        info: server,
        isSubscribedToBlock: false,
        totalRetries: 0,
        doConnect: false
      };
      this.socketInfoList.push(socketInfo);
      this.addressesList.push([]);
      this.setAllSocketListeners(socketInfo);
    }
  }

  private setAllSocketListeners(socketInfo: SocketInfo) {
    socketInfo.socket.addListener(
      'notification',
      this.onNotification.bind(this, socketInfo.info.name)
    );
    socketInfo.socket.addListener(
      'block',
      this.onBlock.bind(this, socketInfo.info.name)
    );
    socketInfo.socket.addListener(
      'disconnected',
      this.onDisconnect.bind(this, socketInfo)
    );
  }

  private setConnectRetry(socketInfo: SocketInfo) {
    if (socketInfo.totalRetries >= MAX_CONNECTION_RETRIES) {
      logger.error(
        'Max retries exceeded for websocket connection',
        socketInfo.info
      );
      return;
    }

    if (socketInfo.connectRetryTimeout) {
      clearTimeout(socketInfo.connectRetryTimeout);
    }

    if (!socketInfo.doConnect) {
      return;
    }

    socketInfo.connectRetryTimeout = setTimeout(
      this.retryConnection.bind(this, socketInfo),
      this.getConnectRetryTimeout(socketInfo)
    );
  }

  private getConnectRetryTimeout(socketInfo: SocketInfo) {
    if (socketInfo.totalRetries <= 15) {
      return 2000;
    }

    if (socketInfo.totalRetries <= 30) {
      return 5000;
    }

    if (socketInfo.totalRetries <= 40) {
      return 10000;
    }

    return 15000;
  }

  private onDisconnect(socketInfo: SocketInfo) {
    logger.debug('Websocket disconnected', socketInfo.info);
    this.setConnectRetry(socketInfo);
  }

  private async retryConnection(socketInfo: SocketInfo) {
    if (!socketInfo.doConnect || socketInfo.socket.isConnected()) {
      return;
    }

    try {
      logger.debug('Trying to reconnect socket', {
        ...socketInfo.info,
        retries: socketInfo.totalRetries
      });
      await socketInfo.socket.connect();
      this.setAllSocketListeners(socketInfo);
      this.establishPreviousSocketState(socketInfo);
      socketInfo.totalRetries = 0;
    } catch (error) {
      logger.debug('Failed to reconnect socket', {
        ...socketInfo.info,
        retries: socketInfo.totalRetries
      });
      socketInfo.totalRetries++;
      this.setConnectRetry(socketInfo);
    }
  }

  private async establishPreviousSocketState(socketInfo: SocketInfo) {
    try {
      if (socketInfo.isSubscribedToBlock) {
        await this.subscribeBlock(socketInfo.info.name);
      }

      await this.addAddressListener(socketInfo.info.name, []);
    } catch (error) {
      logger.error('Unable to establishPreviousSocketState');
      logger.error(error);
    }
  }

  public getWalletIdFromAddress(address: string) {
    return this.addressWalletMap[address];
  }

  public onNotification(coinType: string, params: any) {
    this.emit('txn', { coinType, txn: params.tx, address: params.address });
  }

  public onBlock(coinType: string, params: any) {
    this.emit('block', { coinType, ...params });
  }

  public async connect() {
    const results = await Promise.allSettled([
      ...this.socketInfoList.map(socket => {
        socket.doConnect = true;
        return socket.socket.connect();
      })
    ]);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const serverInfo = this.websocketServerInfoList[i];
      if (result.status === 'rejected') {
        logger.error(
          'Error in connecting blockbook websocket: ' + serverInfo.url
        );
        logger.error(result.reason);
      }
    }
  }

  public dispose() {
    this.addressWalletMap = {};
    for (const socket of this.socketInfoList) {
      socket.doConnect = false;
      socket.socket.dispose();
    }
    logger.info('All websocket disposed');
  }

  private getIndexFromCoin(coinType: string) {
    const index = this.websocketServerInfoList.findIndex(
      elem => elem.name === coinType
    );

    if (index === -1) {
      throw new Error(
        'Cannot find coinType in websocketServerInfoList: ' + coinType
      );
    }

    return index;
  }

  private getSocketInfoFromCoin(coinType: string) {
    return this.socketInfoList[this.getIndexFromCoin(coinType)];
  }

  private getAddressesFromCoin(coinType: string) {
    return this.addressesList[this.getIndexFromCoin(coinType)];
  }

  private setAddressesForCoin(coinType: string, addresses: string[]) {
    this.addressesList[this.getIndexFromCoin(coinType)] = addresses;
  }

  public async addAddressListener(coinType: string, addresses: AddressInfo[]) {
    const socketInfo = this.getSocketInfoFromCoin(coinType);
    const prevAddresses = this.getAddressesFromCoin(coinType);

    const newAddressSet = new Set([...prevAddresses]);

    for (const address of addresses) {
      this.addressWalletMap[address.address] = address.walletId;
      newAddressSet.add(address.address);
    }

    const newAddressList = Array.from(newAddressSet);

    this.setAddressesForCoin(coinType, newAddressList);

    return socketInfo.socket.subscribeAddresses(newAddressList);
  }

  public async removeAddressListener(
    coinType: string,
    addresses: AddressInfo[]
  ) {
    const socketInfo = this.getSocketInfoFromCoin(coinType);
    const prevAddresses = this.getAddressesFromCoin(coinType);

    for (const address of addresses) {
      delete this.addressWalletMap[address.address];
    }

    const newAddressList = Array.from(
      new Set(
        prevAddresses.filter(
          x => !addresses.map(elem => elem.address).includes(x)
        )
      )
    );

    this.setAddressesForCoin(coinType, newAddressList);

    return socketInfo.socket.subscribeAddresses(newAddressList);
  }

  public async subscribeBlock(coinType: string) {
    const socketInfo = this.getSocketInfoFromCoin(coinType);
    socketInfo.isSubscribedToBlock = true;

    return socketInfo.socket.subscribeBlock();
  }

  public async subscribeAllBlocks() {
    const promiseList: Array<Promise<any>> = [];
    for (const server of this.websocketServerInfoList) {
      promiseList.push(this.subscribeBlock(server.name));
    }

    const results = await Promise.allSettled(promiseList);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const serverInfo = this.websocketServerInfoList[i];
      if (result.status === 'rejected') {
        logger.error(
          'Error in subscribing block for blockbook websocket: ' +
            serverInfo.url
        );
        logger.error(result.reason);
      }
    }
  }
}
