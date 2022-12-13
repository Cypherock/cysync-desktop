import PropTypes from 'prop-types';
import React from 'react';

import {
  ConnectionProvider,
  DiscreetModeProvider,
  FeedbackProvider,
  NetworkProvider,
  NotificationProvider,
  SnackbarProvider,
  SocketProvider,
  SyncProvider,
  TutorialProvider,
  UpdateProvider
} from '.';
import { TransactionStatusProvider } from './transactionStatusProvider';

const GlobalProvider = ({ children }: any) => {
  return (
    <DiscreetModeProvider>
      <SnackbarProvider>
        <NetworkProvider>
          <ConnectionProvider>
            <NotificationProvider>
              <TutorialProvider>
                {/* SocketProvider is using SyncProvider */}
                <SyncProvider>
                  <SocketProvider>
                    <FeedbackProvider>
                      <TransactionStatusProvider>
                        <UpdateProvider>{children}</UpdateProvider>
                      </TransactionStatusProvider>
                    </FeedbackProvider>
                  </SocketProvider>
                </SyncProvider>
              </TutorialProvider>
            </NotificationProvider>
          </ConnectionProvider>
        </NetworkProvider>
      </SnackbarProvider>
    </DiscreetModeProvider>
  );
};

GlobalProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default GlobalProvider;
