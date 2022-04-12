import { Grid } from '@material-ui/core';
import MIconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import PropTypes from 'prop-types';
import React from 'react';

import DialogBoxConfirmation from '../../../../../../designSystem/designComponents/dialog/dialogBoxConfirmation';
import Input from '../../../../../../designSystem/designComponents/input/input';
import { useLockscreen } from '../../../../../../store/provider';
import {
  passChangeEffect,
  removePassword,
  verifyPassword
} from '../../../../../../utils/auth';
import logger from '../../../../../../utils/logger';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    inputs: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 'auto',
      width: '100%'
    },
    buttons: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    error: {
      color: theme.palette.error.main
    },
    marginTopBottom: {
      margin: '0.5rem 0rem'
    }
  })
);

interface State {
  oldPassword: string;
  showPassword: boolean;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

const RemovePassword: React.FC<Props> = ({ onClose, open }) => {
  const classes = useStyles();
  const theme = useTheme();
  const lockscreen = useLockscreen();
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
        <Grid
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
        </Grid>
      }
    />
  );
};

RemovePassword.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RemovePassword;
