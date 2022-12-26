import { EventEmitter } from 'events';

import logger from '../../../../utils/logger';
import { coinPriceDb } from '../../../database';

import {
  AddressNotification,
  BlockNotification,
  FiatRatesNotification
} from './types';

interface Deferred<T> {
  id: number | string;
  resolve: (val?: T) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

function createDeferred<T>(id: number | string): Deferred<any> {
  let localResolve = (_t: T) => {
    //empty
  };
  let localReject = (_e: any) => {
    //empty
  };

  const promise = new Promise<T>((resolve, reject) => {
    localResolve = resolve;
    localReject = reject;
  });

  return {
    id,
    resolve: localResolve,
    reject: localReject,
    promise
  };
}

const NOT_INITIALIZED = new Error('websocket_not_initialized');

interface Subscription {
  id: string;
  type: 'notification' | 'block' | 'fiatRates';
  callback: (result: any) => void;
}

interface Options {
  url: string;
  coinType: string;
  timeout?: number;
  pingTimeout?: number;
  pongTimeout?: number;
  keepAlive?: boolean;
}

const DEFAULT_TIMEOUT = 20 * 1000;
const DEFAULT_PING_TIMEOUT = 30 * 1000;
const DEFAULT_PONG_TIMEOUT = 45 * 1000;

export default class Socket extends EventEmitter {
  options: Options;
  ws: WebSocket | undefined;
  messageID = 0;
  messages: Array<Deferred<any>> = [];
  subscriptions: Subscription[] = [];
  // Timeout to send a ping request at a timeout
  pingTimeout: ReturnType<typeof setTimeout> | undefined;
  // Timeout to receive a pong request, if not received the connection is marked as dead
  pongTimeout: ReturnType<typeof setTimeout> | undefined;
  // Timeout for the initial connection
  connectionTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(options: Options) {
    super();
    this.setMaxListeners(Infinity);
    this.options = options;
  }

