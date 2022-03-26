import PropTypes from 'prop-types';
import React, { useState } from 'react';

import logger from '../../utils/logger';
import { Notification, notificationDb as NotificationDB } from '../database';

export interface NotificationContextInterface {
  data: Notification[];
  hasNextPage: boolean;
  isLoading: boolean;
  getLatest: () => Promise<void>;
  getNextPage: () => Promise<void>;
  hasUnread: boolean;
  markAllRead: () => Promise<void>;
}

export const NotificationContext: React.Context<NotificationContextInterface> =
  React.createContext<NotificationContextInterface>(
    {} as NotificationContextInterface
  );

export const NotificationProvider: React.FC = ({ children }) => {
  const perPageLimit = 3;
  const [notifications, setNotifications] = useState<
    NotificationContextInterface['data']
  >([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const markAllRead = async () => {
    try {
      logger.info('Marking all notifications as read');
      await NotificationDB.markAllAsRead();
      setHasUnread(false);
    } catch (error) {
      logger.error('Error in marking all notifications as read');
      logger.log(error);
    }
  };

  const getLatest = async () => {
    setIsLoading(true);
    try {
      logger.info('Fetching latest notifications');
      const res = await NotificationDB.getLatest(perPageLimit);
      setNotifications(res.notifications);
      setHasNextPage(res.hasNext);
      setHasUnread(res.hasUnread);
    } catch (error) {
      logger.error('Error in fetching latest notifications');
      logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNextPage = async () => {
    setIsLoading(true);
    try {
      logger.info('Fetching next page notifications');
      let lastNotif: any;

      if (notifications.length > 0)
        lastNotif = notifications[notifications.length - 1];

      const res = await NotificationDB.getAll(
        lastNotif,
        notifications.length,
        perPageLimit
      );

      setNotifications([...notifications, ...res.notifications]);

      setHasNextPage(res.hasNext);
    } catch (error) {
      logger.error('Error in fetching next page notifications');
      logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        data: notifications,
        hasNextPage,
        isLoading,
        getLatest,
        getNextPage,
        hasUnread,
        markAllRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useNotifications(): NotificationContextInterface {
  return React.useContext(NotificationContext);
}
