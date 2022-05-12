import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';
import { deviceDb2 } from '../../../../store/database';
import {
  useConnection,
  useUpdater,
  VerifyState
} from '../../../../store/provider';
import { compareVersion } from '../../../../utils/compareVersion';
import logger from '../../../../utils/logger';

import UpdateInfoComponent from './info';

const Updater = () => {
  const { isDeviceUpdateAvailable, deviceVersion } = useUpdater();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { deviceSerial, verifyState } = useConnection();

  useEffect(() => {
    // Only show when update is available and device has a valid connection
    if (isDeviceUpdateAvailable && verifyState === VerifyState.VERIFIED) {
      const lastVersion = localStorage.getItem('last-device-version');
      if (deviceSerial !== null) {
        deviceDb2
          .getBySerial(deviceSerial)
          .then(device => {
            if (!device) {
              return;
            }

            if (compareVersion(deviceVersion, device.version)) {
              if (lastVersion) {
                if (compareVersion(deviceVersion, lastVersion)) {
                  setIsOpen(true);
                  logger.info(
                    `Device New Update Prompt: Latest Version: ${deviceVersion}, Current Device Version: ${device.version}, Last New Version Shown: ${lastVersion}`
                  );
                }
              } else {
                setIsOpen(true);
                logger.info(
                  `Device New Update Prompt: Latest Version: ${deviceVersion}, Current Device Version: ${device.version}`
                );
              }
            }
          })
          .catch(error => logger.error(error));
      }
    }
  }, [isDeviceUpdateAvailable, deviceSerial, verifyState]);

  const finalizeDontShow = () => {
    if (dontShowAgain) {
      localStorage.setItem('last-device-version', deviceVersion);
    }
  };

  const onUpdate = () => {
    finalizeDontShow();
    navigate(Routes.settings.device.upgrade);
    setIsOpen(false);
  };

  const handleClose = () => {
    finalizeDontShow();
    setIsOpen(false);
  };

  const getDialogComponent = () => {
    return (
      <UpdateInfoComponent
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
        version={deviceVersion}
        onUpdate={onUpdate}
      />
    );
  };

  return (
    <>
      <DialogBox
        fullWidth
        maxWidth="md"
        open={isOpen}
        handleClose={handleClose}
        isClosePresent
        restComponents={getDialogComponent()}
      />
    </>
  );
};

export default Updater;
