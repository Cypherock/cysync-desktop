import React, { useEffect } from 'react';

import {
  FeedbackProvider,
  SnackbarProvider,
  useFeedback
} from '../store/provider';
import Analytics from '../utils/analytics';
import logger from '../utils/logger';
import reportCrash from '../utils/reportCrash';
import getUuid from '../utils/uuid';

const OpenFeedback: React.FC = () => {
  const { showFeedback } = useFeedback();

  useEffect(() => {
    showFeedback({ disableDeviceLogs: true });
  }, []);

  return null;
};

class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
  static async reportCrashToServer(description: string) {
    try {
      logger.info('Reporting crash from error boundary');
      await reportCrash({
        subject: 'Crash Report from error boundary',
        uuid: await getUuid(),
        description,
        email: localStorage.getItem('email') || ''
      });
    } catch (error) {
      logger.error('Error in sending crash report');
      logger.error(error);
    }
  }

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ hasError: true });
    Analytics.Instance.event(
      Analytics.Categories.ERROR_BOUNDARY,
      Analytics.Actions.PROMPT
    );
    if (process.env.NODE_ENV === 'development') {
      /* tslint:disable-next-line */
      console.log({ error, errorInfo });
    }
    logger.error('Error caught in error boundary', { error, errorInfo });
    ErrorBoundary.reportCrashToServer(JSON.stringify({ error, errorInfo }));
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <SnackbarProvider>
          <FeedbackProvider>
            <OpenFeedback />
          </FeedbackProvider>
        </SnackbarProvider>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
