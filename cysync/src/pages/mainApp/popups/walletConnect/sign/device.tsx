import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import ErrorDialog from '../../../../../designSystem/designComponents/dialog/errorDialog';
import TextView from '../../../../../designSystem/designComponents/textComponents/textView';
import { UseSignMessageValues } from '../../../../../store/hooks';
import {
  getProtoBufferEnum,
  useConnection,
  useWalletConnect,
  WalletConnectCallRequestMethodMap
} from '../../../../../store/provider';

import { WalletConnectMessage } from './confirmation';

const PREFIX = 'WalletConnect-Device';

const classes = {
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`,
  deviceDetails: `${PREFIX}-deviceDetails`,
  mainText: `${PREFIX}-mainText`,
  divider: `${PREFIX}-divider`,
  footer: `${PREFIX}-footer`,
  deviceContinueButon: `${PREFIX}-deviceContinueButon`,
  center: `${PREFIX}-center`,
  messageContainer: `${PREFIX}-messageContainer`
};

const Root = styled(Grid)(({ theme }) => ({
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  [`& .${classes.errorButtons}`]: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  },
  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  },
  [`& .${classes.deviceDetails}`]: {
    width: '70%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minHeight: '15rem'
  },
  [`& .${classes.mainText}`]: {
    fontSize: '1rem',
    color: theme.palette.primary.light,
    marginBottom: '1rem'
  },
  [`& .${classes.divider}`]: {
    width: '100%',
    borderTop: `1px solid ${theme.palette.text.secondary}`
  },
  [`& .${classes.footer}`]: {
    display: 'flex',
    alignItems: 'flex-end',
    width: '85%',
    justifyContent: 'flex-end'
  },
  [`& .${classes.deviceContinueButon}`]: {
    width: '10rem',
    height: '3rem',
    marginTop: 15,
    textTransform: 'none',
    color: '#fff',
    background: theme.palette.secondary.dark,
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.messageContainer}`]: {
    display: 'flex',
    background: '#1F262E',
    padding: '10px',
    flexDirection: 'column',
    maxHeight: '300px',
    overflowY: 'auto',
    width: '-webkit-fill-available',
    marginBottom: '20px'
  }
}));

type Props = {
  handleNext: () => void;
  handleClose: () => void;
  signMessage: UseSignMessageValues;
};

const WalletConnectSignMessageDevice: React.FC<Props> = ({
  handleClose,
  signMessage
}) => {
  const walletConnect = useWalletConnect();
  const [messageToSign, setMessageToSign] = React.useState('');
  const { deviceConnection, deviceSdkVersion, setIsInFlow } = useConnection();
  const [useJSON, setUseJSON] = React.useState(false);

  const signRequest = async () => {
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

    const account = walletConnect.selectedAccount;

    signMessage.handleSignMessage({
      connection: deviceConnection,
      sdkVersion: deviceSdkVersion,
      walletId: account.walletId,
      xpub: account.xpub,
      pinExists: account.pinExists,
      passphraseExists: account.passphraseExists,
      coinId: account.coinId,
      accountId: account.accountId,
      accountIndex: account.accountIndex,
      accountType: account.accountType,
      setIsInFlow,
      message,
      requestType: getProtoBufferEnum(walletConnect.callRequestMethod)
    });
  };

  const handleRetry = () => {
    signRequest();
  };

  React.useEffect(() => {
    signRequest();
  }, []);

  React.useEffect(() => {
    if (signMessage.signature) {
      walletConnect.approveCallRequest(signMessage.signature);
    }
  }, [signMessage.signature]);

  return (
    <>
      {signMessage.errorObj.isSet && (
        <ErrorDialog
          open={signMessage.errorObj.isSet}
          handleClose={() => handleClose()}
          errorObj={signMessage.errorObj}
          actionText="Retry"
          handleAction={handleRetry}
          flow="Sign Message"
        />
      )}
      <Root container>
        <WalletConnectMessage
          isJSON={useJSON}
          message={messageToSign}
          className={classes.messageContainer}
        />
        <div className={classes.deviceDetails}>
          <Typography color="textSecondary" variant="h6" gutterBottom>
            Follow the instructions on X1 Wallet
          </Typography>
          <TextView
            completed={signMessage.coinsConfirmed}
            inProgress={!signMessage.coinsConfirmed}
            text="Confirm On Device"
          />
          {walletConnect.selectedAccount.passphraseExists && (
            <>
              <TextView
                completed={signMessage.passphraseEntered}
                inProgress={
                  signMessage.coinsConfirmed && !signMessage.passphraseEntered
                }
                text="Enter Passphrase"
              />
            </>
          )}

          {walletConnect.selectedAccount.pinExists && (
            <>
              <TextView
                completed={signMessage.pinEntered && signMessage.cardsTapped}
                inProgress={
                  walletConnect.selectedAccount.passphraseExists &&
                  !signMessage.passphraseEntered
                    ? false
                    : !signMessage.pinEntered || !signMessage.cardsTapped
                }
                text="Enter PIN and Tap any X1 Card"
              />
            </>
          )}

          {walletConnect.selectedAccount.pinExists || (
            <TextView
              completed={signMessage.cardsTapped}
              inProgress={
                walletConnect.selectedAccount.passphraseExists &&
                !signMessage.cardsTapped
                  ? false
                  : signMessage.coinsConfirmed && !signMessage.cardsTapped
              }
              text="Tap any X1 Card"
              stylex={{ marginTop: '0px' }}
            />
          )}
        </div>
      </Root>
    </>
  );
};

WalletConnectSignMessageDevice.propTypes = {
  handleNext: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  signMessage: PropTypes.any.isRequired
};

export default WalletConnectSignMessageDevice;
