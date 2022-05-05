import React, { useEffect, useState } from 'react';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';
import {
  DeviceConnectionState,
  useConnection
} from '../../../../store/provider';
import logger from '../../../../utils/logger';

import PopupComponent from './popup';

const DeviceErrorPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { deviceConnectionState } = useConnection();

  const onClose = () => {
    setIsOpen(false);
    logger.info('Initial Device error prompt closed by user');
  };

  useEffect(() => {
    // Open only when device is not ready or unknown error occurred.
    const doOpen = [
      DeviceConnectionState.DEVICE_NOT_READY,
      DeviceConnectionState.UNKNOWN_ERROR
    ].includes(deviceConnectionState);
    setIsOpen(doOpen);
    if (doOpen) {
      logger.info('Initial Device error prompt open', {
        deviceConnectionState
      });
    }
  }, [deviceConnectionState]);

  if (isOpen) {
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={isOpen}
        handleClose={onClose}
        isClosePresent
        restComponents={<PopupComponent handleClose={onClose} />}
      />
    );
  }

  return <></>;
};

export default DeviceErrorPopup;
