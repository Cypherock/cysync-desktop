import { ALLCOINS as COINS } from '@cypherock/communication';
import wallet from '@cypherock/wallet';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import QRCode from 'qrcode';
import React, { useState } from 'react';

import ErrorDialog from '../../../../../../designSystem/designComponents/dialog/errorDialog';
import { addressDb } from '../../../../../../store/database';
import {
  useCurrentCoin,
  useReceiveTransactionContext,
  useSelectedWallet,
  useSnackbar,
  useTokenContext
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
import logger from '../../../../../../utils/logger';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletReceiveReceive';

const classes = {
  root: `${PREFIX}-root`,
  addressContainer: `${PREFIX}-addressContainer`,
  copyButton: `${PREFIX}-copyButton`,
  text: `${PREFIX}-text`,
  errorText: `${PREFIX}-errorText`,
  link: `${PREFIX}-link`,
  externalLinkContainer: `${PREFIX}-externalLinkContainer`,
  qrWrapper: `${PREFIX}-qrWrapper`,
  qrImage: `${PREFIX}-qrImage`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: '3rem 8rem 3rem'
  },
  [`& .${classes.addressContainer}`]: {
    background: 'rgba(0,0,0,0.2)', // TODO: Need to define colors in theme
    padding: '5%',
    marginBottom: '1.5rem',
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.copyButton}`]: {
    marginLeft: '40px',
    textTransform: 'none'
  },
  [`& .${classes.text}`]: {
    margin: '1rem 0rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.info.main
  },
  [`& .${classes.errorText}`]: {
    margin: '1rem 0rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.error.main
  },
  [`& .${classes.link}`]: {
    fontSize: '1rem',
    alignText: 'bottom',
    textDecoration: 'none',
    color: 'blue',
    '&:active': {
      color: 'blue'
    }
  },
  [`& .${classes.externalLinkContainer}`]: {
    display: 'flex',
    alignItems: 'center'
  },
  [`& .${classes.qrWrapper}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  [`& .${classes.qrImage}`]: {
    height: 150,
    width: 150
  }
}));

const getReceiveAddress = async (
  coinType: string,
  xpub: string,
  walletId: string,
  zpub?: string,
) => {
  let receiveAddress = '';
  let w;

  const coin = COINS[coinType];

  if (!coin) {
    throw new Error(`Invalid coinType ${coinType}`);
  }

  if (coin.isEth) {
    w = wallet({ coinType, xpub, walletId, zpub, addressDB: addressDb });
    receiveAddress = (await w.newReceiveAddress()).toUpperCase();
    // To make the first x in lowercase
    receiveAddress = `0x${receiveAddress.slice(2)}`;
  } else {
    w = wallet({ coinType, xpub, walletId, zpub, addressDB: addressDb });
    receiveAddress = await w.newReceiveAddress();
  }
  return receiveAddress;
};

const Receive: React.FC<StepComponentProps> = ({ handleClose }) => {
  const theme = useTheme();
  const snackbar = useSnackbar();

  const { receiveTransaction } = useReceiveTransactionContext();

  const [coinAddress, setCoinAddress] = useState(
    receiveTransaction.receiveAddress
  );
  const [coinVerified, setCoinVerified] = useState(true);
  const [error, setError] = useState(false);
  const [QRError, setQRError] = useState(false);

  const { coinDetails } = useCurrentCoin();
  const { selectedWallet } = useSelectedWallet();

  const { token } = useTokenContext();

  const coinAbbr = token ? token.coin : coinDetails.slug;

  React.useEffect(() => {
    if (!coinAddress || !receiveTransaction.verified) {
      getReceiveAddress(coinDetails.slug, coinDetails.xpub, coinDetails.walletId, coinDetails.zpub, )
        .then(addr => {
          setCoinAddress(addr);
          setCoinVerified(false);
          receiveTransaction.onNewReceiveAddr(
            addr,
            selectedWallet._id,
            coinDetails.slug
          );
          return null;
        })
        .catch(err => {
          logger.error('Error in Generating Unverified receiveAddress');
          logger.error(err);
          setError(true);
          Analytics.Instance.event(
            Analytics.Categories.RECEIVE_ADDR,
            Analytics.Actions.ERROR
          );
        });
    }
  }, []);

  const [imageData, setImageData] = React.useState('');

  React.useEffect(() => {
    if (coinAddress) {
      Analytics.Instance.event(
        Analytics.Categories.RECEIVE_ADDR,
        Analytics.Actions.COMPLETED
      );
      QRCode.toDataURL(coinAddress, {
        errorCorrectionLevel: 'H',
        margin: 0.5,
        color: {
          dark: '#131619'
        }
      })
        .then(url => {
          setImageData(url);
          return null;
        })
        .catch(err => {
          logger.error('Error in building QR Code');
          logger.error(err);
          setQRError(true);
        });
    }
  }, [coinAddress]);

  if (error) {
    return (
      <ErrorDialog
        open={error}
        handleClose={() => handleClose()}
        text="Failed to communicate with the blockchain. Please check your internet connection and try again later."
        flow="Generating Receive Address"
      />
    );
  }

  if (coinAddress)
    return (
      <Root className={classes.root}>
        {coinAbbr.toUpperCase() === 'ETHR' && (
          <Typography color="error" style={{ marginBottom: '0.5rem' }}>
            [ This is a Ropsten
            <strong>&nbsp;Testnet&nbsp;</strong>
            transaction only ]
          </Typography>
        )}
        <div className={classes.addressContainer}>
          <Typography color="secondary" variant="h4">
            {coinAddress}
          </Typography>
          <Button
            color="secondary"
            variant="outlined"
            className={classes.copyButton}
            onClick={() => {
              navigator.clipboard.writeText(coinAddress);
              snackbar.showSnackbar('Copied to clipboard.', 'success');
            }}
          >
            Copy
          </Button>
        </div>
        <Grid container className={classes.qrWrapper}>
          {!imageData && !QRError ? (
            <CircularProgress color="secondary" size={40} />
          ) : imageData ? (
            <img src={imageData} alt="QRCode" className={classes.qrImage} />
          ) : (
            <></>
          )}
          <Typography color="textSecondary">
            QR Code Receiver Coin Address
          </Typography>
        </Grid>
        {coinVerified && (
          <Typography
            color="textPrimary"
            className={classes.text}
            style={{ marginLeft: 'auto', marginRight: 'auto' }}
          >
            <CheckCircleOutlineIcon
              style={{ color: theme.palette.info.main, marginRight: '0.5rem' }}
            />
            Address Verified
          </Typography>
        )}
        {coinVerified || (
          <Typography color="error" className={classes.errorText}>
            <CancelIcon
              style={{ color: theme.palette.error.main, marginRight: '0.5rem' }}
            />
            This Receive Address was&nbsp;
            <strong>NOT VERIFIED</strong>
            &nbsp; by the Device.&nbsp;
            <strong>Please use it at your own Risk.</strong>
          </Typography>
        )}
      </Root>
    );

  return (
    <Root className={classes.root}>
      <CircularProgress color="secondary" size={40} />
    </Root>
  );
};

Receive.propTypes = StepComponentPropTypes;

export default Receive;
