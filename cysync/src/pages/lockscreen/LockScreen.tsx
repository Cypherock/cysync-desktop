import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReportIcon from '@mui/icons-material/Report';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

import Icon from '../../designSystem/designComponents/icons/Icon';
import Input from '../../designSystem/designComponents/input/input';
import CySync from '../../designSystem/iconGroups/cySync';
import CySyncRound from '../../designSystem/iconGroups/cySyncRound';
import ICONS from '../../designSystem/iconGroups/iconConstants';
import { initDatabases, passEnDb } from '../../store/database';
import { FeedbackState, useFeedback, useSnackbar } from '../../store/provider';
import { generateSinglePasswordHash, verifyPassword } from '../../utils/auth';
import { triggerClearData } from '../../utils/clearData';

const PREFIX = 'Lockscreen';
const classes = {
  container: `${PREFIX}-container`,
  root: `${PREFIX}-root`,
  content: `${PREFIX}-content`,
  icon: `${PREFIX}-icon`,
  inputFieldsContainer: `${PREFIX}-inputFieldsContainer`,
  submitButton: `${PREFIX}-submitButton`,
  report: `${PREFIX}-report`
};

const Root = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  [`& .${classes.root}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.content}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '50vh'
  },
  [`& .${classes.icon}`]: {
    position: 'absolute',
    top: 10,
    left: 20
  },
  [`& .${classes.inputFieldsContainer}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  [`& .${classes.submitButton}`]: {
    background: '#71624C',
    color: '#FFFFFF',
    padding: '0.3rem 3rem',
    fontWeight: 700,
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  },
  [`& .${classes.report}`]: {
    position: 'absolute',
    right: 20,
    bottom: 20
  }
}));

interface State {
  password: string;
  showPassword: boolean;
  error: string;
}

const LockScreen = (props: any) => {
  const theme = useTheme();
  const snackbar = useSnackbar();

  const [tries, setTries] = React.useState(0);
  const [values, setValues] = React.useState<State>({
    password: '',
    showPassword: false,
    error: ''
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const MAX_TRIES = 3;

  const resetHandler = async () => {
    triggerClearData();
    props.handleReset();
  };

  const handleChange =
    (prop: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleSubmit = async () => {
    const password = values.password.trim();
    setTries(t => t + 1);

    if (!password) {
      setValues({
        ...values,
        error: 'Please enter a password'
      });
      setIsLoading(false);
      return;
    }

    if (await verifyPassword(password)) {
      setValues({
        ...values,
        error: ''
      });
      passEnDb.setPassHash(generateSinglePasswordHash(password));
      await initDatabases();
      props.handleClose();
    } else if (tries >= MAX_TRIES) {
      setValues(v => ({
        ...v,
        error: ''
      }));
      snackbar.showSnackbar(
        'Maximum Incorrect attempts reached! Cysync self-destructing...',
        'error',
        resetHandler,
        {
          dontCloseOnClickAway: true,
          autoHideDuration: 2000
        }
      );
    } else {
      setValues({
        ...values,
        error: `Invalid password, Attempts remaining: ${MAX_TRIES - tries}`
      });
    }
    setIsLoading(false);
  };

  const timeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  React.useEffect(() => {
    if (isLoading) {
      timeout.current = setTimeout(handleSubmit, 0);
    }

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }
    };
  }, [isLoading]);

  const ENTER_KEY = 13;
  const handleKeyPress = (event: any) => {
    if (event.keyCode === ENTER_KEY) {
      setIsLoading(true);
    }
  };

  const { showFeedback } = useFeedback();

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: values.error ? values.error : '',
    descriptionError: '',
    email: '',
    emailError: '',
    subject: 'Reporting for Error (Entering Password)',
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
    <Root className={classes.container}>
      <Icon
        size={74}
        height={34}
        viewBox="0 0 74 23"
        iconGroup={<CySync />}
        className={classes.icon}
      />
      <Grid container onKeyDown={handleKeyPress}>
        <Grid item xs={3} />
        <Grid item xs={6} className={classes.root}>
          <div className={classes.content}>
            <Icon
              size={80}
              height={80}
              viewBox="0 0 100 100"
              iconGroup={<CySyncRound />}
            />
            <Typography
              variant="h5"
              color="textSecondary"
              align="center"
              style={{ fontWeight: 700, letterSpacing: 2, marginTop: '3rem' }}
            >
              Welcome Back !
            </Typography>
            <Typography
              variant="h3"
              color="textPrimary"
              align="center"
              style={{
                fontWeight: 700,
                letterSpacing: 2,
                margin: '0.5rem 0rem 4rem'
              }}
            >
              Enter password for Dashboard
            </Typography>
            <Grid container>
              <Grid item xs={3} />
              <Grid item xs={6} className={classes.inputFieldsContainer}>
                <Input
                  fullWidth
                  type={values.showPassword ? 'text' : 'password'}
                  value={values.password}
                  disabled={isLoading}
                  onChange={handleChange('password')}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter Password"
                  label="Enter Password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          tabIndex={-1}
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          size="large"
                        >
                          {values.showPassword ? (
                            <Visibility
                              style={{ color: theme.palette.text.secondary }}
                            />
                          ) : (
                            <VisibilityOff
                              style={{ color: theme.palette.text.secondary }}
                            />
                          )}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                {values.error.length > 0 && (
                  <Typography
                    variant="body2"
                    align="center"
                    style={{
                      color: theme.palette.error.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '1rem 0rem 0rem',
                      width: '100%'
                    }}
                  >
                    <ErrorOutlineIcon style={{ marginRight: 7 }} />
                    {values.error}
                  </Typography>
                )}
                <Button
                  fullWidth
                  variant="outlined"
                  className={classes.submitButton}
                  disabled={isLoading}
                  style={{ marginTop: 20 }}
                  endIcon={
                    !isLoading ? (
                      <Icon
                        size={16}
                        height={10}
                        viewBox="0 0 23 16"
                        icon={ICONS.rightArrow}
                        color={theme.palette.text.primary}
                      />
                    ) : undefined
                  }
                  onClick={() => setIsLoading(true)}
                >
                  {isLoading ? (
                    <CircularProgress size={20} color="secondary" />
                  ) : tries > 0 ? (
                    'Retry'
                  ) : (
                    'Login'
                  )}
                </Button>
              </Grid>
              <Grid item xs={3} />
            </Grid>
          </div>
        </Grid>
        <Grid item xs={3} />
        <IconButton
          title="Report issue"
          onClick={handleFeedbackOpen}
          className={classes.report}
          size="large"
        >
          <ReportIcon color="secondary" />
        </IconButton>
      </Grid>
    </Root>
  );
};

export default LockScreen;
