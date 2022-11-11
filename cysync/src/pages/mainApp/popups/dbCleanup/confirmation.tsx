import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import Analytics from '../../../../utils/analytics';
import logger from '../../../../utils/logger';

const PREFIX = 'DbCleanup-Confirmation';

const classes = {
  errorButtons: `${PREFIX}-errorButtons`
};

const Root = styled(Grid)(() => ({
  padding: '20px',
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%'
  }
}));

type Props = {
  handleClose: () => void;
};

const Confirmation: React.FC<Props> = ({ handleClose }) => {
  const navigate = useNavigate();

  const onPositiveClick = () => {
    logger.info('Database cleanup confirmed by user');
    Analytics.Instance.event(
      Analytics.Categories.DATABASE_CLEANUP,
      Analytics.Actions.CLICKED
    );

    navigate(`${Routes.settings.general.index}?resetApp=true`);
    handleClose();
  };

  return (
    <Root container>
      <Grid item xs={12}>
        <Typography
          variant="h4"
          style={{ margin: 'auto', marginBottom: '10px' }}
          align="center"
        >
          For cySync app to upgrade successfully, your current data needs to be
          cleared.
        </Typography>
        <Typography
          variant="body1"
          style={{ margin: 'auto', marginBottom: '30px' }}
          align="center"
        >
          Your Cryptocurrency are still safe in your X1 wallet and this action
          will NOT result in loss of funds.
        </Typography>
      </Grid>
      <div className={classes.errorButtons}>
        <CustomButton onClick={onPositiveClick} style={{ margin: '1rem 0rem' }}>
          Go to Settings
        </CustomButton>
      </div>
    </Root>
  );
};

Confirmation.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default Confirmation;
