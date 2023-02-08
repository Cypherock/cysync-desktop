import { FeatureName, isFeatureEnabled } from '@cypherock/communication';
import { styled, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
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
    background: '#1F262E',
    padding: '10px',
    flexDirection: 'column',
    maxHeight: '300px',
    overflowY: 'auto'
  }
}));

export const WalletConnectMessage: React.FC<{
  isJSON: boolean;
  message: string;
  className: string;
}> = ({ isJSON, message, className }) => {
  const theme = useTheme();
  return (
    <div className={className}>
      {isJSON || (
        <Typography
          color="textPrimary"
          variant="body1"
          gutterBottom
          sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}
        >
          {message}
        </Typography>
      )}

      {isJSON && (
        <ReactJson
          src={JSON.parse(message)}
          // theme="tomorrow"
          theme={{
            base00: '#1F262E',
            base01: theme.palette.text.secondary,
            base02: theme.palette.text.secondary,
            base03: theme.palette.text.primary,
            base04: theme.palette.info.main,
            base05: theme.palette.text.primary,
            base06: theme.palette.text.primary,
            base07: theme.palette.text.primary,
            base08: theme.palette.text.primary,
            base09: theme.palette.secondary.main,
            base0A: theme.palette.secondary.main,
            base0B: theme.palette.secondary.main,
            base0C: theme.palette.secondary.main,
            base0D: theme.palette.secondary.main,
            base0E: theme.palette.secondary.main,
            base0F: theme.palette.secondary.main
          }}
          quotesOnKeys={false}
          displayDataTypes={false}
          enableClipboard={false}
          name={false}
          iconStyle={'triangle'}
          collapseStringsAfterLength={32}
          groupArraysAfterLength={32}
        />
      )}
    </div>
  );
};

type Props = {
  handleNext: () => void;
  handleClose: () => void;
  signMessage: UseSignMessageValues;
};

const WalletConnectSignConfirm: React.FC<Props> = ({ handleNext }) => {
  const walletConnect = useWalletConnect();
  const { beforeFlowStart, deviceConnection, deviceSdkVersion } =
    useConnection();
  const [messageToSign, setMessageToSign] = React.useState('');
  const [walletConnectSupported, setWalletConnectSupported] =
    React.useState(false);
  const [useJSON, setUseJSON] = React.useState(false);

  const onContinue = () => {
    if (beforeFlowStart()) {
      handleNext();
    }
  };
  useEffect(() => {
    if (deviceSdkVersion)
      setWalletConnectSupported(
        isFeatureEnabled(FeatureName.WalletConnectSupport, deviceSdkVersion)
      );
  }, [deviceSdkVersion]);

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

      <WalletConnectMessage
        isJSON={useJSON}
        message={messageToSign}
        className={classes.messageContainer}
      />

      <div className={classes.errorButtons}>
        {
          <Tooltip
            title={
              !deviceConnection
                ? 'Connect X1 Wallet'
                : !walletConnectSupported
                ? 'Update X1 Wallet to use this feature'
                : ''
            }
          >
            <span>
              <CustomButton
                onClick={onContinue}
                style={{
                  padding: '0.5rem 3rem',
                  margin: '1rem 0rem'
                }}
                disabled={!deviceConnection || !walletConnectSupported}
              >
                Continue
              </CustomButton>
            </span>
          </Tooltip>
        }
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
