import { COINS } from '@cypherock/communication';
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
  useNetwork,
  useSendTransactionContext,
  useTokenContext
} from '../../../../../../store/provider';
import formatDisplayAmount from '../../../../../../utils/formatDisplayAmount';
import BatchTransactionRecieverView from '../formComponents/BatchTransactionRecieverView';
import LabelText from '../generalComponents/LabelText';

const PREFIX = 'WalletSendVerify';

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
  const { batchRecipientData, maxSend, activeButton } = props;

  const { coinDetails } = useCurrentCoin();

  const { token } = useTokenContext();

  const { connected } = useNetwork();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  const coinName = token
    ? COINS[coinDetails.slug]?.tokenList[token.slug]?.name
    : COINS[coinDetails.slug].name;

  const { sendTransaction } = useSendTransactionContext();

  const [open, setOpen] = useState(true);

  const coinPrice = token ? token.displayPrice : coinDetails.displayPrice;

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
              <div>Confirm the Amount & Address on Device</div>
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
        {activeButton === 0 ? (
          <>
            <LabelText
              label="Coin"
              text={coinName}
              verified={sendTransaction.pinEntered}
            />
            <LabelText
              label="Recipient"
              text={batchRecipientData[0].recipient}
              verified={sendTransaction.verified}
            />
            <LabelText
              label={`Amount ${coinAbbr.toUpperCase()}`}
              text={
                !maxSend
                  ? `${batchRecipientData[0].amount} ~( $${formatDisplayAmount(
                      batchRecipientData[0].amount * parseFloat(coinPrice),
                      2,
                      true
                    )}) `
                  : `${sendTransaction.sendMaxAmount} ~( $${formatDisplayAmount(
                      parseFloat(sendTransaction.sendMaxAmount) *
                        parseFloat(coinPrice),
                      2,
                      true
                    )}) `
              }
              verified={sendTransaction.verified}
            />
            <LabelText
              label="Transaction Fee"
              text={`~ ${
                sendTransaction.totalFees
              } ${coinDetails.slug.toUpperCase()} ( $${formatDisplayAmount(
                parseFloat(sendTransaction.totalFees) *
                  parseFloat(coinDetails.displayPrice),
                2,
                true
              )})`}
              verified={sendTransaction.verified}
            />
          </>
        ) : (
          <>
            {batchRecipientData.map((recipient: any) => {
              return (
                <BatchTransactionRecieverView
                  key={recipient.id}
                  amount={recipient.amount}
                  recieverAddress={recipient.recipient}
                  coin={coinAbbr}
                  icon={
                    <Icon
                      size={32}
                      viewBox="0 0 36 36"
                      iconGroup={
                        <g>
                          <circle
                            cx="17.8309"
                            cy="17.831"
                            r="15"
                            transform="rotate(-12.199 17.8309 17.831)"
                            fill="#403D3A"
                          />
                          <path
                            d="M23.141 15.0528C23.0317 13.3532 21.586 12.7392 19.7445 12.5191L19.8184 10.1683L18.3881 10.124L18.3157 12.4128C17.9398 12.4004 17.5558 12.3963 17.1725 12.392L17.2458 10.0881L15.8154 10.043L15.7414 12.393C15.4315 12.3893 15.1266 12.3862 14.8302 12.3763L14.8302 12.3689L12.8567 12.3064L12.8089 13.8344C12.8089 13.8344 13.8665 13.8474 13.8484 13.8662C14.4279 13.8847 14.6054 14.227 14.6514 14.5196L14.5677 17.1973C14.6074 17.1986 14.6592 17.2022 14.7188 17.2115L14.5674 17.2073L14.4494 20.9587C14.4178 21.1398 14.3016 21.4272 13.8962 21.4154C13.9145 21.4319 12.8565 21.3828 12.8565 21.3828L12.5185 23.0821L14.381 23.1406C14.7271 23.1521 15.0678 23.1689 15.4018 23.1814L15.3279 25.5585L16.7573 25.603L16.8312 23.2522C17.2235 23.2718 17.6032 23.2867 17.9741 23.2986L17.8998 25.6397L19.3301 25.684L19.405 23.3115C21.8152 23.2492 23.5175 22.6962 23.7976 20.4439C24.0238 18.6306 23.1937 17.7915 21.8385 17.421C22.6819 17.0249 23.2233 16.297 23.141 15.0528ZM20.9789 20.0732C20.9248 21.85 17.8884 21.552 16.9185 21.5224L17.0185 18.3726C17.9888 18.4037 21.038 18.2205 20.9789 20.0732ZM20.4535 15.6083C20.4026 17.225 17.8714 16.9558 17.0644 16.9305L17.154 14.0748C17.9611 14.1001 20.5066 13.9222 20.4535 15.6083Z"
                            fill="#DB953C"
                          />
                        </g>
                      }
                    />
                  }
                />
              );
            })}
            <div className={classes.transactionFeeDetails}>
              <LabelText
                label="Transaction Fee"
                text={`~ ${
                  sendTransaction.totalFees
                } ${coinDetails.slug.toUpperCase()} ~( $${
                  parseFloat(sendTransaction.totalFees) *
                  parseFloat(coinDetails.displayPrice)
                })`}
                verified={sendTransaction.verified}
              />
            </div>
          </>
        )}

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
