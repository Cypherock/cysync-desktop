import { Grid } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import DialogBoxConfirmation from '../../../../../../designSystem/designComponents/dialog/dialogBoxConfirmation';
import Input from '../../../../../../designSystem/designComponents/input/input';
import { useSnackbar } from '../../../../../../store/provider';
import logger from '../../../../../../utils/logger';

const PREFIX = 'SetEmail';

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
  email: string;
}

type Props = {
  open: boolean;
  remove: boolean;
  emailText: string;
  onClose: () => void;
};

const isValidEmail = (email: string) => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(email.trim());
};

const SetEmail: React.FC<Props> = ({ onClose, open, remove, emailText }) => {
  const theme = useTheme();
  const snackbar = useSnackbar();
  const INITIAL_VALUES = {
    email: emailText
  };

  const [values, setValues] = React.useState<State>({
    ...INITIAL_VALUES
  });
  const [isLoading, setIsLoading] = React.useState(false);

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

  const handleSetEmail = async () => {
    try {
      if (remove) {
        localStorage.setItem('email', '');
        snackbar.showSnackbar(
          'Email removed Successfully !',
          'success',
          undefined,
          {
            dontCloseOnClickAway: true,
            autoHideDuration: 4000
          }
        );
        closeDialogBox();
      } else {
        if (!values.email.trim()) {
          setError('Enter your email');
        } else {
          if (isValidEmail(values.email)) {
            setError('');
            localStorage.setItem('email', values.email.trim());
            setValues({
              ...INITIAL_VALUES,
              email: values.email.trim()
            });
            snackbar.showSnackbar(
              'Email set Successfully !',
              'success',
              undefined,
              {
                dontCloseOnClickAway: true,
                autoHideDuration: 4000
              }
            );
            closeDialogBox();
          } else {
            setError('Email is invalid');
          }
        }
      }
    } catch (error) {
      logger.error('Error while modifying email');
      logger.error(error);
    }
    setIsLoading(false);
  };

  const timeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  React.useEffect(() => {
    if (isLoading) {
      timeout.current = setTimeout(handleSetEmail, 0);
    }

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }
    };
  }, [isLoading]);
  React.useEffect(() => {
    setValues({
      ...INITIAL_VALUES,
      email: emailText
    });
  }, [emailText]);

  const confirmChangeEmail = async () => {
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
      handleConfirmation={confirmChangeEmail}
      confirmButtonDisabled={isLoading}
      confirmButtonText={remove ? 'Yes' : 'Confirm'}
      hideRejectButton={!remove}
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
            {remove ? 'Do you want to remove your email?' : 'Enter your email'}
          </Typography>
          {remove || (
            <Input
              fullWidth
              size="small"
              type="text"
              value={values.email}
              placeholder="Enter Your Email"
              onChange={handleChange('email')}
              onKeyDown={handleKeyPress}
              className={classes.marginTopBottom}
            />
          )}
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

SetEmail.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SetEmail;
