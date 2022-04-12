import { CircularProgress } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ReportIcon from '@material-ui/icons/Report';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../../../designSystem/designComponents/icons/Icon';
import Input from '../../../designSystem/designComponents/input/input';
import ErrorExclamationGroup from '../../../designSystem/iconGroups/errorExclamation';
import {
  FeedbackState,
  useFeedback,
  useLockscreen
} from '../../../store/provider';
import {
  checkPassword,
  completeFirstBoot,
  generatePasswordHash,
  passChangeEffect,
  setPasswordHash
} from '../../../utils/auth';

import ErrorBox from './setPasswordErrorDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    content: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '40vh'
    },
    inputs: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '20vh',
      width: '100%'
    },
    buttons: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: 900
    },
    instructions: {
      border: '1px solid grey',
      borderRadius: '1rem',
      margin: '1.5rem 0rem',
      maxWidth: 900,
      width: '100%'
    },
    error: {
      color: theme.palette.error.main
    },
    buttonSet: {
      background: '#71624C',
      color: theme.palette.text.primary,
      padding: '0.5rem 3rem',
      letterSpacing: 1,
      fontWeight: 700,
      '&:hover': {
        background: theme.palette.secondary.dark
      }
    },
    skipButton: {
      border: `1px solid ${theme.palette.text.secondary}`,
      color: theme.palette.text.secondary,
      padding: '0.5rem 3rem',
      textTransform: 'none'
    },
    instruction: {
      margin: '15px 0px'
    },
    report: {
      position: 'absolute',
      right: 20,
      bottom: 20
    }
  })
);

interface State {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

interface SetPasswordProps {
  handleClose: () => void;
  handleSnackbarOpen: () => void;
  handleSkipPassword: () => void;
}

const SetPassword: React.FC<SetPasswordProps> = ({
  handleSnackbarOpen,
  handleSkipPassword,
  handleClose
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const lockscreen = useLockscreen();

  const [values, setValues] = React.useState<State>({
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const [error, setError] = React.useState('');
  const [errorBox, setErrorBox] = React.useState(false);

  const handleChange =
    (prop: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

  const ENTER_KEY = 13;
  const handleKeyPress = (event: any) => {
    if (event.keyCode === ENTER_KEY) {
      setIsLoading(true);
    }
  };

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleClickShowConfirmPassword = () => {
    setValues({ ...values, showConfirmPassword: !values.showConfirmPassword });
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleSetPassword = async () => {
    if (values.password.trim() !== values.confirmPassword.trim()) {
      setError("Passwords Don't Match! Try Again");
    } else {
      const passwordCheckError = checkPassword(values.password.trim());
      if (passwordCheckError) {
        setError(passwordCheckError);
      } else {
        setError('');
        const passHash = await generatePasswordHash(values.password.trim());
        await passChangeEffect(passHash.singleHash);
        lockscreen.setIsPasswordSet(true);
        setPasswordHash(passHash.doubleHash);
        completeFirstBoot();
        handleSnackbarOpen();
        handleClose();
      }
    }

    setIsLoading(false);
  };

  let timeout: NodeJS.Timeout;
  React.useEffect(() => {
    if (isLoading) {
      timeout = setTimeout(handleSetPassword, 0);
    }
  }, [isLoading]);

  React.useEffect(() => {
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);
  const handleErrorBoxClose = () => {
    setErrorBox(false);
  };

  const { showFeedback } = useFeedback();

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: error,
    descriptionError: '',
    email: '',
    emailError: '',
    subject: 'Reporting for Error (Setting Password)',
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
      <Grid container>
        <Grid item xs={4} />
        <Grid item xs={4} className={classes.content}>
          <Typography
            color="textPrimary"
            variant="h3"
            align="center"
            gutterBottom
            style={{
              fontWeight: 700,
              letterSpacing: 3
            }}
          >
            Set Password for CySync App
          </Typography>
          <div className={classes.inputs}>
            <Input
              fullWidth
              type={values.showPassword ? 'text' : 'password'}
              value={values.password}
              placeholder="New Password"
              onChange={handleChange('password')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      tabIndex={-1}
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
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
            <Input
              fullWidth
              type={values.showConfirmPassword ? 'text' : 'password'}
              value={values.confirmPassword}
              placeholder="Confirm Password"
              onChange={handleChange('confirmPassword')}
              onKeyDown={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      tabIndex={-1}
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmPassword}
                      onMouseDown={handleMouseDownPassword}
                    >
                      {values.showConfirmPassword ? (
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
          </div>
          <Typography className={classes.error}>
            {error.length === 0 ? (
              ''
            ) : (
              <Icon viewBox="0 0 60 60" iconGroup={<ErrorExclamationGroup />} />
            )}
            {error}
          </Typography>
        </Grid>
        <Grid item xs={4} />
      </Grid>
      <Grid container>
        <Grid item xs={1} />
        <Grid
          item
          xs={10}
          style={{
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          <div className={classes.instructions}>
            <Typography
              gutterBottom
              color="textPrimary"
              className={classes.instruction}
            >
              <span style={{ margin: '0px 20px' }}>{`* `}</span>
              <span>Minimum 8 characters</span>
            </Typography>
            <Typography
              gutterBottom
              color="textPrimary"
              className={classes.instruction}
            >
              <span style={{ margin: '0px 20px' }}>{`* `}</span>
              <span>Use both UPPER case and lower case characters</span>
            </Typography>
            <Typography
              gutterBottom
              color="textPrimary"
              className={classes.instruction}
            >
              <span style={{ margin: '0px 20px' }}>{`* `}</span>
              <span>Use special characters</span>
            </Typography>
          </div>
          <Grid
            container
            style={{
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Grid item xs={12} className={classes.buttons}>
              <Button
                color="secondary"
                variant="outlined"
                onClick={handleSkipPassword}
                className={classes.skipButton}
                disabled={isLoading}
              >
                Skip Set Password
              </Button>
              <Button
                variant="contained"
                onClick={() => setIsLoading(true)}
                className={classes.buttonSet}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={20} color="secondary" />
                ) : (
                  'Set Password'
                )}
              </Button>
            </Grid>
          </Grid>
          <Grid item xs={1} />
        </Grid>
      </Grid>
      <ErrorBox open={errorBox} handleClose={handleErrorBoxClose} />
      <IconButton
        title="Report issue"
        onClick={handleFeedbackOpen}
        className={classes.report}
      >
        <ReportIcon color="secondary" />
      </IconButton>
    </Grid>
  );
};

SetPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  handleSnackbarOpen: PropTypes.func.isRequired,
  handleSkipPassword: PropTypes.func.isRequired
};

export default SetPassword;
