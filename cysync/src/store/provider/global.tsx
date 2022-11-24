import PropTypes from 'prop-types';
import React from 'react';

import {
  ConnectionProvider,
  DiscreetModeProvider,
  FeedbackProvider,
  NetworkProvider,
  NotificationProvider,
  SnackbarProvider,
  SyncProvider,
  TutorialProvider
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
                <SyncProvider>
                  <FeedbackProvider>
                    <TransactionStatusProvider>
                      {children}
                    </TransactionStatusProvider>
                  </FeedbackProvider>
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
