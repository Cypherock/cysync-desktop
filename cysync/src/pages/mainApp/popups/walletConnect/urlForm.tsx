import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import Input from '../../../../designSystem/designComponents/input/input';
import {
  useWalletConnect,
  WalletConnectConnectionState
} from '../../../../store/provider';

const PREFIX = 'WalletConnect-UrlForm';

const classes = {
  form: `${PREFIX}-form`,
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`
};

const Root = styled(Grid)(() => ({
  padding: '20px',
  marginTop: '30px',
  [`& .${classes.form}`]: {
    width: '100%',
    maxWidth: '515px',
    margin: 'auto'
  },
  [`& .${classes.errorButtons}`]: {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%'
  },
  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  }
}));

type Props = {
  handleClose: () => void;
};

const WalletConnectUrlForm: React.FC<Props> = () => {
  const theme = useTheme();
  const walletConnect = useWalletConnect();

  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const isDisabled =
    walletConnect.connectionState === WalletConnectConnectionState.CONNECTING;

  const onPositiveClick = (e: any) => {
    e.preventDefault();

    if (isDisabled) return;

    if (!input.startsWith('wc')) {
      setError('Invalid url');
      return;
    }

    setError('');
    walletConnect.createConnection(input);
  };

  const handleChange = (e: any) => {
    setInput(e.target.value);
  };

  return (
    <Root container>
      <form onSubmit={onPositiveClick} className={classes.form}>
        <Typography color="textPrimary" variant="body2" gutterBottom>
          Enter connection URL
        </Typography>
        <Input
          fullWidth
          name="URL"
          placeholder="Connection URL"
          value={input}
          error={!!(error || walletConnect.connectionError)}
          onChange={handleChange}
          className={classes.padBottom}
          disabled={
            walletConnect.connectionState ===
            WalletConnectConnectionState.CONNECTING
          }
        />
        {(error || walletConnect.connectionError) && (
          <Typography
            variant="body2"
            style={{ color: theme.palette.error.main }}
          >
            {error || walletConnect.connectionError}
          </Typography>
        )}
        <div className={classes.errorButtons}>
          <CustomButton
            type="submit"
            style={{
              padding: '0.5rem 3rem',
              margin: '1rem 0rem'
            }}
            disabled={isDisabled}
          >
            Continue
          </CustomButton>
        </div>
      </form>
    </Root>
  );
};

WalletConnectUrlForm.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default WalletConnectUrlForm;
