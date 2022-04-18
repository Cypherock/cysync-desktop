import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';
import React from 'react';

import DynamicTextView from '../dynamicTextView';

interface Props {
  isCompleted: -1 | 0 | 1 | 2;
  isApproved: 0 | 2 | 1 | -1;
  isInternetSlow: boolean;
  updateDownloaded: 0 | 1 | 2 | -1;
  latestVersion?: string;
}

const Authentication: React.FC<Props> = ({
  isCompleted,
  isInternetSlow,
  isApproved,
  updateDownloaded,
  latestVersion
}) => {
  return (
    <Grid container>
      <Grid item xs={12}>
        {isInternetSlow ? (
          <>
            <Alert severity="warning" variant="outlined">
              Your Internet connection is slow
            </Alert>
            <br />
          </>
        ) : null}
        <Typography variant="body2" color="textSecondary" align="center">
          Follow the steps on the Device
        </Typography>
        <br />
        <DynamicTextView state={updateDownloaded} text="Downloading Firmware" />
        <br />
        <DynamicTextView
          state={isApproved}
          text={`Confirm update on device to version ${latestVersion}`}
        />
        <br />
        <DynamicTextView state={isCompleted} text="Updating Firmware" />
      </Grid>
    </Grid>
  );
};

Authentication.propTypes = {
  isCompleted: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  isApproved: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  updateDownloaded: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  isInternetSlow: PropTypes.bool.isRequired,
  latestVersion: PropTypes.string
};

Authentication.defaultProps = {
  latestVersion: ''
};

export default Authentication;
