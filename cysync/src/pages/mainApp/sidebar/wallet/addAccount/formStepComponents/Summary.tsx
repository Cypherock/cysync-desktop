import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import ErrorDialog from '../../../../../../designSystem/designComponents/dialog/errorDialog';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Backdrop from '../../../../../../designSystem/genericComponents/Backdrop';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import { broadcastTxn } from '../../../../../../store/hooks/flows';
import {
  useCurrentCoin,
  useNetwork,
  useSelectedWallet,
  useSendTransactionContext,
  useSocket,
  useTokenContext
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
import formatDisplayAmount from '../../../../../../utils/formatDisplayAmount';
import logger from '../../../../../../utils/logger';
import LabelText from '../generalComponents/LabelText';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletAddAccountSummary';

const classes = {
  root: `${PREFIX}-root`,
  summaryDetails: `${PREFIX}-summaryDetails`,
  mainText: `${PREFIX}-mainText`,
  divider: `${PREFIX}-divider`,
  footer: `${PREFIX}-footer`,
  deviceContinueButton: `${PREFIX}-deviceContinueButton`,
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
  [`& .${classes.summaryDetails}`]: {
    width: '70%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '15rem'
  },
  [`& .${classes.mainText}`]: {
    fontSize: '1.2rem',
    color: theme.palette.primary.light,
    marginBottom: '0.5rem'
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
  [`& .${classes.deviceContinueButton}`]: {
    width: '10rem',
    height: '3rem',
    marginTop: 15,
    textTransform: 'none',
    color: '#fff'
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
}));

const Summary: React.FC<StepComponentProps> = ({
  handleNext,
  total,
  batchRecipientData,
  maxSend,
  handleClose,
  activeButton
}) => {
  const [broadcastError, setBroadcastError] = useState('');
  const [advanceError, setAdvanceError] = useState('');

  const { addTxnConfirmAddressHook } = useSocket();

  const { selectedWallet } = useSelectedWallet();

  const { coinDetails } = useCurrentCoin();

  const { token } = useTokenContext();

  const { connected } = useNetwork();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  const coinPrice = token ? token.displayPrice : coinDetails.displayPrice;

  const { sendTransaction } = useSendTransactionContext();

  const [open, setOpen] = useState(false);

  const handleSend = () => {
    setOpen(true);
    setBroadcastError('');
    setAdvanceError('');
    broadcastTxn(sendTransaction.signedTxn, coinDetails.slug)
      .then(res => {
        setOpen(false);
        sendTransaction.setHash(res);
        sendTransaction.onTxnBroadcast({
          walletId: selectedWallet._id,
          coin: coinDetails.slug,
          txHash: res,
          token: token ? token.coin : undefined
        });
        addTxnConfirmAddressHook(res, coinDetails.slug, selectedWallet._id);
        handleNext();
        Analytics.Instance.event(
          Analytics.Categories.SEND_TXN,
          Analytics.Actions.COMPLETED,
          coinAbbr
        );
        return null;
      })
      .catch(e => {
        setOpen(false);
        logger.error('Transaction broadcast error', e);
        if (e.isAxiosError) {
          if (e.response) {
            if (e.response.data && e.response.data.cysyncError) {
              setAdvanceError(e.response.data.cysyncError);
            }
            if (selectedWallet.passphraseSet) {
              setBroadcastError(
                'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet\nPlease try again in sometime.\nThis may be due to incorrect passphrase.'
              );
            } else {
              setBroadcastError(
                'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet\nPlease try again in sometime.'
              );
            }
          } else {
            setBroadcastError(
              'Failed to broadcast the transaction. Please check your internet connection and try again.'
            );
          }
        } else {
          setBroadcastError(
            'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet\nPlease try again in sometime.'
          );
        }
        Analytics.Instance.event(
          Analytics.Categories.SEND_TXN,
          Analytics.Actions.BROADCAST_ERROR,
          coinAbbr
        );
      });
  };

  const handleRetry = () => {
    Analytics.Instance.event(
      Analytics.Categories.SEND_TXN,
      Analytics.Actions.RETRY,
      coinAbbr
    );
    logger.info('Send transaction retry');
    handleSend();
  };

  return (
    <Root className={classes.root}>
      {broadcastError && (
        <ErrorDialog
          open={!!broadcastError}
          handleClose={() => handleClose(true)}
          actionText="Retry"
          handleAction={handleRetry}
          text={broadcastError}
          advanceText={advanceError}
          flow="Broadcasting Transaction"
        />
      )}
      <Backdrop open={open} />

      <div className={classes.summaryDetails}>
        <Typography
          color="textSecondary"
          variant="h5"
          style={{ marginBottom: '0.5rem' }}
        >
          Transaction ready to be broadcast. Confirm the details
        </Typography>
        {coinAbbr.toUpperCase() === 'ETHR' && (
          <Typography color="error" style={{ marginBottom: '0.5rem' }}>
            [ This is a Ropsten
            <strong>&nbsp;Testnet&nbsp;</strong>
            transaction only ]
          </Typography>
        )}
        {activeButton === 0 && (
          <LabelText
            label="Receiver's Address"
            text={batchRecipientData[0].recipient}
            verified
          />
        )}
        {activeButton === 0 && (
          <LabelText
            label={`Amount ${coinAbbr.toUpperCase()}`}
            text={
              !maxSend
                ? `${batchRecipientData[0].amount} ~( $${formatDisplayAmount(
                    parseFloat(batchRecipientData[0].amount || '0') *
                      parseFloat(coinPrice),
                    2,
                    true
                  )}) `
                : `${sendTransaction.sendMaxAmount} ~( $${formatDisplayAmount(
                    sendTransaction.sendMaxAmount * parseFloat(coinPrice),
                    2,
                    true
                  )}) `
            }
            verified
          />
        )}
        {activeButton !== 0 && (
          <LabelText
            label={`Amount ${coinAbbr.toUpperCase()}`}
            text={formatDisplayAmount(total, undefined, true)}
            verified
          />
        )}
        <LabelText
          label="Transaction Fees"
          text={`~ ${
            sendTransaction.totalFees
          } ${coinDetails.slug.toUpperCase()} ~( $${formatDisplayAmount(
            sendTransaction.totalFees * parseFloat(coinDetails.displayPrice),
            2,
            true
          )})`}
          verified
        />
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
      <div className={classes.divider} />
      <div className={classes.footer}>
        <CustomButton
          className={classes.deviceContinueButton}
          onClick={handleSend}
          disabled={!sendTransaction.signedTxn}
        >
          Send
        </CustomButton>
      </div>
    </Root>
  );
};

Summary.propTypes = StepComponentPropTypes;

export default Summary;
