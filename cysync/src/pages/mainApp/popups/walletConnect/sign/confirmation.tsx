import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import ReactJson from 'react-json-view';

import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import { UseSignMessageValues } from '../../../../../store/hooks';
import {
  useConnection,
  useWalletConnect,
  WalletConnectCallRequestMethodMap
} from '../../../../../store/provider';
import { WalletConnectStatus } from '../connected';

const PREFIX = 'WalletConnect-Connected';

const classes = {
  accountDisplayConatiner: `${PREFIX}-accountDisplayConatiner`,
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`,
  messageContainer: `${PREFIX}-messageContainer`
};

const Root = styled('div')(() => ({
  padding: '20px',
  [`& .${classes.accountDisplayConatiner}`]: {
    boxSizing: 'border-box',
    marginTop: '24px',
    padding: '10px',
    background: '#1F262E',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: '2rem'
  },
  [`& .${classes.errorButtons}`]: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%'
  },
  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  },
  [`& .${classes.messageContainer}`]: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    maxHeight: '300px',
    overflow: 'auto'
  }
}));

type Props = {
  handleNext: () => void;
  handleClose: () => void;
  signMessage: UseSignMessageValues;
};

const WalletConnectSignConfirm: React.FC<Props> = ({ handleNext }) => {
  const walletConnect = useWalletConnect();
  const { beforeFlowStart, deviceConnection } = useConnection();
  const [messageToSign, setMessageToSign] = React.useState('');
  const [useJSON, setUseJSON] = React.useState(false);

  const onContinue = () => {
    if (beforeFlowStart()) {
      handleNext();
    }
  };

  const decodeMessage = () => {
    let message = '';
    if (
      walletConnect.callRequestMethod ===
      WalletConnectCallRequestMethodMap.SIGN_PERSONAL
    ) {
      message = walletConnect.callRequestParams[0];
      setMessageToSign(Buffer.from(message.slice(2), 'hex').toString());
    } else {
      message = walletConnect.callRequestParams[1];
      setMessageToSign(message);
    }
    if (
      walletConnect.callRequestMethod ===
      WalletConnectCallRequestMethodMap.SIGN_TYPED
    ) {
      setUseJSON(true);
    }
  };

  React.useEffect(() => {
    if (walletConnect.callRequestMethod && walletConnect.callRequestParams) {
      decodeMessage();
    }
  }, [walletConnect.callRequestParams, walletConnect.callRequestMethod]);

  return (
    <Root>
      <WalletConnectStatus walletConnect={walletConnect} />

      <Typography color="textSecondary" variant="h6" gutterBottom>
        Sign Message:
      </Typography>

      <div className={classes.messageContainer}>
        {useJSON || (
          <Typography
            color="textPrimary"
            variant="body1"
            gutterBottom
            sx={{ overflowWrap: 'anywhere' }}
          >
            {messageToSign}
          </Typography>
        )}

        {useJSON && (
          <ReactJson src={JSON.parse(messageToSign)} theme="twilight" />
        )}
      </div>

      <div className={classes.errorButtons}>
        {!deviceConnection && (
          <Tooltip title="Connect X1 Wallet">
            <span>
              <CustomButton
                onClick={onContinue}
                style={{
                  padding: '0.5rem 3rem',
                  margin: '1rem 0rem'
                }}
                disabled={!deviceConnection}
              >
                Continue
              </CustomButton>
            </span>
          </Tooltip>
        )}
        {deviceConnection && (
          <CustomButton
            onClick={onContinue}
            style={{
              padding: '0.5rem 3rem',
              margin: '1rem 0rem'
            }}
            disabled={!deviceConnection}
          >
            Continue
          </CustomButton>
        )}
      </div>
    </Root>
  );
};

WalletConnectSignConfirm.propTypes = {
  handleNext: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  signMessage: PropTypes.any.isRequired
};

export default WalletConnectSignConfirm;
