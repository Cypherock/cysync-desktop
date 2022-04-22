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
import { useLockscreen, useSnackbar } from '../../../../../../store/provider';
import {
  passChangeEffect,
  removePassword,
  verifyPassword
} from '../../../../../../utils/auth';
import logger from '../../../../../../utils/logger';

const PREFIX = 'RemovePassword';

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
  oldPassword: string;
  showPassword: boolean;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

const RemovePassword: React.FC<Props> = ({ onClose, open }) => {
  const theme = useTheme();
  const lockscreen = useLockscreen();
  const snackbar = useSnackbar();
  const INITIAL_VALUES = {
    oldPassword: '',
    showPassword: false
  };
  const [values, setValues] = React.useState<State>({
    ...INITIAL_VALUES
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const [error, setError] = React.useState('');

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

  const handleSetPassword = async () => {
    try {
      if (!values.oldPassword.trim()) {
        setError('Please enter your old password.');
      } else {
        if (await verifyPassword(values.oldPassword.trim())) {
          setError('');
          await passChangeEffect(null);
          lockscreen.setIsPasswordSet(false);
          removePassword();
          closeDialogBox();
          snackbar.showSnackbar(
            'Password removed Successfully !',
            'success',
            undefined,
            {
              dontCloseOnClickAway: true,
              autoHideDuration: 4000
            }
          );
        } else {
          setError('Old Password is incorrect');
        }
      }
    } catch (error) {
      logger.error('Error while removing password');
      logger.error(error);
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

  const confirmChangePassword = async () => {
    setIsLoading(true);
  };

  const closeDialogBox = () => {
    setValues({ ...INITIAL_VALUES });
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
      handleConfirmation={confirmChangePassword}
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
            Enter your password
          </Typography>
          <Input
            fullWidth
            size="small"
            type={values.showPassword ? 'text' : 'password'}
            value={values.oldPassword}
            placeholder="Enter Your Password"
            onChange={handleChange('oldPassword')}
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

RemovePassword.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RemovePassword;
