import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Grid } from '@mui/material';
import MIconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import DialogBoxConfirmation from '../../../../../../designSystem/designComponents/dialog/dialogBoxConfirmation';
import Input from '../../../../../../designSystem/designComponents/input/input';
import { useSnackbar } from '../../../../../../store/provider';
import { verifyPassword } from '../../../../../../utils/auth';
import logger from '../../../../../../utils/logger';
import sleep from '../../../../../../utils/sleep';

const PREFIX = 'ConfirmPassword';

const classes = {
  inputs: `${PREFIX}-inputs`,
  buttons: `${PREFIX}-buttons`,
  error: `${PREFIX}-error`,
  marginTopBottom: `${PREFIX}-marginTopBottom`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.inputs}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 'auto',
    width: '100%'
  },
  [`& .${classes.buttons}`]: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.error}`]: {
    color: theme.palette.error.main
  },
  [`& .${classes.marginTopBottom}`]: {
    margin: '0.5rem 0rem'
  }
}));

interface State {
  curPassword: string;
  showPassword: boolean;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const ConfirmPassword: React.FC<Props> = ({ onClose, open, onSuccess }) => {
  const theme = useTheme();
  const snackbar = useSnackbar();
  const INITIAL_VALUES = {
    curPassword: '',
    showPassword: false
  };
  const [values, setValues] = React.useState<State>({
    ...INITIAL_VALUES
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [passwordVerified, setPasswordVerified] = React.useState(false);
  const [error, setError] = React.useState('');

  const resetState = () => {
    setValues({ ...INITIAL_VALUES });
    setIsLoading(false);
    setError('');
  };

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

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleConfirmPassword = async () => {
    try {
      if (!values.curPassword.trim()) {
        setError('Enter your password.');
      } else {
        setError('');
        if (await verifyPassword(values.curPassword.trim())) {
          setPasswordVerified(true);
          await sleep(5000);
          closeDialogBox();
          snackbar.showSnackbar(
            'Password matched! Cysync will reset itself..',
            'success',
            onSuccess,
            {
              dontCloseOnClickAway: true,
              autoHideDuration: 2500
            }
          );
          return;
        } else {
          setError('Password is incorrect');
        }
      }
    } catch (error) {
      logger.error('Error while confirming password');
      logger.error(error);
    }
    setIsLoading(false);
  };

  const timeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  React.useEffect(() => {
    if (isLoading) {
      timeout.current = setTimeout(handleConfirmPassword, 0);
    }

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }
    };
  }, [isLoading]);

  const confirmPassword = async () => {
    setIsLoading(true);
  };

  const closeDialogBox = () => {
    resetState();
    onClose();
  };

  return (
    <DialogBoxConfirmation
      isClosePresent={!isLoading}
      isLoading={isLoading}
      fullScreen
      maxWidth="sm"
      open={open}
      handleClose={closeDialogBox}
      handleConfirmation={confirmPassword}
      confirmButtonDisabled={isLoading}
      rejectButtonDisabled={isLoading}
      restComponents={
        <Root
          item
          xs={7}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem 0rem 6rem'
          }}
        >
          <Typography
            variant="h4"
            color="textPrimary"
            gutterBottom
            style={{ marginBottom: '3rem' }}
          >
            Confirm your password
          </Typography>
          {isLoading && passwordVerified && (
            <Typography align="center" color="textSecondary">
              Restart the application if it does not start automatically.
            </Typography>
          )}
          <Input
            fullWidth
            size="small"
            type={values.showPassword ? 'text' : 'password'}
            value={values.curPassword}
            placeholder="Confirm Your Password"
            onChange={handleChange('curPassword')}
            onKeyDown={handleKeyPress}
            className={classes.marginTopBottom}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <MIconButton
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
                  </MIconButton>
                </InputAdornment>
              )
            }}
          />
          {error && (
            <Typography
              variant="caption"
              style={{ color: theme.palette.error.main }}
            >
              {error}
            </Typography>
          )}
        </Root>
      }
    />
  );
};

ConfirmPassword.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ConfirmPassword;
