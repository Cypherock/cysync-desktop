import { DeviceErrorType } from '@cypherock/communication';
import { CancelFlow } from '@cypherock/protocols';
import React, { useState } from 'react';

import ErrorDialog from '../../designSystem/designComponents/dialog/errorDialog';
import { CyError } from '../../errors';
import { useConnection } from '../../store/provider';
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
    const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
    return (
      <ErrorDialog
        open={openErrorPrompt}
        handleClose={() => setOpenErrorPrompt(false)}
        text={''}
        errorObj={cyError}
      />
    );
  }

  return <></>;
};

export default DeviceStatePrompt;
