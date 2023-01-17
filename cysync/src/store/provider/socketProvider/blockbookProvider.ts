import { EventEmitter } from 'events';

import logger from '../../../utils/logger';

import Socket from './websocket';

export interface WebSocketServerInfo {
  coinId: string;
  name: string;
  url: string;
}

export interface AddressAccountMap {
  [key: string]: string | undefined;
}

export interface AddressInfo {
  address: string;
  accountId: string;
}

interface SocketInfo {
  socket: Socket;
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

  private addressAccountMap: AddressAccountMap = {};

  constructor(serverInfo: WebSocketServerInfo[]) {
    super();
    if (serverInfo.length <= 0) {
      throw new Error('No websocket server info provided');
    }

    this.websocketServerInfoList = [...serverInfo];

    for (const server of this.websocketServerInfoList) {
      const socket = new Socket({
        url: server.url,
        coinId: server.coinId,
        keepAlive: true
      });

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
      this.onNotification.bind(this, socketInfo.info.coinId)
    );
    socketInfo.socket.addListener(
      'block',
      this.onBlock.bind(this, socketInfo.info.coinId)
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
        await this.subscribeBlock(socketInfo.info.coinId);
      }

      await this.addAddressListener(socketInfo.info.coinId, []);
    } catch (error) {
      logger.error('Unable to establishPreviousSocketState');
      logger.error(error);
    }
  }

  public getAccountIdFromAddress(address: string) {
    return this.addressAccountMap[address];
  }

  public onNotification(coinId: string, params: any) {
    this.emit('txn', { coinId, txn: params.tx, address: params.address });
  }

  public onBlock(coinId: string, params: any) {
    this.emit('block', { coinId, ...params });
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
    this.addressAccountMap = {};
    for (const socket of this.socketInfoList) {
      socket.doConnect = false;
      socket.socket.dispose();
    }
    logger.info('All websocket disposed');
  }

  private getIndexFromCoin(coinId: string) {
    const index = this.websocketServerInfoList.findIndex(
      elem => elem.coinId === coinId
    );

    if (index === -1) {
      throw new Error(
        'Cannot find coinId in websocketServerInfoList: ' + coinId
      );
    }

    return index;
  }

  private getSocketInfoFromCoin(coinId: string) {
    return this.socketInfoList[this.getIndexFromCoin(coinId)];
  }

  private getAddressesFromCoin(coinId: string) {
    return this.addressesList[this.getIndexFromCoin(coinId)];
  }

  private setAddressesForCoin(coinId: string, addresses: string[]) {
    this.addressesList[this.getIndexFromCoin(coinId)] = addresses;
  }

  public async addAddressListener(coinId: string, addresses: AddressInfo[]) {
    const socketInfo = this.getSocketInfoFromCoin(coinId);
    const prevAddresses = this.getAddressesFromCoin(coinId);

    const newAddressSet = new Set([...prevAddresses]);

    for (const address of addresses) {
      this.addressAccountMap[address.address] = address.accountId;
      newAddressSet.add(address.address);
    }

    const newAddressList = Array.from(newAddressSet);

    this.setAddressesForCoin(coinId, newAddressList);

    return socketInfo.socket.subscribeAddresses(newAddressList);
  }

  public async removeAddressListener(coinId: string, addresses: AddressInfo[]) {
    const socketInfo = this.getSocketInfoFromCoin(coinId);
    const prevAddresses = this.getAddressesFromCoin(coinId);

    for (const address of addresses) {
      delete this.addressAccountMap[address.address];
    }

    const newAddressList = Array.from(
      new Set(
        prevAddresses.filter(
          x => !addresses.map(elem => elem.address).includes(x)
        )
      )
    );

    this.setAddressesForCoin(coinId, newAddressList);

    return socketInfo.socket.subscribeAddresses(newAddressList);
  }

  public async subscribeBlock(coinId: string) {
    const socketInfo = this.getSocketInfoFromCoin(coinId);
    socketInfo.isSubscribedToBlock = true;

    return socketInfo.socket.subscribeBlock();
  }

  public async subscribeAllBlocks() {
    const promiseList: Array<Promise<any>> = [];
    for (const server of this.websocketServerInfoList) {
      promiseList.push(this.subscribeBlock(server.coinId));
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
