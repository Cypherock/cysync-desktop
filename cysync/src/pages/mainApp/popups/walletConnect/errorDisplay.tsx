import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../designSystem/iconGroups/errorExclamation';
import { useWalletConnect } from '../../../../store/provider';
const PREFIX = 'WalletConnect-ErrorDisplay';

const classes = {
  form: `${PREFIX}-form`,
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`,
  advanceText: `${PREFIX}-advanceText`
};

const Root = styled(Grid)(() => ({
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
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
  },

  [`& .${classes.advanceText}`]: {
    marginTop: '2rem',
    padding: '15px',
    backgroundColor: '#171717',
    borderRadius: '3px',
    fontSize: '14px',
    wordBreak: 'break-all'
  }
}));

type Props = {
  handleClose: () => void;
};

const WalletConnectErrorDisplay: React.FC<Props> = () => {
  const walletConnect = useWalletConnect();

  return (
    <Root container>
      <Icon size={100} viewBox=" 0 0 55 55" iconGroup={<ErrorExclamation />} />
      <Typography
        color="textPrimary"
        variant="h4"
        gutterBottom
        textAlign={'center'}
        width={'100%'}
        marginTop={'30px'}
      >
        {walletConnect.errorTitle || 'Error occurred while connecting...'}
      </Typography>
      <Typography
        variant="body1"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        color={'GrayText'}
        textAlign={'center'}
        width={'100%'}
        marginBottom={'12px'}
      >
        {walletConnect.errorSubtitle || 'Retry the connection from the dApp'}
      </Typography>
      <div className={classes.advanceText}>
        <Typography variant="caption">
          {walletConnect.connectionError}
        </Typography>
      </div>
    </Root>
  );
};

WalletConnectErrorDisplay.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default WalletConnectErrorDisplay;
