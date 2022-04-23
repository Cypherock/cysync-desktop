import { shell } from 'electron';
import React, { useEffect, useState } from 'react';

import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import { useConnection, VerifyState } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

import AuthenticatorComponent from './authenticator';
import ConfirmationComponent from './confirmation';
import InitialFlowComponent from './initialFlow';
import UpdaterComponent from './updater';

type UpdateType = 'update' | 'auth' | 'initial';

const DeviceUpdatePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [updateType, setUpdateType] = useState<UpdateType>('update');
  const {
    verifyState,
    openVerifyPrompt,
    setOpenVerifyPrompt,
    updateRequiredType
  } = useConnection();

  const onConfirmation = (val: boolean) => {
    setOpenVerifyPrompt(false);
    if (val) {
      let localUpdateType: UpdateType = 'update';
      if (
        [VerifyState.PARTIAL_STATE, VerifyState.LAST_AUTH_FAILED].includes(
          verifyState
        )
      ) {
        localUpdateType = 'auth';
      } else if (verifyState === VerifyState.IN_TEST_APP) {
        localUpdateType = 'initial';
      } else if (verifyState === VerifyState.UPDATE_REQUIRED) {
        if (updateRequiredType === 'device') {
          localUpdateType = 'update';
        } else {
          shell.openExternal('https://cypherock.com/gs');
          return;
        }
      }

      setUpdateType(localUpdateType);
      setIsOpen(true);
      if (localUpdateType === 'update') {
        Analytics.Instance.event(
          Analytics.Categories.PARTIAL_DEVICE_UPDATE,
          Analytics.Actions.OPEN
        );
        logger.info('Device update prompt opened by user');
      } else if (localUpdateType === 'auth') {
        Analytics.Instance.event(
          Analytics.Categories.DEVICE_AUTH_PROMPT,
          Analytics.Actions.OPEN
        );
        logger.info('Device auth prompt opened by user');
      } else {
        Analytics.Instance.event(
          Analytics.Categories.INITIAL_FLOW_IN_MAIN,
          Analytics.Actions.OPEN
        );
        logger.info('Intial flow in main opened by user');
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    Analytics.Instance.event(
      updateType === 'update'
        ? Analytics.Categories.PARTIAL_DEVICE_UPDATE
        : updateType === 'auth'
        ? Analytics.Categories.DEVICE_AUTH_PROMPT
        : Analytics.Categories.INITIAL_FLOW_IN_MAIN,
      Analytics.Actions.CLOSED
    );
    logger.info('Device update prompt closed');
  };

  useEffect(() => {
    if (openVerifyPrompt) {
      Analytics.Instance.event(
        Analytics.Categories.PARTIAL_DEVICE_UPDATE,
        Analytics.Actions.PROMPT
      );
      logger.info('Device update prompt open');
    }
  }, [openVerifyPrompt]);

  if (isOpen) {
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={isOpen}
        disableBackdropClick
        disableEscapeKeyDown
        handleClose={handleClose}
        restComponents={
          updateType === 'update' ? (
            <UpdaterComponent handleClose={handleClose} />
          ) : updateType === 'auth' ? (
            <AuthenticatorComponent handleClose={handleClose} />
          ) : (
            <InitialFlowComponent handleClose={handleClose} />
          )
        }
      />
    );
  }

  if (
    verifyState !== VerifyState.VERIFIED &&
    verifyState !== VerifyState.NOT_CONNECTED
  ) {
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={openVerifyPrompt}
        handleClose={() => setOpenVerifyPrompt(false)}
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
