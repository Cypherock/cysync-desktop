import PropTypes from 'prop-types';
import React from 'react';

import {
  ConnectionProvider,
  FeedbackProvider,
  NetworkProvider,
  NotificationProvider,
  SnackbarProvider,
  SocketProvider,
  SyncProvider,
  TutorialProvider
} from '.';

const GlobalProvider = ({ children }: any) => {
  return (
    <SnackbarProvider>
      <NetworkProvider>
        <ConnectionProvider>
          <NotificationProvider>
            <TutorialProvider>
              {/* SocketProvider is using SyncProvider */}
              <SyncProvider>
                <SocketProvider>
                  <FeedbackProvider>{children}</FeedbackProvider>
                </SocketProvider>
              </SyncProvider>
            </TutorialProvider>
          </NotificationProvider>
        </ConnectionProvider>
      </NetworkProvider>
    </SnackbarProvider>
  );
};

GlobalProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default GlobalProvider;
