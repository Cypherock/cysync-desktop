import React, { useEffect, useState } from 'react';

import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import { Databases, dbUtil } from '../../../store/database';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

import ConfirmationComponent from './confirmation';

const DBCleaupPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  const checkForDBCleanup = async () => {
    try {
      logger.info('Checking if Database cleanup is required.');
      let isCleanupRequired = false;

      const promiseList = [
        {
          name: 'History',
          promise: async () =>
            dbUtil(Databases.TRANSACTION, 'hasIncompatableData')
        },
        {
          name: 'Xpub',
          promise: async () => dbUtil(Databases.XPUB, 'hasIncompatableData')
        },
        {
          name: 'Wallet',
          promise: async () => dbUtil(Databases.WALLET, 'hasIncompatableData')
        },
        {
          name: 'Prices',
          promise: async () => dbUtil(Databases.PRICE, 'hasIncompatableData')
        },
        {
          name: 'ERC20 Tokens',
          promise: async () =>
            dbUtil(Databases.ERC20TOKEN, 'hasIncompatableData')
        },
        {
          name: 'Addresses',
          promise: async () => dbUtil(Databases.ADDRESS, 'hasIncompatableData')
        },
        {
          name: 'Receive Address',
          promise: async () =>
            dbUtil(Databases.RECEIVEADDRESS, 'hasIncompatableData')
        },
        {
          name: 'Notification',
          promise: async () =>
            dbUtil(Databases.NOTIFICATION, 'hasIncompatableData')
        },
        {
          name: 'Device',
          promise: async () => dbUtil(Databases.DEVICE, 'hasIncompatableData')
        }
      ];

      for (const elem of promiseList) {
        if (await elem.promise()) {
          logger.info(`Incompatable data found in ${elem.name} DB.`);
          isCleanupRequired = true;
          break;
        }
      }

      if (isCleanupRequired) {
        setIsOpen(true);
        Analytics.Instance.event(
          Analytics.Categories.DATABASE_CLEANUP,
          Analytics.Actions.OPEN
        );
        logger.info('Database cleanup prompt opened');
      }
    } catch (error) {
      logger.error('Error in database cleaup check.');
      logger.error(error);
    }
  };

  useEffect(() => {
    checkForDBCleanup();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    Analytics.Instance.event(
      Analytics.Categories.DATABASE_CLEANUP,
      Analytics.Actions.CLOSED
    );
    logger.info('Database cleanup prompt closed');
  };

  if (isOpen) {
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={isOpen}
        handleClose={handleClose}
        isClosePresent
        restComponents={<ConfirmationComponent handleClose={handleClose} />}
      />
    );
  }

  return <></>;
};

export default DBCleaupPopup;
