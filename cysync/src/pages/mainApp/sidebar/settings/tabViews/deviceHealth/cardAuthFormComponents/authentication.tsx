import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { CyError } from '../../../../../../../errors';
import Analytics from '../../../../../../../utils/analytics';
import DynamicTextView from '../dynamicTextView';

type Props = {
  verified: -1 | 0 | 1 | 2;
  errorObj: CyError;
};

const Authentication: React.FC<Props> = ({ verified, errorObj }) => {
  useEffect(() => {
    if (verified === -1 || errorObj.isSet) {
      Analytics.Instance.event(
        Analytics.EVENTS.SETTINGS.DEVICE_SETTINGS.CARD_AUTH.ERROR,
        { errorCode: errorObj.getCode(), message: errorObj.getMessage() }
      );
    } else if (verified === 2) {
      Analytics.Instance.event(
        Analytics.EVENTS.SETTINGS.DEVICE_SETTINGS.CARD_AUTH.SUCCESS
      );
    }
  }, [verified, errorObj]);

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="body2" color="textSecondary" align="center">
          Follow the steps on the Device
        </Typography>
        <br />
        <DynamicTextView
          state={verified}
          text="Tap the X1 Card on top of the device"
        />
      </Grid>
    </Grid>
  );
};

Authentication.propTypes = {
  verified: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  errorObj: PropTypes.instanceOf(CyError).isRequired
};

export default Authentication;
