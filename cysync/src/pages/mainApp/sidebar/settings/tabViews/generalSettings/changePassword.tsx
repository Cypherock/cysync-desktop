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
import { useLockscreen, useSnackbar } from '../../../../../../store/provider';
import {
  checkPassword,
  generatePasswordHash,
  passChangeEffect,
  setPasswordHash,
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
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

type Props = {
  type?: 'change' | 'set';
  handleChangePasswordDialog: boolean;
  closeChangePassword: () => void;
};

const ChangePassword: React.FC<Props> = ({
  type,
  closeChangePassword,
  handleChangePasswordDialog
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const lockscreen = useLockscreen();
  const snackbar = useSnackbar();
  const INITIAL_VALUES = {
    oldPassword: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
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

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleClickShowConfirmPassword = () => {
    setValues({ ...values, showConfirmPassword: !values.showConfirmPassword });
  };

  const closeDialogBox = () => {
    setValues({ ...INITIAL_VALUES });
    closeChangePassword();
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleSetPassword = async () => {
    try {
      if (values.password.trim() !== values.confirmPassword.trim()) {
        setError("Passwords Don't Match! Try Again");
      } else {
        const passwordCheckError = checkPassword(values.password.trim());
        if (passwordCheckError) {
          setError(passwordCheckError);
        } else if (type === 'change') {
          if (await verifyPassword(values.oldPassword.trim())) {
            if (values.password.trim() === values.oldPassword.trim()) {
              setError('New password cannot be same as old password');
            } else {
              setError('');
              const passHash = await generatePasswordHash(
                values.password.trim()
              );
              await passChangeEffect(passHash.singleHash);
              setPasswordHash(passHash.doubleHash);
              lockscreen.setIsPasswordSet(true);
              closeDialogBox();
              snackbar.showSnackbar(
                'Password changed Successfully !',
                'success',
                undefined,
                {
                  dontCloseOnClickAway: true,
                  autoHideDuration: 4000
                }
              );
            }
          } else {
            setError('Old Password is incorrect');
          }
        } else {
          setError('');
          const passHash = await generatePasswordHash(values.password.trim());
          await passChangeEffect(passHash.singleHash);
          setPasswordHash(passHash.doubleHash);
          lockscreen.setIsPasswordSet(true);
          closeDialogBox();
        }
      }
    } catch (error) {
      logger.error('Error while changing password');
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

  return (
    <DialogBoxConfirmation
      isClosePresent={!isLoading}
      isLoading={isLoading}
      fullScreen
      maxWidth="sm"
      open={handleChangePasswordDialog}
      handleClose={closeDialogBox}
      handleConfirmation={confirmChangePassword}
      confirmButtonDisabled={isLoading}
      rejectButtonDisabled={isLoading}
      restComponents={
        <Grid item xs={7} style={{ marginBottom: '6rem' }}>
          <Typography
            color="textPrimary"
            variant="h4"
            align="center"
            gutterBottom
            style={{ margin: '0rem 0rem 3rem' }}
          >
            {type === 'change'
              ? 'Change password for your App'
              : 'Set password'}
          </Typography>
          <div className={classes.inputs}>
            {type === 'change' ? (
              <Input
                fullWidth
                type={values.showPassword ? 'text' : 'password'}
                size="small"
                value={values.oldPassword}
                placeholder="Enter Old Password"
                onChange={handleChange('oldPassword')}
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
            ) : null}
            <Input
              fullWidth
              size="small"
              type={values.showPassword ? 'text' : 'password'}
              value={values.password}
              placeholder="Enter New Password"
              onChange={handleChange('password')}
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
            <Input
              fullWidth
              size="small"
              type={values.showConfirmPassword ? 'text' : 'password'}
              value={values.confirmPassword}
              placeholder="Confirm Password"
              onChange={handleChange('confirmPassword')}
              className={classes.marginTopBottom}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <MIconButton
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
                    </MIconButton>
                  </InputAdornment>
                )
              }}
            />
          </div>
          <Typography className={classes.error} align="center">
            {error}
          </Typography>
        </Grid>
      }
    />
  );
};

ChangePassword.propTypes = {
  type: PropTypes.oneOf(['change', 'set']),
  handleChangePasswordDialog: PropTypes.bool.isRequired,
  closeChangePassword: PropTypes.func.isRequired
};

ChangePassword.defaultProps = {
  type: undefined
};

export default ChangePassword;
