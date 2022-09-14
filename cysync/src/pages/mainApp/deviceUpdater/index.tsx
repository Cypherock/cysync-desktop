import { shell } from 'electron';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../constants/routes';
import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import { DeviceConnectionState, useConnection } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

import ConfirmationComponent from './confirmation';
import InitialFlowComponent from './initialFlow';

type UpdateType = 'update' | 'auth' | 'initial';

const DeviceUpdatePopup = () => {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [updateType, setUpdateType] = useState<UpdateType>('update');
  const {
    deviceConnectionState,
    openMisconfiguredPrompt,
    setOpenMisconfiguredPrompt,
    updateRequiredType,
    isDeviceUpdating,
    blockConnectionPopup
  } = useConnection();

  const onConfirmation = (val: boolean) => {
    setOpenMisconfiguredPrompt(false);
    if (val) {
      let localUpdateType: UpdateType = 'update';
      Analytics.Instance.event(
        Analytics.EVENTS.DEVICE_CONNECTION.ERROR_PROMPT.ACTION_CONFIRMED,
        { deviceConnectionState, updateRequiredType }
      );
      if (
        [
          DeviceConnectionState.PARTIAL_STATE,
          DeviceConnectionState.LAST_AUTH_FAILED
        ].includes(deviceConnectionState)
      ) {
        localUpdateType = 'auth';
      } else if (deviceConnectionState === DeviceConnectionState.IN_TEST_APP) {
        localUpdateType = 'initial';
      } else if (
        deviceConnectionState === DeviceConnectionState.UPDATE_REQUIRED
      ) {
        if (updateRequiredType === 'device') {
          localUpdateType = 'update';
        } else {
          shell.openExternal('https://cypherock.com/gs');
          return;
        }
      }

      if (localUpdateType === 'initial') {
        setIsOpen(true);
      }

      setUpdateType(localUpdateType);

      if (localUpdateType === 'update') {
        logger.info('Redirecting user to device update settings page');
        return navigate(`${Routes.settings.device.upgrade}?isRefresh=true`);
      } else if (localUpdateType === 'auth') {
        logger.info('Redirecting user to device auth settings page');
        return navigate(`${Routes.settings.device.auth}?isRefresh=true`);
      } else {
        logger.info('Intial flow in main opened by user');
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setOpenMisconfiguredPrompt(false);
    Analytics.Instance.event(
      Analytics.EVENTS.DEVICE_CONNECTION.ERROR_PROMPT.CLOSED,
      { deviceConnectionState, updateRequiredType }
    );
    logger.info('Device update prompt closed');
  };

  useEffect(() => {
    if (openMisconfiguredPrompt) {
      Analytics.Instance.event(
        Analytics.EVENTS.DEVICE_CONNECTION.ERROR_PROMPT.OPEN,
        { deviceConnectionState, updateRequiredType }
      );
      logger.info('Device update prompt open');
    }
  }, [openMisconfiguredPrompt]);

  if (isDeviceUpdating && updateType !== 'initial') {
    return <></>;
  }

  if (isOpen) {
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={isOpen}
        disableBackdropClick
        disableEscapeKeyDown
        handleClose={handleClose}
        restComponents={<InitialFlowComponent handleClose={handleClose} />}
      />
    );
  }

  if (
    !blockConnectionPopup &&
    deviceConnectionState !== DeviceConnectionState.VERIFIED &&
    deviceConnectionState !== DeviceConnectionState.NOT_CONNECTED
  ) {
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={openMisconfiguredPrompt}
        handleClose={() => setOpenMisconfiguredPrompt(false)}
        isClosePresent
        restComponents={
          <ConfirmationComponent
            handleClose={onConfirmation}
            updateRequiredType={updateRequiredType}
          />
        }
      />
    );
  }

  return <></>;
};

export default DeviceUpdatePopup;
