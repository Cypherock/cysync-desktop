import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import Analytics from '../../../../../../../utils/analytics';
import DynamicTextView from '../dynamicTextView';

type Props = {
  verified: -1 | 0 | 1 | 2;
  errorMessage: string;
};

const Authentication: React.FC<Props> = ({ verified, errorMessage }) => {
  useEffect(() => {
    if (verified === -1 || errorMessage) {
      Analytics.Instance.event(
        Analytics.Categories.CARD_AUTH,
        Analytics.Actions.ERROR
      );
    } else if (verified === 2) {
      Analytics.Instance.event(
        Analytics.Categories.CARD_AUTH,
        Analytics.Actions.COMPLETED
      );
    }
  }, [verified, errorMessage]);

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
  errorMessage: PropTypes.string.isRequired
};

export default Authentication;
