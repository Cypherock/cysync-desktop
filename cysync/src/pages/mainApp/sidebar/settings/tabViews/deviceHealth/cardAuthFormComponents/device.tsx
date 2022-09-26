import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { HandleCardAuthOptions } from '../../../../../../../store/hooks/flows';
import { useConnection } from '../../../../../../../store/provider';
import { inTestApp } from '../../../../../../../utils/compareVersion';
import DynamicTextView from '../dynamicTextView';

type Props = {
  handleNext: () => void;
  handleCardAuth: (options: HandleCardAuthOptions) => void;
  requestStatus: 0 | 1 | -1 | 2;
};

const Device: React.FC<Props> = ({
  handleNext,
  handleCardAuth,
  requestStatus
}: Props) => {
  const [connStatus, setConnStatus] = React.useState<-1 | 0 | 1 | 2>(1);

  const {
    deviceConnection,
    deviceSdkVersion,
    firmwareVersion,

    deviceState
  } = useConnection();

  useEffect(() => {
    if (deviceConnection && firmwareVersion && deviceState) {
      setConnStatus(2);

      handleCardAuth({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        isTestApp: inTestApp(deviceState)
      });
    } else {
      setConnStatus(1);
    }
  }, [deviceConnection]);

  React.useEffect(() => {
    if (requestStatus === 2) setTimeout(handleNext, 600);
  }, [requestStatus]);

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="body2" color="textSecondary" align="center">
          Follow the instructions on X1 Wallet
        </Typography>
        <br />
        <DynamicTextView state={connStatus} text="Connect X1 Wallet" />
        <br />
        <DynamicTextView
          state={requestStatus}
          text="Accept the request on the X1 wallet"
        />
      </Grid>
    </Grid>
  );
};

Device.propTypes = {
  handleNext: PropTypes.func.isRequired,
  handleCardAuth: PropTypes.func.isRequired,
  requestStatus: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired
};

export default Device;
