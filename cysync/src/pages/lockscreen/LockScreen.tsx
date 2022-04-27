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

import CustomizedDialog from '../../designSystem/designComponents/dialog/newDialogBox';
import Icon from '../../designSystem/designComponents/icons/Icon';
import Input from '../../designSystem/designComponents/input/input';
import CySync from '../../designSystem/iconGroups/cySync';
import CySyncRound from '../../designSystem/iconGroups/cySyncRound';
import ErrorExclamation from '../../designSystem/iconGroups/errorExclamation';
import ICONS from '../../designSystem/iconGroups/iconConstants';
import { loadDatabases, passEnDb } from '../../store/database';
import { FeedbackState, useFeedback } from '../../store/provider';
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

  const [values, setValues] = React.useState<State>({
    password: '',
    showPassword: false,
    error: ''
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // Hook to handle Confirmation Forgot Password
  const [confirmationDialog, setConfirmationDialog] = React.useState(false);

  const handleCloseConfirmation = () => {
    setConfirmationDialog(false);
  };
  const handleSubmitConfirmation = async () => {
    triggerClearData();
    props.handleReset();
    setConfirmationDialog(false);
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
      await loadDatabases();
      setIsLoading(false);
      props.handleClose();
    } else {
      setValues({
        ...values,
        error: 'Please enter correct password'
      });
      setIsLoading(false);
    }
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
      <CustomizedDialog
        open={confirmationDialog}
        handleClose={handleCloseConfirmation}
        onYes={handleSubmitConfirmation}
      >
        <Icon
          size={100}
          viewBox=" 0 0 55 55"
          iconGroup={<ErrorExclamation />}
        />
        <Typography
          variant="h3"
          color="error"
          gutterBottom
          style={{ marginTop: '3rem' }}
        >
          Are you sure ?
        </Typography>
        <Typography style={{ marginBottom: '0rem' }}>
          This will reset everything on your cySync application.
        </Typography>
      </CustomizedDialog>
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
                  disabled={isLoading}
                  onClick={() => {
                    setConfirmationDialog(true);
                  }}
                  style={{
                    textTransform: 'none',
                    margin: '0rem 0rem 2rem',
                    color: theme.palette.text.secondary,
                    letterSpacing: 1
                  }}
                >
                  Forgot Password
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  className={classes.submitButton}
                  disabled={isLoading}
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
