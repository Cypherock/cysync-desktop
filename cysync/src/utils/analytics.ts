import ua from 'universal-analytics';
import { v4 as uuid } from 'uuid';

import { version } from '../../package.json';

import logger from './logger';

export const getAnalyticsId = () => {
  let clientId = localStorage.getItem('analytics-id');
  if (!clientId) {
    clientId = uuid();
    localStorage.setItem('analytics-id', clientId);
  }
  return clientId;
};

class Analytics {
  private static instance: Analytics = new Analytics();

  private analyticsInstance: any;

  private stopAnalytics = false;

  public static Categories = {
    RESYNC_COIN: 'Resync Coin',
    ADD_WALLET: 'Add Wallet',
    ADD_COIN: 'Add Coin',
    RECEIVE_ADDR: 'Receive Address',
    ESTIMATE_FEE: 'Estimate Fee',
    ESTIMATE_GAS_LIMIT: 'Estimate Gas Limit',
    SEND_TXN: 'Send Transaction',
    FEEDBACK: 'Feedback',
    CARD_AUTH: 'Card Authentication',
    DEVICE_INFO: 'Device Info',
    DEVICE_UPDATE: 'Device Update',
    DEVICE_AUTH: 'Device Authentication',
    PARTIAL_DEVICE_UPDATE: 'Partial Device Update',
    DEVICE_AUTH_PROMPT: 'Device Auth Prompt',
    ERROR_BOUNDARY: 'Error boundary',
    FETCH_LOG: 'Fetch Log',
    INITIAL_FLOW_IN_MAIN: 'Initial Flow In Main',
    INITIAL_CARD_AUTH: 'Initial Card Auth',
    INITIAL_CARD_AUTH_IN_MAIN: 'Initial Card Auth In Main',
    INITIAL_DEVICE_AUTH: 'Initial Device Auth',
    INITIAL_DEVICE_AUTH_IN_MAIN: 'Initial Device Auth In Main',
    INITIAL_DEVICE_UPDATE: 'Initial Device Update',
    INITIAL_DEVICE_UPDATE_IN_MAIN: 'Initial Device Update In Main',
    BOOTLOADER_CHECK: 'Bootloader check',
    NAVBAR_DEVICE_CONNECTED: 'Navbar Device connected',
    RETRY_DEVICE_CONNECTION: 'Retry Device connection',
    DATABASE_CLEANUP: 'Database cleaup'
  };

  public static Actions = {
    CLICKED: 'Clicked',
    INITIATED: 'Initiated',
    PROMPT: 'Prompt',
    OPEN: 'Open',
    CLOSED: 'Closed',
    COMPLETED: 'Completed',
    ERROR: 'Error',
    BROADCAST_ERROR: 'Broadcast Error',
    RETRY: 'Retry'
  };

  public static ScreenViews = {
    INITAL_DEVICE_SETUP: 'Initial Device Setup',
    LOCKSCREEN: 'Lockscreen',
    INITIAL_FLOW: 'Initial Flow',
    PORTFOLIO: 'Portfolio',
    LAST_TRANSACTIONS: 'Transactions',
    WALLET: 'Wallet',
    ADD_WALLET: 'Add Wallet',
    TUTORIAL: 'Tutorial',
    SETTINGS: 'Settings',
    DEVICE_SETTINGS: 'Device Settings',
    ABOUT_SETTINGS: 'About Settings',
    GENERAL_SETTINGS: 'General Settings'
  };

  public static get Instance() {
    if (this.instance) return this.instance;

    this.instance = new this();
    return this.instance;
  }

  public async setup() {
    if (this.analyticsInstance) return;

    // Stop analytics on development mode
    this.stopAnalytics = process.env.NODE_ENV === 'development';

    const clientId = getAnalyticsId();

    this.analyticsInstance = ua('UA-155315720-3', clientId);
  }

  public get analytics(): any {
    return this.analyticsInstance;
  }

  public event(
    category: string,
    action: string,
    label?: string,
    value?: number
  ) {
    if (this.stopAnalytics) return;
    if (!this.analytics) {
      logger.info('Analytics not defined.');
      return;
    }

    let internalLabel = version;
    if (label) {
      internalLabel += `|${label}`;
    }

    this.analytics
      .event(category, action, internalLabel, value, (err: any) => {
        if (err) {
          logger.error(err);
        }
      })
      .send();
  }

  public screenView(screenName: string) {
    if (this.stopAnalytics) return;
    if (!this.analytics) {
      logger.info('Analytics not defined.');
      return;
    }

    this.analytics
      .screenview(screenName, 'CyCync', version, (err: any) => {
        if (err) {
          logger.error(err);
        }
      })
      .send();
  }
}

export default Analytics;
