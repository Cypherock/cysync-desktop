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
import Analytics from '../../../../utils/analytics';
import logger from '../../../../utils/logger';

const PREFIX = 'WalletConnect-UrlForm';

const classes = {
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`
};

const Root = styled(Grid)(() => ({
  padding: '20px',
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-around',
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

  const onPositiveClick = () => {
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
      <Typography color="textPrimary" variant="body2" gutterBottom>
        Enter connection URL
      </Typography>
      <Input
        fullWidth
        name="URL"
        placeholder="Connection URL"
        value={input}
        onChange={handleChange}
        className={classes.padBottom}
        disabled={
          walletConnect.connectionState ===
          WalletConnectConnectionState.CONNECTING
        }
      />
      {error ||
        (walletConnect.connectionError && (
          <Typography
            variant="caption"
            style={{ color: theme.palette.error.main }}
          >
            {error || walletConnect.connectionError}
          </Typography>
        ))}
      <div className={classes.errorButtons}>
        <CustomButton
          onClick={onPositiveClick}
          style={{ margin: '1rem 0rem' }}
          disabled={
            walletConnect.connectionState ===
            WalletConnectConnectionState.CONNECTING
          }
        >
          Submit
        </CustomButton>
      </div>
    </Root>
  );
};

WalletConnectUrlForm.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default WalletConnectUrlForm;
