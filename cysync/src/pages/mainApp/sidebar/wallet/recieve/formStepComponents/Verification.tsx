import { COINS, NearCoinData } from '@cypherock/communication';
import Server from '@cypherock/server-wrapper';
import { NearWallet } from '@cypherock/wallet';
import LaunchIcon from '@mui/icons-material/Launch';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { shell } from 'electron';
import React, { useEffect } from 'react';

import NearExplorerImage from '../../../../../../assets/appScreens/nearExplorerInfo.png';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
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
  transactionId: `${PREFIX}-transactionId`,
  footer: `${PREFIX}-footer`,
  footerBtn: `${PREFIX}-footerBtn`,
  link: `${PREFIX}-link`,
  whiteText: `${PREFIX}-whiteText`
};

const Root = styled('div')(() => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: 'auto',
    padding: '3rem 10rem 3rem',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  [`& .${classes.addressContainer}`]: {
    background: 'rgba(0,0,0,0.2)',
    padding: '5%',
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
  },
  [`& .${classes.link}`]: {
    display: 'flex',
    cursor: 'pointer'
  },
  [`& .${classes.whiteText}`]: {
    color: 'white'
  }
}));

const Verification: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { receiveTransaction } = useReceiveTransactionContext();
  const { customAccount } = useCustomAccountContext();
  const { coinDetails } = useCurrentCoin();
  const [linkOpened, setLinkOpened] = React.useState(false);
  const [reachedTarget, setReachedTarget] = React.useState(false);

  useEffect(() => {
    if (receiveTransaction.verified) {
      setTimeout(handleNext, 500);
    }
  }, [receiveTransaction.verified]);

  const address = receiveTransaction.receiveAddress;

  const handleExternalLink = async () => {
    setLinkOpened(true);
    const coin = COINS[coinDetails.coinId];

    if (!coin) {
      logger.error('Invalid COIN in coinDetails: ' + coinDetails.coinId);
      return;
    }

    if (!(coin instanceof NearCoinData)) {
      logger.error('Not a near coin');
      return;
    } else {
      const w = new NearWallet(
        coinDetails.accountIndex,
        coinDetails.xpub,
        coin
      );
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
      {customAccount && !receiveTransaction.accountExists ? (
        linkOpened && reachedTarget ? (
          <>
            <Typography color="textSecondary">
              Verify details between the blockchain and the device
            </Typography>
            <TextView
              completed={receiveTransaction.verifiedAccountId}
              inProgress={!receiveTransaction.verifiedAccountId}
              text={
                <Typography>
                  Verify "
                  <span className={classes.whiteText}>new_account_id</span>" on
                  the device
                </Typography>
              }
            />
            <TextView
              completed={receiveTransaction.verified}
              inProgress={
                receiveTransaction.verifiedAccountId &&
                !receiveTransaction.verified
              }
              text={
                <Typography>
                  Verify "
                  <span className={classes.whiteText}>new_public_key</span>" on
                  the device
                </Typography>
              }
            />
          </>
        ) : (
          <>
            <Typography color="textSecondary">
              Visit the Near Explorer to verify the account belongs to you
            </Typography>
            <TextView
              completed={linkOpened}
              inProgress={!linkOpened}
              text={
                <div className={classes.transactionId}>
                  <Typography>Go to the &nbsp;</Typography>
                  <div className={classes.link} onClick={handleExternalLink}>
                    <Typography color="secondary"> Near Explorer </Typography>
                    <LaunchIcon fontSize="medium" color="secondary" />
                  </div>
                </div>
              }
            />
            <TextView
              completed={reachedTarget}
              inProgress={linkOpened && !reachedTarget}
              text={
                <Typography>
                  Scroll to the section which contains "
                  <span className={classes.whiteText}>new_account_id</span>", "
                  <span className={classes.whiteText}>new_public_key</span>" as
                  shown below
                </Typography>
              }
            />
            <img src={NearExplorerImage} style={{ width: '100%' }} />
            <div className={classes.footer}>
              <CustomButton
                className={classes.footerBtn}
                onClick={() => {
                  receiveTransaction.userAction.current.resolve(true);
                  setReachedTarget(true);
                }}
                disabled={!linkOpened}
                autoFocus
              >
                Next
              </CustomButton>
            </div>
          </>
        )
      ) : (
        <>
          <div className={classes.addressContainer}>
            <Typography
              color="secondary"
              variant={
                (customAccount?.name || address).length > 44 ? 'h6' : 'h4'
              }
            >
              {customAccount ? customAccount.name : address}
            </Typography>
          </div>
          <Typography color="textSecondary">
            Verify Address on Device
          </Typography>
          <TextView
            completed={receiveTransaction.verified}
            inProgress={!receiveTransaction.verified}
            text="Match the Address on Cypherock X1"
          />
        </>
      )}
    </Root>
  );
};

Verification.propTypes = StepComponentPropTypes;

export default Verification;
