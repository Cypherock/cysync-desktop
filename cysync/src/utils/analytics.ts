import crypto from 'crypto';
import { v4 as uuid } from 'uuid';

import { version as appVersion } from '../../package.json';

import logger from './logger';

const analyticsVersion = '1.0.0';

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

  private stopAnalytics = false;

  private analyticsDisabled =
    localStorage.getItem('disableAnalytics') === 'true';

  private analyticsSetupDone = false;

  private cysyncSetupTime: number | undefined = undefined;

  public static createHash(str: string) {
    if (!str) return undefined;
    const hash = crypto.createHash('sha256').update(str).digest('hex');
    return hash;
  }

  public static EVENTS = {
    APP: {
      STARTED: 'Application Started',
      CLOSED: 'Application Closed',
      ERROR: 'Application Error',
      CRASHED: 'Application Crashed'
    },
    DEVICE_CONNECTION: {
      CONNECTED: 'Device connected on cysync',
      ERROR_PROMPT: {
        OPEN_FROM_NAVBAR: 'Device connection error prompt opened from navbar',
        OPEN: 'Device connection error prompt displayed',
        CLOSED: 'Device connection error prompt closed',
        ACTION_CONFIRMED: 'Device connection error prompt action confirmed'
      },
      RETRY: 'Device connection retry clicked',
      ERROR: 'Device connection error',
      INITIAL_FLOW_IN_MAIN: {
        DEVICE_AUTH: {
          OPENED: 'Device auth opened on main for initial',
          CLOSED: 'Device auth closed on main for initial',
          SUCCESS: 'Device auth successful on main for initial',
          ERROR: 'Device auth error on main for initial',
          COMPROMISED: 'Device auth compromised on main for initial',
          RETRY: 'Device auth retry on main for initial'
        },
        CARD_AUTH: {
          OPENED: 'Card auth opened on main for initial',
          CLOSED: 'Card auth closed on main for initial',
          SUCCESS: 'Card auth successful on main for initial',
          ERROR: 'Card auth error on main for initial',
          COMPROMISED: 'Card auth compromised on main for initial',
          RETRY: 'Card auth retry on main for initial'
        },
        DEVICE_UPGRADE: {
          OPENED: 'Device upgrade opened on main for initial',
          CLOSED: 'Device upgrade closed on main for initial',
          SUCCESS: 'Device upgraded successful on main for initial',
          ERROR: 'Device upgrade error on main for initial',
          AUTH_FAILED: 'Device upgrade failed in auth step on main for initial',
          RETRY: 'Device upgrade retry on main for initial'
        }
      }
    },
    INITIAL: {
      ALREADY_HAVE_DEVICE: 'Already have device on initial',
      PURCHASE_DEVICE: 'Purchase device on initial',

      TERMS_ACCEPTED: 'Terms accepted',

      PASSWORD_SKIP: 'Password skipped on initial',
      PASSWORD_SET: 'Password set on initial',
      PASSWORD_VALIDATION_ERROR: 'Password validation error on initial',

      DEVICE_SETUP: {
        DEVICE_AUTH: {
          OPENED: 'Device auth opened on initial',
          CLOSED: 'Device auth closed on initial',
          SUCCESS: 'Device auth successful on initial',
          ERROR: 'Device auth error on initial',
          COMPROMISED: 'Device auth compromised on initial',
          RETRY: 'Device auth retry on initial'
        },
        CARD_AUTH: {
          OPENED: 'Card auth opened on initial',
          CLOSED: 'Card auth closed on initial',
          SUCCESS: 'Card auth successful on initial',
          ERROR: 'Card auth error on initial',
          COMPROMISED: 'Card auth compromised on initial',
          RETRY: 'Card auth retry on initial'
        },
        DEVICE_UPGRADE: {
          OPENED: 'Device upgrade opened on initial',
          CLOSED: 'Device upgrade closed on initial',
          SUCCESS: 'Device upgraded successful on initial',
          ERROR: 'Device upgrade error on initial',
          AUTH_FAILED: 'Device upgrade failed in auth step on initial',
          RETRY: 'Device upgrade retry on initial'
        }
      }
    },
    PORTFOLIO: {
      GRAPH: {
        TIME_CHANGE: 'Time range changed on portfolio graph',
        WALLET_CHANGE: 'Wallet changed on portfolio graph',
        COIN_CHANGE: 'Coin changed on portfolio graph'
      },
      IMPORT_WALLET: 'Import wallet clicked on portfolio'
    },
    NAVBAR: {
      DISCREET_MODE: {
        ON: 'Discreet Mode On',
        OFF: 'Discreet Mode OFF'
      },
      NOTIFICATION: {
        OPEN_DIALOG: 'Notification dialog open',
        LOAD_MORE: 'Notification load more',
        ERROR: 'Error loading notification',
        CLICK: 'Notification item clicked'
      },
      DEVICE_CONNECTION: {
        CLICKED: 'Device connection error clicked on navbar'
      }
    },
    FEEDBACK: {
      OPENED: 'Feedback dialog opened',
      SUBMITTED: 'Feedback submitted',
      CLOSED: 'Feedback dialog closed',
      ERROR: 'Feedback submitting failed',
      OPENED_FROM_SIDEBAR: 'Feedback opened from sidebar',
      DEVICE_LOGS: {
        INITIATED: 'Attach device logs initiated',
        ERROR: 'Attach device logs error',
        SUCCESS: 'Attach device logs success'
      }
    },
    WALLET: {
      IMPORT_WALLET: {
        OPEN: 'Import wallet form open',
        CLOSED: 'Import wallet form closed',
        ERROR: 'Import wallet error',
        SUCCESS: 'Import wallet success',
        ADD_COIN: 'Add coin clicked from add wallet form'
      },
      ADD_COIN: {
        OPEN: 'Add coin form open',
        CLOSED: 'Add coin form closed',
        ERROR: 'Add coin error',
        SUCCESS: 'Add coin success',
        PARTIAL_ERROR: 'Add coin partial error',
        RETRY: 'Add coin retry'
      },
      RECEIVE: {
        OPEN: 'Receive coin form open',
        WITHOUT_DEVICE: 'Receive coin form open without device',
        CLOSED: 'Receive coin form closed',
        ERROR: 'Receive coin error',
        SUCCESS: 'Receive coin success'
      },
      SEND: {
        OPEN: 'Send coin form open',
        CLOSED: 'Send coin form closed',
        ERROR: 'Send coin error',
        SUCCESS: 'Send coin success',
        BROADCAST_ERROR: 'Send coin broadcast error',
        RETRY_BROADCAST: 'Send coin broadcast retry'
      },
      ADD_ACCOUNT: {
        OPEN: 'Add account form open',
        CLOSED: 'Add account form closed',
        ERROR: 'Add account error',
        SUCCESS: 'Add account success',
        BROADCAST_ERROR: 'Add account broadcast error',
        RETRY_BROADCAST: 'Add account broadcast retry'
      },
      BALANCE: {
        UPDATED: 'Track Balance update'
      },
      TXN: {
        TRACK: 'Track transaction'
      }
    },
    SETTINGS: {
      GENERAL_SETTINGS: {
        CLEAR_DATA: {
          CLICKED: 'Clear data clicked on settings',
          SUCCESS: 'Clear data completed from settings'
        },
        ANALYTICS: {
          ENABLED: 'Analytics enabled',
          DISABLED: 'Analytics disabled'
        }
      },
      DEVICE_SETTINGS: {
        DEVICE_UPGRADE: {
          OPEN: 'Device upgrade open on main',
          STARTED: 'Device upgrade started on main',
          CLOSED: 'Device upgrade closed on main',
          ERROR: 'Device upgrade error on main',
          SUCCESS: 'Device upgrade success on main',
          AUTH_FAILED: 'Device upgrade failed in auth step on main',
          RETRY: 'Device upgrade retry on main'
        },
        DEVICE_AUTH: {
          OPENED: 'Device auth opened on main',
          CLOSED: 'Device auth closed on main',
          SUCCESS: 'Device auth successful on main',
          ERROR: 'Device auth error on main',
          COMPROMISED: 'Device auth compromised on main',
          RETRY: 'Device auth retry on main'
        },
        CARD_AUTH: {
          OPENED: 'Card auth opened on main',
          CLOSED: 'Card auth closed on main',
          SUCCESS: 'Card auth successful on main',
          ERROR: 'Card auth error on main',
          COMPROMISED: 'Card auth compromised on main',
          RETRY: 'Card auth retry on main'
        }
      }
    },
    DATABASE_CLEANUP: {
      PROMPT_DISPLAYED: 'Database cleanup prompt displayed',
      CLEAR_DATA_CLICKED: 'Clear data clicked on database cleanup prompt',
      PROMPT_CLOSED: 'Database cleanup prompt closed'
    }
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

  public get isAnalyticsAllowed() {
    const isAllowed = !(this.stopAnalytics || this.analyticsDisabled);

    return isAllowed;
  }

  public get cysyncInitializedTime() {
    return this.cysyncSetupTime || 0;
  }

  public toggleDisable(val: boolean) {
    this.analyticsDisabled = val;
  }

  private setAnalyticsTime() {
    const KEYNAME = 'cysyncSetupTime';

    const time = localStorage.getItem(KEYNAME);

    if (time) {
      const tempTime = new Date(parseInt(time, 10));
      if (!Number.isNaN(tempTime.getTime())) {
        this.cysyncSetupTime = tempTime.getTime();
        return;
      }
    }

    this.cysyncSetupTime = new Date().getTime();
    localStorage.setItem(KEYNAME, this.cysyncSetupTime.toString());
  }

  public async setup() {
    if (this.analyticsSetupDone) {
      return;
    }

    this.setAnalyticsTime();

    // Stop analytics on development mode
    // this.stopAnalytics = process.env.NODE_ENV === 'development';

    if (this.stopAnalytics) {
      logger.info('Analytics stopped');
      return;
    }

    const head = document.querySelector('head');
    const script = document.createElement('script');

    const analyticsKey = process.env.ANALYTICS_KEY;

    script.innerHTML = `
  !function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._loadOptions=e};analytics._writeKey="${analyticsKey}";;analytics.SNIPPET_VERSION="4.15.3";
  analytics.load("${analyticsKey}", {
    integrations: {
      "Segment.io": {
        deliveryStrategy: {
          strategy: "batching",
          config: {
            size: 15,
            timeout: 5000
          }
        }
      }
    }
  });

  ${
    this.isAnalyticsAllowed &&
    `
    analytics.page("App Started", { appVersion: "${appVersion}", analyticsVersion: "${analyticsVersion}" });
    analytics.identify({ appVersion: "${appVersion}", analyticsVersion: "${analyticsVersion}"});
  `
  }
  }}();
    `;
    head.appendChild(script);
    this.analyticsSetupDone = true;
  }

  public get analytics(): any {
    const win = window as any;

    return win.analytics;
  }

  public event(
    name: string,
    params: any = {},
    options?: { isSensitive: boolean }
  ) {
    try {
      if (!this.isAnalyticsAllowed) return;
      if (!this.analytics) {
        logger.warn('Analytics not defined.');
        return;
      }

      const anOptions: any = {};
      if (options?.isSensitive) {
        anOptions.integrations = {
          Mixpanel: false
        };
      }

      this.analytics.track(
        name,
        {
          appVersion,
          analyticsVersion,
          ...params
        },
        anOptions
      );
    } catch (error) {
      logger.error('Error in event analytics');
      logger.error(error);
    }
  }

  public screenView(screenName: string, params: any = {}) {
    try {
      if (!this.isAnalyticsAllowed) return;
      if (!this.analytics) {
        logger.warn('Analytics not defined.');
        return;
      }

      this.analytics.page(screenName, {
        title: screenName,
        appVersion,
        analyticsVersion,
        ...params
      });
    } catch (error) {
      logger.error('Error in screen view analytics');
      logger.error(error);
    }
  }
}

export default Analytics;
