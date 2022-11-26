import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import CoinIcon from '../../../../../designSystem/genericComponents/coinIcons';
import { useConnection, useWalletConnect } from '../../../../../store/provider';

const PREFIX = 'WalletConnect-Connected';

const classes = {
  accountDisplayConatiner: `${PREFIX}-accountDisplayConatiner`,
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`
};

const Root = styled('div')(() => ({
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
    justifyContent: 'flex-end',
    width: '100%'
  },
  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  }
}));

type Props = {
  handleNext: () => void;
};

const WalletConnectSignConfirm: React.FC<Props> = ({ handleNext }) => {
  const walletConnect = useWalletConnect();
  const { beforeFlowStart } = useConnection();

  const onContinue = () => {
    if (beforeFlowStart()) {
      handleNext();
    }
  };

  return (
    <Root>
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
              <CoinIcon initial={walletConnect.selectedAccount.slug} />
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

      <Typography color="textPrimary" variant="body2" gutterBottom>
        {walletConnect.callRequestId}
      </Typography>

      <Typography color="textPrimary" variant="body2" gutterBottom>
        {walletConnect.callRequestMethod}
      </Typography>

      <Typography
        color="textPrimary"
        variant="body2"
        gutterBottom
        sx={{ overflowWrap: 'anywhere' }}
      >
        {JSON.stringify(walletConnect.callRequestParams)}
      </Typography>

      <div className={classes.errorButtons}>
        <CustomButton
          onClick={onContinue}
          style={{
            padding: '0.5rem 3rem',
            margin: '1rem 0rem'
          }}
        >
          Continue
        </CustomButton>
      </div>
    </Root>
  );
};

WalletConnectSignConfirm.propTypes = {
  handleNext: PropTypes.func.isRequired
};

export default WalletConnectSignConfirm;
