import React, { useEffect, useState } from 'react';

import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import {
  Databases,
  dbUtil,
  transactionDb,
  walletDb,
  xpubDb
} from '../../../store/database';
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
          promise: transactionDb.hasIncompatableData.bind(transactionDb)
        },
        {
          name: 'Xpub',
          promise: xpubDb.hasIncompatableData.bind(xpubDb)
        },
        {
          name: 'Wallet',
          promise: walletDb.hasIncompatableData.bind(walletDb)
        },
        {
          name: 'Prices',
          promise: dbUtil(Databases.PRICE, 'hasIncompatableData')
        },
        {
          name: 'ERC20 Tokens',
          promise: dbUtil(Databases.ERC20TOKEN, 'hasIncompatableData')
        },
        {
          name: 'Addresses',
          promise: dbUtil(Databases.ADDRESS, 'hasIncompatableData')
        },
        {
          name: 'Receive Address',
          promise: dbUtil(Databases.RECEIVEADDRESS, 'hasIncompatableData')
        },
        {
          name: 'Notification',
          promise: dbUtil(Databases.NOTIFICATION, 'hasIncompatableData')
        },
        {
          name: 'Device',
          promise: dbUtil(Databases.DEVICE, 'hasIncompatableData')
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
