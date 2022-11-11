import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../../constants/routes';
import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import {
  DeviceConnectionState,
  useConnection,
  useUpdater
} from '../../../../../store/provider';
import { compareVersion, hexToVersion } from '../../../../../utils/compareVersion';
import logger from '../../../../../utils/logger';

import UpdateInfoComponent from './info';

const Updater = () => {
  const { isDeviceUpdateAvailable, deviceVersion } = useUpdater();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { firmwareVersion, deviceConnectionState } = useConnection();

  useEffect(() => {
    // Only show when update is available and device has a valid connection
    if (
      isDeviceUpdateAvailable &&
      deviceConnectionState === DeviceConnectionState.VERIFIED
    ) {
      const lastVersion = localStorage.getItem('last-device-version');
      if (firmwareVersion) {
        const currectDeviceVersion = hexToVersion(firmwareVersion);
        if (compareVersion(deviceVersion, currectDeviceVersion)) {
          if (lastVersion) {
            if (compareVersion(deviceVersion, lastVersion)) {
              setIsOpen(true);
              logger.info(
                `Device New Update Prompt: Latest Version: ${deviceVersion}, Current Device Version: ${currectDeviceVersion}, Last New Version Shown: ${lastVersion}`
              );
            }
          } else {
            setIsOpen(true);
            logger.info(
              `Device New Update Prompt: Latest Version: ${deviceVersion}, Current Device Version: ${currectDeviceVersion}`
            );
          }
        } else {
          logger.info(
            `Device firmware already latest: ${currectDeviceVersion}`
          );
        }
      }
    }
  }, [isDeviceUpdateAvailable, deviceConnectionState]);

  const finalizeDontShow = () => {
    if (dontShowAgain) {
      localStorage.setItem('last-device-version', deviceVersion);
    }
  };

  const onUpdate = () => {
    finalizeDontShow();
    navigate(`${Routes.settings.device.upgrade}?isRefresh=true`);
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
