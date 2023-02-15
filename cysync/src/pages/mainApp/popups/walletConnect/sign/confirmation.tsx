import { addEIP712TypeFields } from '@cypherock/wallet';
import { styled, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';
import ReactJson from 'react-json-view';

import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import { useConnection, useWalletConnect } from '../../../../../store/provider';
import logger from '../../../../../utils/logger';
import { WalletConnectStatus } from '../connected';

import { ISignProps, SignPropTypes } from './types';

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

const processEIP712Field = (json: any, jsonWithType: any) => {
  if (jsonWithType?.data) {
    return json;
  }

  if (!jsonWithType?.children) {
    return undefined;
  }

  const obj: any = {};

  for (const child of jsonWithType.children) {
    obj[child.name] = processEIP712Field(json[child.name], child);
  }

  return obj;
};

const processEIP712 = (json: any) => {
  const jsonWithType = addEIP712TypeFields(json);
  let message = {};
  let domain = {};

  if (jsonWithType?.message) {
    message = processEIP712Field(json.message, jsonWithType.message);
  }

  if (jsonWithType?.domain) {
    domain = processEIP712Field(json.domain, jsonWithType.domain);
  }

  return {
    domain,
    message
  };
};

export const WalletConnectMessage: React.FC<{
  isJSON: boolean;
  message: string | any;
  className: string;
}> = ({ isJSON, message, className }) => {
  const theme = useTheme();

  const parsedMessage = React.useMemo(() => {
    if (!isJSON) return message;

    try {
      return processEIP712(message);
    } catch (error) {
      logger.error(error);
      return message || {};
    }
  }, [isJSON, message]);

  return (
    <div className={className}>
      {isJSON || (
        <Typography
          color="textPrimary"
          variant="body1"
          gutterBottom
          sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}
        >
          {parsedMessage}
        </Typography>
      )}

      {isJSON && (
        <ReactJson
          src={parsedMessage}
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
          displayObjectSize={false}
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

const WalletConnectSignConfirm: React.FC<ISignProps> = ({
  handleNext,
  walletConnectSupported,
  messageToSign,
  isJSON
}) => {
  const walletConnect = useWalletConnect();
  const { beforeFlowStart, deviceConnection } = useConnection();

  const onContinue = () => {
    if (beforeFlowStart()) {
      handleNext();
    }
  };

  return (
    <Root>
      <WalletConnectStatus walletConnect={walletConnect} />

      <Typography color="textSecondary" variant="h6" gutterBottom>
        Sign Message:
      </Typography>

      <WalletConnectMessage
        isJSON={isJSON}
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

WalletConnectSignConfirm.propTypes = SignPropTypes;

export default WalletConnectSignConfirm;