  setConnectionTimeout() {
    this.clearConnectionTimeout();
    this.connectionTimeout = setTimeout(
      this.onTimeout.bind(this),
      this.options.timeout || DEFAULT_TIMEOUT
    );
  }

  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;
    }
  }

  setPingTimeout() {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }
    this.pingTimeout = setTimeout(
      this.onPing.bind(this),
      this.options.pingTimeout || DEFAULT_PING_TIMEOUT
    );
  }

  setPongTimeout() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }
    this.pongTimeout = setTimeout(
      this.onPong.bind(this),
      this.options.pongTimeout || DEFAULT_PONG_TIMEOUT
    );
  }

  onTimeout() {
    const { ws } = this;
    if (!ws) return;
    this.messages.forEach(m => m.reject(new Error('websocket_timeout')));
    ws.close();
  }

  // Close the connection when no pong is received
  async onPong() {
    logger.error('Websocket closed due to no response from server', {
      url: this.options.url
    });
    this.emit('disconnected');
    this.dispose();
  }

  async onPing() {
    // make sure that connection is alive if there are subscriptions
    if (this.ws && this.isConnected()) {
      if (this.subscriptions.length > 0 || this.options.keepAlive) {
        if (this.options.coinType !== 'btct') {
          const latestPrice = await this.getCurrentFiatRates();
          this.updateLatestPriceDatabase(latestPrice);
        } else {
          await this.getBlockHash(0);
        }
      } else {
        try {
          this.ws.close();
        } catch (error) {
          // empty
        }
      }
    }
  }

  onError() {
    this.dispose();
  }

  send = (method: string, params = {}) => {
    const { ws } = this;
    if (!ws) throw NOT_INITIALIZED;
    const id = this.messageID.toString();

    const dfd = createDeferred(id);
    const req = {
      id,
      method,
      params
    };

    this.messageID++;
    this.messages.push(dfd);

    this.setPingTimeout();
    ws.send(JSON.stringify(req));
    return dfd.promise as Promise<any>;
  };

  onmessage(message: MessageEvent) {
    try {
      const resp = JSON.parse(message.data);
      const { id, data } = resp;
      const dfd = this.messages.find(m => m.id === id);
      if (dfd) {
        if (data.error) {
          dfd.reject(
            new Error('websocket_error_message : ' + data.error.message)
          );
        } else {
          dfd.resolve(data);
        }
        this.messages.splice(this.messages.indexOf(dfd), 1);
      } else {
        const subs = this.subscriptions.find(s => s && s.id === id);
        if (subs) {
          subs.callback(data);
        }
      }
    } catch (error) {
      logger.error('Error on decoding websocket message');
      logger.error(error);
    }

    if (this.messages.length === 0) {
      this.clearConnectionTimeout();
    }
    this.setPingTimeout();
    this.setPongTimeout();
  }

  onclose(_event: any) {
    logger.info('Websocket closed', { url: this.options.url });
    this.emit('disconnected');
    this.dispose();
  }

  connect() {
    let { url } = this.options;
    if (typeof url !== 'string') {
      throw new Error('websocket_no_url');
    }

    if (url.startsWith('https')) {
      url = url.replace('https', 'wss');
    }
    if (url.startsWith('http')) {
      url = url.replace('http', 'ws');
    }
    if (!url.endsWith('/websocket')) {
      const suffix = url.endsWith('/') ? 'websocket' : '/websocket';
      url += suffix;
    }

    // set connection timeout before WebSocket initialization
    // it will be be cancelled by this.init or this.dispose after the error
    this.setConnectionTimeout();

    // create deferred promise
    const dfd = createDeferred<void>(-1);

    const ws = new WebSocket(url);
    ws.onerror = (_event: Event) => {
      this.dispose();
      dfd.reject(new Error('websocket_runtime_error: '));
    };
    ws.onopen = () => {
      this.init();
      dfd.resolve();
    };
    ws.onclose = () => {
      this.dispose();
    };

    this.ws = ws;

    // wait for onopen event
    return dfd.promise;
  }

  init() {
    const { ws } = this;
    if (!ws || !this.isConnected()) {
      throw Error('Blockbook websocket init cannot be called');
    }
    this.clearConnectionTimeout();
    this.setPongTimeout();

    ws.onerror = this.onError.bind(this);
    ws.onmessage = this.onmessage.bind(this);
    ws.onclose = this.onclose.bind(this);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  isConnected() {
    const { ws } = this;
    return ws && ws.readyState === WebSocket.OPEN;
  }

  getServerInfo() {
    return this.send('getInfo');
  }

  getBlockHash(block: number) {
    return this.send('getBlockHash', { height: block });
  }

  getCurrentFiatRates() {
    return this.send('getCurrentFiatRates', { currency: 'usd' });
  }

  updateLatestPriceDatabase = async (latestPrice: {
    rates: { usd: number };
    ts: number;
  }) => {
    try {
      const price = latestPrice.rates.usd;
      const priceLastUpdatedAt = latestPrice.ts;

      await coinPriceDb.findAndUpdate(
        { slug: this.options.coinType },
        { price, priceLastUpdatedAt }
      );
    } catch (e) {
      logger.error('Error occurred while updating latest price', e);
    }
  };

  subscribeAddresses(addresses: string[]) {
    const index = this.subscriptions.findIndex(s => s.type === 'notification');
    if (index >= 0) {
      // remove previous subscriptions
      this.subscriptions.splice(index, 1);
    }
    // add new subscription
    const id = this.messageID.toString();
    this.subscriptions.push({
      id,
      type: 'notification',
      callback: (result: AddressNotification) => {
        this.emit('notification', result);
      }
    });
    return this.send('subscribeAddresses', { addresses });
  }

  unsubscribeAddresses() {
    const index = this.subscriptions.findIndex(s => s.type === 'notification');
    if (index >= 0) {
      // remove previous subscriptions
      this.subscriptions.splice(index, 1);
      return this.send('unsubscribeAddresses');
    }
    return { subscribed: false };
  }

  subscribeBlock() {
    const index = this.subscriptions.findIndex(s => s.type === 'block');
    if (index >= 0) {
      // remove previous subscriptions
      this.subscriptions.splice(index, 1);
    }
    // add new subscription
    const id = this.messageID.toString();
    this.subscriptions.push({
      id,
      type: 'block',
      callback: (result: BlockNotification) => {
        this.emit('block', result);
      }
    });
    return this.send('subscribeNewBlock');
  }

  unsubscribeBlock() {
    const index = this.subscriptions.findIndex(s => s.type === 'block');
    if (index >= 0) {
      // remove previous subscriptions
      this.subscriptions.splice(index, 1);
      return this.send('unsubscribeNewBlock');
    }
    return { subscribed: false };
  }

  subscribeFiatRates(currency?: string) {
    const index = this.subscriptions.findIndex(s => s.type === 'fiatRates');
    if (index >= 0) {
      // remove previous subscriptions
      this.subscriptions.splice(index, 1);
    }
    // add new subscription
    const id = this.messageID.toString();
    this.subscriptions.push({
      id,
      type: 'fiatRates',
      callback: (result: FiatRatesNotification) => {
        this.emit('fiatRates', result);
      }
    });
    return this.send('subscribeFiatRates', { currency });
  }

  unsubscribeFiatRates() {
    const index = this.subscriptions.findIndex(s => s.type === 'fiatRates');
    if (index >= 0) {
      // remove previous subscriptions
      this.subscriptions.splice(index, 1);
      return this.send('unsubscribeFiatRates');
    }
    return { subscribed: false };
  }

  dispose() {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    const { ws } = this;
    if (this.isConnected()) {
      this.disconnect();
    }
    if (ws) {
      ws.onerror = undefined;
      ws.onclose = undefined;
      ws.onmessage = undefined;
      ws.onopen = undefined;
    }

    this.removeAllListeners();
  }
}
