import { ALLCOINS as COINS, CoinGroup } from '@cypherock/communication';
import wallet from '@cypherock/wallet';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import ErrorDialog from '../../../../../../designSystem/designComponents/dialog/errorDialog';
import { addressDb } from '../../../../../../store/database';
import {
  useCoinSpecificDataContext,
  useCurrentCoin,
  useCustomAccountContext
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
import logger from '../../../../../../utils/logger';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletStoreCoinSpecificDataReceive';

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
  customAccount?: string
) => {
  let receiveAddress = '';
  let w;

  const coin = COINS[coinType];

  if (!coin) {
    throw new Error(`Invalid coinType ${coinType}`);
  }

  if (coin.group === CoinGroup.Ethereum) {
    w = wallet({ coinType, xpub, walletId, zpub, addressDB: addressDb });
    receiveAddress = (await w.newReceiveAddress()).toUpperCase();
    // To make the first x in lowercase
    receiveAddress = `0x${receiveAddress.slice(2)}`;
  } else if (coin.group === CoinGroup.Near && customAccount) {
    receiveAddress = customAccount;
  } else {
    w = wallet({ coinType, xpub, walletId, zpub, addressDB: addressDb });
    receiveAddress = await w.newReceiveAddress();
  }
  return receiveAddress;
};

const Receive: React.FC<StepComponentProps> = ({ handleClose }) => {
  const theme = useTheme();

  const { coinSpecificData } = useCoinSpecificDataContext();

  const [coinVerified, setCoinVerified] = useState(true);
  const [error, setError] = useState(false);

  const { coinDetails } = useCurrentCoin();

  const { customAccount } = useCustomAccountContext();

  React.useEffect(() => {
    if (!coinSpecificData.verified) {
      getReceiveAddress(
        coinDetails.slug,
        coinDetails.xpub,
        coinDetails.walletId,
        coinDetails.zpub,
        customAccount?.name
      )
        .then(addr => {
          setCoinVerified(false);
          return addr;
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

  return (
    <Root className={classes.root}>
      <div className={classes.addressContainer}>
        <Typography color="secondary" variant="h4">
          {customAccount?.name}
        </Typography>
      </div>
      {coinVerified && (
        <Typography
          color="textPrimary"
          className={classes.text}
          style={{ marginLeft: 'auto', marginRight: 'auto' }}
        >
          <CheckCircleOutlineIcon
            style={{ color: theme.palette.info.main, marginRight: '0.5rem' }}
          />
          Account Saved
        </Typography>
      )}
      {coinVerified || (
        <Typography color="error" className={classes.errorText}>
          <CancelIcon
            style={{ color: theme.palette.error.main, marginRight: '0.5rem' }}
          />
          This Account was&nbsp;
          <strong>NOT SAVED</strong>
          &nbsp; on the Device.&nbsp;
        </Typography>
      )}
    </Root>
  );
};

Receive.propTypes = StepComponentPropTypes;

export default Receive;
