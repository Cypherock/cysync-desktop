import { notification as NotificationServer } from '@cypherock/server-wrapper';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import logger from '../../utils/logger';
import { Notification, notificationDb as NotificationDB } from '../database';

export interface NotificationContextInterface {
  data: Notification[];
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
      const dbNotif = await NotificationDB.getLatest(perPageLimit);

      const res = await NotificationServer.get(
        undefined,
        perPageLimit
      ).request();
      let serverLatestNotif = [];
      let hasNext = false;
      let hasUnread = false;

      if (res.data.notifications) {
        serverLatestNotif = res.data.notifications;
        hasNext = res.data.hasNext;
      }

      let prevNotif: Notification | undefined;
      for (const notifData of serverLatestNotif) {
        const notif: Notification = {
          _id: notifData._id,
          title: notifData.title,
          description: notifData.description,
          type: notifData.type,
          createdAt: new Date(notifData.createdAt),
          isRead: false
        };

        if (prevNotif) {
          notif.prevDbId = prevNotif._id;
        }

        prevNotif = notif;

        const isInDb = await NotificationDB.getById(notif._id);

        if (!isInDb) {
          await NotificationDB.insert(notif);
        }
      }

      // Has new notifications if lengths are different
      if (dbNotif.length < serverLatestNotif.length) {
        hasUnread = true;
      }

      // Has new notifications if first notifications are different
      if (
        !hasUnread &&
        dbNotif.length > 0 &&
        serverLatestNotif.length > 0 &&
        dbNotif[0].dbId !== serverLatestNotif[0]._id
      ) {
        hasUnread = true;
      }

      if (!hasUnread) {
        for (const notif of dbNotif) {
          if (!notif.isRead) {
            hasUnread = true;
            break;
          }
        }
      }

      const latestNotifications = await NotificationDB.getLatest(perPageLimit);
      console.log('latestNotifications', latestNotifications);
      setNotifications(latestNotifications);
      setHasNextPage(hasNext);
      setHasUnread(hasUnread);
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
      let lastNotif: Notification | undefined;

      if (notifications.length > 0)
        lastNotif = notifications[notifications.length - 1];

      const dbNotif = await NotificationDB.getLatest(
        perPageLimit,
        notifications.length
      );

      let isInDb = true;

      // Check if the data in DB is syncronized with the server
      if (dbNotif.length > 0) {
        if (dbNotif[0].prevDbId === lastNotif.dbId) {
          let prevNotif = dbNotif[0];
          for (let i = 1; i < dbNotif.length; i++) {
            const notif = dbNotif[i];
            if (notif.prevDbId !== prevNotif.dbId) {
              isInDb = false;
              break;
            }

            prevNotif = notif;
          }
        } else {
          isInDb = false;
        }
      } else {
        isInDb = false;
      }

      // Fetch from server if data is not syncronized.
      if (!isInDb) {
        const res = await NotificationServer.get(
          lastNotif._id,
          perPageLimit
        ).request();
        let serverLatestNotif = [];
        let hasNext = false;

        if (res.data.notifications) {
          serverLatestNotif = res.data.notifications;
          hasNext = res.data.hasNext;
        }

        const serverNotifications: Notification[] = [];
        let prevNotif: Notification | undefined;
        for (const notifData of serverLatestNotif) {
          const notif: Notification = {
            _id: notifData._id,
            title: notifData.title,
            description: notifData.description,
            type: notifData.type,
            createdAt: new Date(notifData.createdAt),
            isRead: false
          };

          if (prevNotif) {
            notif.prevDbId = prevNotif._id;
          } else if (lastNotif) {
            notif.prevDbId = lastNotif._id;
          }

          prevNotif = notif;

          notifications.push(notif);

          const alreadyPresent = await NotificationDB.getById(notif._id);

          if (!alreadyPresent) {
            await NotificationDB.insert(notif);
          }
        }

        setNotifications([...notifications, ...serverNotifications]);
        setHasNextPage(hasNext);
      } else {
        // If data is from database then always show `hasNext` to allow user to
        // check from server at the end of the list.
        setNotifications([...notifications, ...dbNotif]);
        setHasNextPage(true);
      }
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
