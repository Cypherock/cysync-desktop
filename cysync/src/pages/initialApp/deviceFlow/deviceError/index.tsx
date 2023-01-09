import { shell } from 'electron';
import React, { useEffect, useState } from 'react';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';
import {
  DeviceConnectionState,
  useConnection
} from '../../../../store/provider';
import logger from '../../../../utils/logger';

import PopupComponent from './popup';
import UpdaterComponent from './updater';

const DeviceErrorPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpdaterPopup, setOpenUpdaterPopup] = useState(false);
  const {
    deviceConnectionState,
    setOpenMisconfiguredPrompt,
    updateRequiredType
  } = useConnection();

  useEffect(() => {
    // Open only when device is not ready or unknown error occurred.
    const doOpen = [
      DeviceConnectionState.DEVICE_NOT_READY,
      DeviceConnectionState.UPDATE_REQUIRED,
      DeviceConnectionState.UNKNOWN_ERROR
    ].includes(deviceConnectionState);
    setIsOpen(doOpen);
    if (doOpen) {
      logger.info('Initial Device error prompt open', {
        deviceConnectionState
      });
    }
  }, [deviceConnectionState]);

  const onConfirmation = (val?: boolean) => {
    setOpenMisconfiguredPrompt(false);
    if (val) {
      if (deviceConnectionState === DeviceConnectionState.UPDATE_REQUIRED) {
        if (updateRequiredType !== 'device') {
          shell.openExternal('https://cypherock.com/gs');
          return;
        }
        setOpenUpdaterPopup(true);
      }
    } else {
      setIsOpen(false);
    }
  };

  if (openUpdaterPopup) {
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={openUpdaterPopup}
        handleClose={() => setOpenUpdaterPopup(false)}
        isClosePresent
        restComponents={
          <UpdaterComponent handleClose={() => setOpenUpdaterPopup(false)} />
        }
      />
    );
  }

  if (isOpen) {
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={isOpen}
        handleClose={() => onConfirmation()}
        isClosePresent
        restComponents={<PopupComponent handleClose={onConfirmation} />}
      />
    );
  }

  return <></>;
};

export default DeviceErrorPopup;
