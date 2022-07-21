import { DeviceErrorType } from '@cypherock/communication';
import { CancelFlow } from '@cypherock/protocols';
import React, { useState } from 'react';

import ErrorDialog from '../../designSystem/designComponents/dialog/errorDialog';
import { CyError, CysyncError } from '../../errors';
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
        logger.info('Stopped the existing flow');
      } catch (error) {
        logger.error('Error in canceling existing flow');
        logger.error(error);
      }
    }
    setOpenCancelFlowPrompt(false);
    setIsCancelRunning(false);
    setIsInFlow(false);
  };

  if (openCancelFlowPrompt) {
    const cyError = new CyError(CysyncError.STOP_ONGOING_FLOW);
    return (
      <ErrorDialog
        open={openCancelFlowPrompt}
        handleClose={() => setOpenCancelFlowPrompt(false)}
        text="Some action is already is in progress, do you want to stop it?"
        errorObj={cyError}
        overrideErrorObj={true}
        actionText="Stop"
        disableAction={isCancelRunning}
        handleAction={runCancelFlow}
        // TODO: remove this and put it below somewhere
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
        errorObj={cyError}
      />
    );
  }

  return <></>;
};

export default DeviceStatePrompt;
