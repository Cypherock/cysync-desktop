import { CancelFlow } from '@cypherock/protocols';
import React, { useState } from 'react';

import ErrorDialog from '../../designSystem/designComponents/dialog/errorDialog';
import { useConnection } from '../../store/provider';
import logger from '../../utils/logger';

const DeviceStatePrompt = () => {
  const [isCancelRunning, setIsCancelRunning] = useState(false);
  const {
    internalDeviceConnection,
    devicePacketVersion,
    deviceSdkVersion,
    openErrorPrompt,
    setOpenErrorPrompt,
    openCancelFlowPrompt,
    setOpenCancelFlowPrompt
  } = useConnection();

  const cancelFlow = new CancelFlow();

  const runCancelFlow = async () => {
    setIsCancelRunning(true);
    logger.info('ExitCleanup Started');
    if (internalDeviceConnection) {
      try {
        await cancelFlow.run({
          connection: internalDeviceConnection,
          packetVersion: devicePacketVersion,
          sdkVersion: deviceSdkVersion
        });
      } catch (error) {
        logger.error('Error in exit cleanup');
        logger.error(error);
      }
    }
    setIsCancelRunning(false);
    setOpenCancelFlowPrompt(false);

    logger.info('ExitCleanup Completed');
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
        text="Please connect the cypherock X1 wallet before proceeding with this process"
        flow="Device Disconnected"
      />
    );
  }

  return <></>;
};

export default DeviceStatePrompt;
