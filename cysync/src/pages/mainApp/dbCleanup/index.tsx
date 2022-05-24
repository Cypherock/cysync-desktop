import React, { useEffect, useState } from 'react';

import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import {
  coinDb,
  deviceDb,
  notificationDb,
  priceHistoryDb,
  receiveAddressDb,
  addressDb,
  tokenDb,
  transactionDb,
  walletDb
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
          name: 'Transaction',
          promise: transactionDb.hasIncompatableData.bind(transactionDb)
        },
        {
          name: 'Price History',
          promise: priceHistoryDb.hasIncompatableData.bind(priceHistoryDb)
        },
        {
          name: 'Coin',
          promise: coinDb.hasIncompatableData.bind(coinDb)
        },
        {
          name: 'Wallet',
          promise: walletDb.hasIncompatableData.bind(walletDb)
        },
        {
          name: 'ERC20 Tokens',
          promise: tokenDb.hasIncompatableData.bind(tokenDb)
        },
        {
          name: 'Addresses',
          promise: addressDb.hasIncompatableData.bind(addressDb)
        },
        {
          name: 'Receive Address',
          promise: receiveAddressDb.hasIncompatableData.bind(receiveAddressDb)
        },
        {
          name: 'Notification',
          promise: notificationDb.hasIncompatableData.bind(notificationDb)
        },
        {
          name: 'Device',
          promise: deviceDb.hasIncompatableData.bind(deviceDb)
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
