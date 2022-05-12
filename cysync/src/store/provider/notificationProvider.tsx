import PropTypes from 'prop-types';
import React, { useState } from 'react';

import logger from '../../utils/logger';
import { Notification2, notificationDb2 as NotificationDB } from '../database';
import { notification as NotificationServer } from '@cypherock/server-wrapper';

export interface NotificationContextInterface {
  data: Notification2[];
  hasNextPage: boolean;
  isLoading: boolean;
  updateLatest: () => Promise<void>;
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

  const updateLatest = async () => {
    setIsLoading(true);
    try {
      logger.info('Fetching latest notifications from server');
      const lastNotification = await NotificationDB.getLastId();
      const res = await NotificationServer.getAllLatest(lastNotification?._id).request();
      if (res.data.notifications.length > 0) {        
        const notificationsData = res.data.notifications.map((notification: Notification2) => ({
          _id: notification._id,
          title: notification.title,
          description: notification.description,
          type: notification.type,
          isRead: false,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt
        }));
        await NotificationDB.db.bulkDocs(notificationsData);
      }
      const allNotifications = await NotificationDB.getAll(perPageLimit + 1);
      setHasNextPage(allNotifications.length > perPageLimit);
      setNotifications(allNotifications.slice(0, perPageLimit));
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
      let lastNotif: Notification2 | undefined;

      if (notifications.length > 0)
        lastNotif = notifications[notifications.length - 1];

      const nextNotifications = await NotificationDB.getNext(lastNotif?._id, perPageLimit + 1);

      setHasNextPage(nextNotifications.length > perPageLimit);
      setNotifications([...notifications, ...nextNotifications.slice(0, perPageLimit)]);

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
        updateLatest,
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
