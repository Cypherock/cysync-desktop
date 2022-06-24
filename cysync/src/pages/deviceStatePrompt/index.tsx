import { CancelFlow } from '@cypherock/protocols';
import React, { useState } from 'react';

import ErrorDialog from '../../designSystem/designComponents/dialog/errorDialog';
import { useConnection, useI18n } from '../../store/provider';
import logger from '../../utils/logger';

const DeviceStatePrompt = () => {
  const [isCancelRunning, setIsCancelRunning] = useState(false);
  const {
    internalDeviceConnection,
    deviceSdkVersion,
    openErrorPrompt,
    setOpenErrorPrompt,
    openCancelFlowPrompt,
    setIsInFlow,
    setOpenCancelFlowPrompt
  } = useConnection();

  const cancelFlow = new CancelFlow();

  const { langStrings } = useI18n();

  const runCancelFlow = async () => {
    setIsCancelRunning(true);
    logger.info('Trying to stop existing flow');
    if (internalDeviceConnection) {
      try {
        await cancelFlow.run({
          connection: internalDeviceConnection,
          sdkVersion: deviceSdkVersion
        });
      } catch (error) {
        logger.error('Error in canceling existing flow');
        logger.error(error);
      }
    }
    setIsCancelRunning(false);
    setOpenCancelFlowPrompt(false);
    setIsInFlow(false);
  };

  if (openCancelFlowPrompt) {
    return (
      <ErrorDialog
        open={openCancelFlowPrompt}
        handleClose={() => setOpenCancelFlowPrompt(false)}
        text="Some action is already is in progress, do you want to stop it?"
        actionText="Stop"
        disableAction={isCancelRunning}
        handleAction={runCancelFlow}
        flow="Another action is in progress"
      />
    );
  }

  if (openErrorPrompt) {
    return (
      <ErrorDialog
        open={openErrorPrompt}
        handleClose={() => setOpenErrorPrompt(false)}
        text={langStrings.ERRORS.DEVICE_NOT_CONNECTED}
      />
    );
  }

  return <></>;
};

export default DeviceStatePrompt;
