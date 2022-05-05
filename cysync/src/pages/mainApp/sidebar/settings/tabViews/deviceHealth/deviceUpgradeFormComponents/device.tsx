import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import DynamicTextView from '../dynamicTextView';

export interface Props {
  connStatus: -1 | 0 | 1 | 2;
  authState: -1 | 0 | 1 | 2;
}

const Device: React.FC<Props> = ({ connStatus, authState }) => {
  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="body2" color="textSecondary" align="center">
          Follow the steps on the Device
        </Typography>
        <br />
        <DynamicTextView state={connStatus} text="Connect X1 Wallet" />
        <br />
        <DynamicTextView state={authState} text="Getting Latest Version" />
      </Grid>
    </Grid>
  );
};

Device.propTypes = {
  connStatus: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  authState: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired
};

export default Device;
