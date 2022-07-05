import { COINS, NearCoinData } from '@cypherock/communication';
import Server from '@cypherock/server-wrapper';
import wallet, { NearWallet } from '@cypherock/wallet';
import LaunchIcon from '@mui/icons-material/Launch';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { shell } from 'electron';
import React, { useEffect } from 'react';

import CustomIconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import {
  useCurrentCoin,
  useCustomAccountContext,
  useReceiveTransactionContext
} from '../../../../../../store/provider';
import logger from '../../../../../../utils/logger';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletReceiveVerification';

const classes = {
  root: `${PREFIX}-root`,
  addressContainer: `${PREFIX}-addressContainer`,
  copyButton: `${PREFIX}-copyButton`,
  transactionId: `${PREFIX}-transactionId`
};

const Root = styled('div')(() => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: 'fit-content',
    padding: '3rem 10rem 3rem',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  [`& .${classes.addressContainer}`]: {
    background: 'rgba(0,0,0,0.2)',
    minWidth: '92%',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.copyButton}`]: {
    textTransform: 'none'
  },
  [`& .${classes.transactionId}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

const Verification: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { receiveTransaction } = useReceiveTransactionContext();
  const { customAccount } = useCustomAccountContext();
  const { coinDetails } = useCurrentCoin();

  useEffect(() => {
    if (receiveTransaction.verified) {
      setTimeout(handleNext, 500);
    }
  }, [receiveTransaction.verified]);

  const address = receiveTransaction.receiveAddress;

  const handleExternalLink = async () => {
    const coin = COINS[coinDetails.slug];

    if (!coin) {
      logger.error('Invalid COIN in coinDetails: ' + coinDetails.slug);
      return;
    }

    if (!(coin instanceof NearCoinData)) {
      logger.error('Non near coin');
      return;
    } else {
      const w = wallet({
        coinType: coinDetails.slug,
        xpub: coinDetails.xpub,
        walletId: coinDetails.walletId
      });
      const url = Server.near.wallet.getCreateTxnLink({
        network: coin.network,
        address: customAccount.name,
        publicKey: (w as NearWallet).nearPublicKey
      });
      shell.openExternal(url);
    }
  };
  return (
    <Root className={classes.root}>
      <div className={classes.addressContainer}>
        <Typography color="secondary" variant="h4">
          {customAccount ? customAccount.name : address}
        </Typography>
      </div>
      {customAccount && !receiveTransaction.accountExists ? (
        <>
          <div className={classes.transactionId}>
            <Typography color="textSecondary">Near Explorer</Typography>
            {/* <Typography
            style={{ userSelect: 'text' }}
            color="textPrimary"
            variant="body1"
          >
            Some Text
          </Typography> */}
            <CustomIconButton
              title="Open Link"
              placement="top-start"
              onClick={handleExternalLink}
            >
              <LaunchIcon fontSize="medium" color="secondary" />
            </CustomIconButton>
          </div>
          <Typography color="textSecondary">
            Verify Account on Device
          </Typography>
          <TextView
            completed={receiveTransaction.verified}
            inProgress={!receiveTransaction.verified}
            text="Please Match the Key from CypherRock X1 and Account Id from desktop with Near Explorer"
          />
        </>
      ) : (
        <>
          <Typography color="textSecondary">
            Verify Address on Device
          </Typography>
          <TextView
            completed={receiveTransaction.verified}
            inProgress={!receiveTransaction.verified}
            text="Please Match the Address on CypherRock X1"
          />
        </>
      )}
    </Root>
  );
};

Verification.propTypes = StepComponentPropTypes;

export default Verification;
