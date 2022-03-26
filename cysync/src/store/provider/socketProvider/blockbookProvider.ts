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

export default class BlockbookProvider extends EventEmitter {
  private websocketServerInfoList: WebSocketServerInfo[];
  private socketList: BlockbookSocket[] = [];

  private addressesList: string[][] = [];

  private addressWalletMap: AddressWalletMap = {};

  constructor(serverInfo: WebSocketServerInfo[]) {
    super();
    if (serverInfo.length <= 0) {
      throw new Error('No websocket server info provided');
    }

    this.websocketServerInfoList = [...serverInfo];

    for (const server of this.websocketServerInfoList) {
      const socket = new BlockbookSocket({ url: server.url });

      this.socketList.push(socket);
      this.addressesList.push([]);

      socket.addListener(
        'notification',
        this.onNotification.bind(this, server.name)
      );
      socket.addListener('block', this.onBlock.bind(this, server.name));
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
      ...this.socketList.map(socket => socket.connect())
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
    for (const socket of this.socketList) {
      socket.dispose();
    }
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

  private getSocketFromCoin(coinType: string) {
    return this.socketList[this.getIndexFromCoin(coinType)];
  }

  private getAddressesFromCoin(coinType: string) {
    return this.addressesList[this.getIndexFromCoin(coinType)];
  }

  private setAddressesForCoin(coinType: string, addresses: string[]) {
    this.addressesList[this.getIndexFromCoin(coinType)] = addresses;
  }

  public async addAddressListener(coinType: string, addresses: AddressInfo[]) {
    const socket = this.getSocketFromCoin(coinType);
    const prevAddresses = this.getAddressesFromCoin(coinType);

    const newAddressSet = new Set([...prevAddresses]);

    for (const address of addresses) {
      this.addressWalletMap[address.address] = address.walletId;
      newAddressSet.add(address.address);
    }

    const newAddressList = Array.from(newAddressSet);

    this.setAddressesForCoin(coinType, newAddressList);

    return socket.subscribeAddresses(newAddressList);
  }

  public async removeAddressListener(
    coinType: string,
    addresses: AddressInfo[]
  ) {
    const socket = this.getSocketFromCoin(coinType);
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

    return socket.subscribeAddresses(newAddressList);
  }

  public async subscribeBlock(coinType: string) {
    const socket = this.getSocketFromCoin(coinType);

    return socket.subscribeBlock();
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
