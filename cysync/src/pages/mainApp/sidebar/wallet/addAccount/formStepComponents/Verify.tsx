import { ALLCOINS as COINS } from '@cypherock/communication';
import { Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import { styled, Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import React, { useEffect, useState } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Backdrop from '../../../../../../designSystem/genericComponents/Backdrop';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  useCurrentCoin,
  useCustomAccountContext,
  useNetwork,
  useSendTransactionContext,
  useTokenContext
} from '../../../../../../store/provider';
import formatDisplayAmount from '../../../../../../utils/formatDisplayAmount';
import LabelText from '../../send/generalComponents/LabelText';

const PREFIX = 'WalletAddAccountVerify';

const classes = {
  root: `${PREFIX}-root`,
  detailsContainer: `${PREFIX}-detailsContainer`,
  mainText: `${PREFIX}-mainText`,
  divider: `${PREFIX}-divider`,
  footer: `${PREFIX}-footer`,
  verifyContinueButon: `${PREFIX}-verifyContinueButon`,
  transactionFeeDetails: `${PREFIX}-transactionFeeDetails`,
  primaryText: `${PREFIX}-primaryText`,
  center: `${PREFIX}-center`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.detailsContainer}`]: {
    width: '70%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: '1rem'
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
  [`& .${classes.verifyContinueButon}`]: {
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
  [`& .${classes.transactionFeeDetails}`]: {
    width: '100%',
    marginLeft: '15px'
  },
  [`& .${classes.primaryText}`]: {
    color: theme.palette.secondary.dark
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
}));

const CustomAlert = withStyles((theme: Theme) =>
  createStyles({
    filledWarning: {
      backgroundColor: '#E19A4C',
      color: theme.palette.primary.main
    }
  })
)(Alert);

const Verify = (props: any) => {
  const { recipientData } = props;

  const { coinDetails } = useCurrentCoin();

  const { token } = useTokenContext();

  const { customAccount } = useCustomAccountContext();

  const { connected } = useNetwork();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  const { sendTransaction } = useSendTransactionContext();

  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (sendTransaction.metadataSent) setOpen(false);
  }, [sendTransaction.metadataSent]);

  useEffect(() => {
    const { handleNext } = props;
    if (sendTransaction.verified) {
      setTimeout(handleNext, 500);
    }
  }, [sendTransaction.verified]);

  return (
    <Root className={classes.root}>
      <Backdrop open={open} />

      <div className={classes.detailsContainer}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <CustomAlert severity="info" variant="filled" color="warning">
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div>Confirm the Account on Device</div>
            </div>
          </CustomAlert>
        </div>
        {coinAbbr.toUpperCase() === 'ETHR' && (
          <Typography color="error">
            [ This is a Ropsten
            <strong>&nbsp;Testnet&nbsp;</strong>
            transaction only ]
          </Typography>
        )}
        <>
          <LabelText
            label="Coin"
            text={(COINS[coinAbbr] || { name: '' }).name}
            verified={sendTransaction.pinEntered}
          />
          {customAccount ? (
            <LabelText
              label="Sender"
              text={customAccount.name}
              verified={sendTransaction.verified}
            />
          ) : (
            <></>
          )}
          <LabelText
            label="New Account Id"
            text={recipientData.recipient}
            verified={sendTransaction.verified}
          />
          <LabelText
            label="Transaction Fees"
            text={`~ ${0.1012} ${coinDetails.slug.toUpperCase()} ( $${formatDisplayAmount(
              sendTransaction.totalFees * parseFloat(coinDetails.displayPrice),
              2,
              true
            )})`}
            verified={sendTransaction.verified}
          />
        </>

        {connected || (
          <div style={{ marginTop: '10px' }} className={classes.center}>
            <Icon
              size={50}
              viewBox="0 0 60 60"
              iconGroup={<ErrorExclamation />}
            />
            <Typography variant="body2" color="secondary">
              Internet connection is required for this action
            </Typography>
          </div>
        )}
      </div>
    </Root>
  );
};

export default Verify;
