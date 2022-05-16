import React, { useEffect, useState } from 'react';

import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import {
  addressDb,
  coinDb,
  deviceDb,
  deviceDb2,
  erc20tokenDb,
  notificationDb,
  notificationDb2,
  priceHistoryDb,
  receiveAddressDb2,
  sendAddressDb,
  tokenDb,
  transactionDb,
  transactionDb2,
  walletDb,
  walletDb2,
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
          name: 'Transaction',
          promise: transactionDb2.hasIncompatableData.bind(transactionDb2)
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
          promise: walletDb2.hasIncompatableData.bind(walletDb2)
        },
        {
          name: 'ERC20 Tokens',
          promise: tokenDb.hasIncompatableData.bind(tokenDb)
        },
        {
          name: 'Addresses',
          promise: sendAddressDb.hasIncompatableData.bind(sendAddressDb)
        },
        {
          name: 'Receive Address',
          promise: receiveAddressDb2.hasIncompatableData.bind(receiveAddressDb2)
        },
        {
          name: 'Notification',
          promise: notificationDb2.hasIncompatableData.bind(notificationDb2)
        },
        {
          name: 'Device',
          promise: deviceDb2.hasIncompatableData.bind(deviceDb2)
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
