import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../constants/routes';
import CustomButton from '../../../designSystem/designComponents/buttons/button';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

const useStyles = makeStyles(() =>
  createStyles({
    container: {
      padding: '20px'
    },
    errorButtons: {
      display: 'flex',
      justifyContent: 'space-around',
      width: '100%'
    }
  })
);

type Props = {
  handleClose: () => void;
};

const Confirmation: React.FC<Props> = ({ handleClose }) => {
  const classes = useStyles();
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
    <Grid className={classes.container} container>
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
    </Grid>
  );
};

Confirmation.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default Confirmation;
