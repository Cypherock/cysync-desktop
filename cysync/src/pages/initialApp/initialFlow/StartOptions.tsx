import { IconButton } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import ReportIcon from '@mui/icons-material/Report';
import { shell } from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import TextView from '../../../designSystem/designComponents/textComponents/textView2';
import { FeedbackState, useFeedback } from '../../../store/provider';

const useStyles = makeStyles(() =>
  createStyles({
    content: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '80vh'
    },
    textViewContainer: {
      width: '100%'
    },
    button: {
      background: '#71624C',
      padding: '0.5rem 4rem',
      fontWeight: 700,
      fontFamily: 'Lato',
      letterSpacing: 1,
      color: '#FFF'
    },
    report: {
      position: 'absolute',
      right: 20,
      bottom: 20
    }
  })
);

interface StartOptionsProps {
  handleNext: () => void;
}

const StartOptions: React.FC<StartOptionsProps> = ({ handleNext }) => {
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
    subject: 'Reporting for Error (Setting Up Device)',
    subjectError: ''
  };

  const handleFeedbackOpen = () => {
    showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: newFeedbackState
    });
  };

  const [state, setState] = React.useState([
    {
      id: 1,
      text: 'Setup a new device',
      active: false
    },
    {
      id: 2,
      text: 'Purchase device',
      active: false
    }
  ]);

  const handleClick = (id: number) => {
    if (id === 2) {
      shell.openExternal(`https://shop.cypherock.com/`);
      return;
    }
    const newState = state.map(item => {
      const newItem = { ...item };
      if (item.id === id) {
        newItem.active = !item.active;
      } else newItem.active = false;
      return newItem;
    });
    setState([...newState]);
  };

  return (
    <Grid container>
      <Grid item xs={3} />
      <Grid item xs={6} className={classes.content}>
        <Typography
          color="textPrimary"
          variant="h2"
          align="center"
          style={{ fontWeight: 700 }}
        >
          Let&apos;s start with the following options
        </Typography>
        <div className={classes.textViewContainer}>
          {state.map(item => (
            <Button
              key={item.id}
              fullWidth
              style={{ textTransform: 'none' }}
              onClick={() => {
                handleClick(item.id);
              }}
              disableRipple
            >
              <TextView text={item.text} completed={item.active} />
            </Button>
          ))}
        </div>
        <Button
          variant="contained"
          color="secondary"
          disabled={!state[0].active}
          onClick={handleNext}
          className={classes.button}
        >
          Start
        </Button>
      </Grid>
      <Grid item xs={3} />
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

StartOptions.propTypes = {
  handleNext: PropTypes.func.isRequired
};

export default StartOptions;
