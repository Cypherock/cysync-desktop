import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import CoinIcon from '../../../../designSystem/genericComponents/coinIcons';
import { useWalletConnect } from '../../../../store/provider';

import ClientMeta from './clientMeta';

const PREFIX = 'WalletConnect-Connected';

const classes = {
  accountDisplayConatiner: `${PREFIX}-accountDisplayConatiner`,
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`
};

const Root = styled(Grid)(() => ({
  padding: '20px',
  [`& .${classes.accountDisplayConatiner}`]: {
    marginTop: '24px',
    padding: '10px',
    background: '#1F262E',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  },
  [`& .${classes.errorButtons}`]: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  },
  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  }
}));

type Props = {
  handleClose: () => void;
};

const WalletConnectAccountSelection: React.FC<Props> = () => {
  const walletConnect = useWalletConnect();

  return (
    <Root container>
      <ClientMeta />

      {walletConnect.selectedAccount && (
        <>
          <Typography
            align="center"
            color="textPrimary"
            variant="body2"
            gutterBottom
            sx={{ color: '#7E7D7D', marginLeft: 'auto', marginRight: 'auto' }}
          >
            Connected to the following account through your wallet:
          </Typography>

          <div className={classes.accountDisplayConatiner}>
            <div
              style={{
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <CoinIcon initial={walletConnect.selectedAccount.coinId} />
              <Typography color="textPrimary" variant="body2" sx={{ ml: 2 }}>
                {walletConnect.selectedAccount.name}
              </Typography>
            </div>
            <Typography
              color="textPrimary"
              variant="body2"
              gutterBottom
              sx={{ color: '#7E7D7D' }}
            >
              {walletConnect.selectedAccount.address}
            </Typography>
          </div>
        </>
      )}

      <div className={classes.errorButtons}>
        <CustomButton
          onClick={walletConnect.handleClose}
          style={{
            padding: '0.5rem 3rem',
            margin: '1rem 0rem'
          }}
        >
          Disconnect
        </CustomButton>
      </div>
    </Root>
  );
};

WalletConnectAccountSelection.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default WalletConnectAccountSelection;
