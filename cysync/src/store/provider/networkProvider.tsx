import { getServerUrl } from '@cypherock/server-wrapper';
import axios from 'axios';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import logger from '../../utils/logger';

import { useSnackbar } from './snackbarProvider';

export interface NetworkContextInterface {
  connected: boolean | null;
  beforeNetworkAction: () => boolean;
}

export const NetworkContext: React.Context<NetworkContextInterface> =
  React.createContext<NetworkContextInterface>({} as NetworkContextInterface);

/**
 * ***************************** WARNING *****************************
 * To be only used via `Context`. Only 1 instance of useNetwokStatus
 * should be active in the whole application.
 */
export const NetworkProvider: React.FC = ({ children }) => {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState(false);

  const snackbar = useSnackbar();

  let webPing: NodeJS.Timeout | null;

  const onWebPing = async () => {
    try {
      await axios.get(getServerUrl());
      if (webPing) {
        clearTimeout(webPing);
      }
      webPing = null;
      setConnected(true);
    } catch (error) {
      setServerError(true);
      setConnected(false);
      webPing = setTimeout(onWebPing, 2000);
    }
  };

  const handleConnectionChange = () => {
    logger.info('Checking for internet connection');
    setServerError(false);
    const condition = navigator.onLine ? 'online' : 'offline';

    if (webPing) {
      clearTimeout(webPing);
      webPing = null;
    }

    if (condition === 'online') {
      webPing = setTimeout(onWebPing, 2000);
      return;
    }

    setConnected(false);
  };

  useEffect(() => {
    handleConnectionChange();

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  const beforeNetworkAction = () => {
    if (connected) return true;

    let text =
      'This action is not available due to no internet connectivity. Please check your internet connection and try again later.';

    if (serverError) {
      text =
        "Can't reach the server at the moment. Please check your internet connection and try again later.";
    }

    snackbar.showSnackbar(text, 'error', undefined, {
      dontCloseOnClickAway: true
    });

    return false;
  };

  return (
    <NetworkContext.Provider
      value={{
        connected,
        beforeNetworkAction
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

NetworkProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useNetwork(): NetworkContextInterface {
  return React.useContext(NetworkContext);
}
