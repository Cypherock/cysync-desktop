import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import {
  useCurrentCoin,
  useCustomAccountContext,
  useReceiveTransactionContext,
  useSnackbar,
  useTokenContext
} from '../../../../../../store/provider';
import prevent from '../../../../../../utils/preventPropagation';

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
  qrImage: `${PREFIX}-qrImage`,
  footer: `${PREFIX}-footer`,
  footerBtn: `${PREFIX}-footerBtn`
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
  },
  [`& .${classes.footer}`]: {
    display: 'flex',
    alignItems: 'flex-end',
    width: '100%',
    justifyContent: 'flex-end'
  },
  [`& .${classes.footerBtn}`]: {
    width: '10rem',
    height: '3rem',
    marginTop: 15,
    textTransform: 'none',
    color: '#fff'
  }
}));

const Receive: React.FC<StepComponentProps> = () => {
  const theme = useTheme();
  const snackbar = useSnackbar();

  const { receiveTransaction } = useReceiveTransactionContext();

  const [replaceAccountScreen, setReplaceAccountScreen] = useState(false);

  const { coinDetails } = useCurrentCoin();

  const { token } = useTokenContext();
  const { customAccount } = useCustomAccountContext();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  const handleReplaceAccount = (e: React.MouseEvent) => {
    prevent(e);
    receiveTransaction.replaceAccountAction.resolve(true);
    setReplaceAccountScreen(true);
    // handleClose();
  };

  if (receiveTransaction.coinAddress)
    return replaceAccountScreen ? (
      <Root className={classes.root}>
        <Typography>Save to device</Typography>
        <TextView
          completed={receiveTransaction.verifiedReplaceAccount}
          inProgress={!receiveTransaction.verifiedReplaceAccount}
          text="Select an Account to replace on the Device"
        />
      </Root>
    ) : (
      <Root className={classes.root}>
        {coinAbbr.toUpperCase() === 'ETHR' && (
          <Typography color="error" style={{ marginBottom: '0.5rem' }}>
            [ This is a Ropsten
            <strong>&nbsp;Testnet&nbsp;</strong>
            transaction only ]
          </Typography>
        )}
        <div className={classes.addressContainer}>
          <Typography
            color="secondary"
            variant={receiveTransaction.coinAddress.length > 44 ? 'h6' : 'h4'}
          >
            {receiveTransaction.coinAddress}
          </Typography>
          <Button
            color="secondary"
            variant="outlined"
            className={classes.copyButton}
            onClick={() => {
              navigator.clipboard.writeText(receiveTransaction.coinAddress);
              snackbar.showSnackbar('Copied to clipboard.', 'success');
            }}
          >
            Copy
          </Button>
        </div>
        <Grid container className={classes.qrWrapper}>
          {!receiveTransaction.imageData && !receiveTransaction.QRError ? (
            <CircularProgress color="secondary" size={40} />
          ) : receiveTransaction.imageData ? (
            <img
              src={receiveTransaction.imageData}
              alt="QRCode"
              className={classes.qrImage}
            />
          ) : (
            <></>
          )}
          <Typography color="textSecondary">
            QR Code Receiver Coin Address
          </Typography>
        </Grid>
        {receiveTransaction.coinVerified ? (
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
        ) : (
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
        {receiveTransaction.coinVerified &&
          customAccount &&
          receiveTransaction.replaceAccount && (
            <div className={classes.footer}>
              <CustomButton
                className={classes.footerBtn}
                onClick={handleReplaceAccount}
              >
                Save to Device?
              </CustomButton>
            </div>
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
