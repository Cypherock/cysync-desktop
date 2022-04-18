import { IconButton } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import ReportIcon from '@mui/icons-material/Report';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../../../designSystem/designComponents/icons/Icon';
import StackedCards from '../../../designSystem/iconGroups/cardsStacked';
import CySyncRound from '../../../designSystem/iconGroups/cySyncRound';
import DevicePlain from '../../../designSystem/iconGroups/devicePlain';
import { FeedbackState, useFeedback } from '../../../store/provider';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    content: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    middle: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '80vh'
    },
    start: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      paddingBottom: 70,
      marginRight: '-40px'
    },
    end: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      marginLeft: '-40px'
    },
    button: {
      background: '#71624C',
      color: theme.palette.text.primary,
      padding: '0.5rem 4rem',
      fontWeight: 700
    },
    report: {
      position: 'absolute',
      right: 20,
      bottom: 20
    }
  })
);

interface StartScreenProps {
  handleNext: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ handleNext }) => {
  const classes = useStyles();

  const { showFeedback } = useFeedback();

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: '',
    descriptionError: '',
    email: '',
    emailError: '',
    subject: 'Reporting for Error (Start Screen)',
    subjectError: ''
  };

  const handleFeedbackOpen = () => {
    showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: newFeedbackState
    });
  };

  return (
    <Grid container>
      <Grid item xs={4} className={classes.start}>
        <Icon size={160} viewBox="0 0 160 131" iconGroup={<DevicePlain />} />
        <Typography
          color="textPrimary"
          style={{ position: 'absolute', bottom: '145px' }}
        >
          X1 Wallet
        </Typography>
      </Grid>
      <Grid item xs={4} className={classes.middle}>
        <div className={classes.content}>
          <Icon size={100} viewBox="0 0 100 100" iconGroup={<CySyncRound />} />
          <br />
          <br />
          <Typography color="textPrimary">Let&apos;s Start with</Typography>
          <Typography
            color="textPrimary"
            variant="h2"
            style={{ letterSpacing: 3, color: '#fff' }}
          >
            Cypherock X1
          </Typography>
        </div>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleNext}
          className={classes.button}
        >
          Start
        </Button>
      </Grid>
      <Grid item xs={4} className={classes.end}>
        <Icon size={290} viewBox="0 0 286 250" iconGroup={<StackedCards />} />
        <Typography
          color="textPrimary"
          style={{ position: 'absolute', bottom: '100px' }}
        >
          X1 Card
        </Typography>
      </Grid>
      <IconButton
        title="Report issue"
        onClick={handleFeedbackOpen}
        className={classes.report}
        size="large">
        <ReportIcon color="secondary" />
      </IconButton>
    </Grid>
  );
};

StartScreen.propTypes = {
  handleNext: PropTypes.func.isRequired
};

export default StartScreen;
