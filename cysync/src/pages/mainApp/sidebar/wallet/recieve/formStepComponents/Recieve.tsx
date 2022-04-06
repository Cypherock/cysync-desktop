import { ALLCOINS as COINS } from '@cypherock/communication';
import wallet from '@cypherock/wallet';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import QRCode from 'qrcode';
import React, { useState } from 'react';

import ErrorDialog from '../../../../../../designSystem/designComponents/dialog/errorDialog';
import { Databases, dbUtil } from '../../../../../../store/database';
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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: '3rem 8rem 3rem'
    },
    addressContainer: {
      background: 'rgba(0,0,0,0.2)', // TODO: Need to define colors in theme
      padding: '5%',
      marginBottom: '1.5rem',
      borderRadius: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    copyButton: {
      marginLeft: '40px',
      textTransform: 'none'
    },
    text: {
      margin: '1rem 0rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.palette.info.main
    },
    errorText: {
      margin: '1rem 0rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.palette.error.main
    },
    link: {
      fontSize: '1rem',
      alignText: 'bottom',
      textDecoration: 'none',
      color: 'blue',
      '&:active': {
        color: 'blue'
      }
    },
    externalLinkContainer: {
      display: 'flex',
      alignItems: 'center'
    },
    qrWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    qrImage: {
      height: 150,
      width: 150
    }
  })
);

const getReceiveAddress = async (
  coinType: string,
  xpub: string,
  zpub?: string
) => {
  let receiveAddress = '';
  let w;

  const coin = COINS[coinType];

  if (!coin) {
    throw new Error(`Invalid coinType ${coinType}`);
  }

  if (coin.isEth) {
    w = wallet({
      coinType,
      xpub,
      zpub,
      addressDbUtil: (...args: any) => {
        return dbUtil(Databases.ADDRESS, args[0], ...args.slice(1));
      }
    });
    receiveAddress = (await w.newReceiveAddress()).toUpperCase();
    // To make the first x in lowercase
    receiveAddress = `0x${receiveAddress.slice(2)}`;
  } else {
    w = wallet({
      coinType,
      xpub,
      zpub,
      addressDbUtil: (...args: any) => {
        return dbUtil(Databases.ADDRESS, args[0], ...args.slice(1));
      }
    });
    receiveAddress = await w.newReceiveAddress();
  }
  return receiveAddress;
};

const Receive: React.FC<StepComponentProps> = ({ handleClose }) => {
  const classes = useStyles();
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

  const coinAbbr = token ? token.coin : coinDetails.coin;

  React.useEffect(() => {
    if (!coinAddress || !receiveTransaction.verified) {
      getReceiveAddress(coinDetails.coin, coinDetails.xpub, coinDetails.zpub)
        .then(addr => {
          setCoinAddress(addr);
          setCoinVerified(false);
          receiveTransaction.onNewReceiveAddr(
            addr,
            selectedWallet.walletId,
            coinDetails.coin
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
      <div className={classes.root}>
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
      </div>
    );

  return (
    <div className={classes.root}>
      <CircularProgress color="secondary" size={40} />
    </div>
  );
};

Receive.propTypes = StepComponentPropTypes;

export default Receive;
