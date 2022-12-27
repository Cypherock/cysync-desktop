import { CoinGroup, COINS } from '@cypherock/communication';
import { CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import ErrorDialog from '../../../../../../designSystem/designComponents/dialog/errorDialog';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Backdrop from '../../../../../../designSystem/genericComponents/Backdrop';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import { CyError, CysyncError } from '../../../../../../errors';
import { accountDb } from '../../../../../../store/database';
import { broadcastTxn } from '../../../../../../store/hooks/flows';
import {
  useCurrentCoin,
  useNetwork,
  useSelectedWallet,
  useSendTransactionContext,
  useSync,
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

const PREFIX = 'WalletSendSummary';

const classes = {
  root: `${PREFIX}-root`,
  summaryDetails: `${PREFIX}-summaryDetails`,
  mainText: `${PREFIX}-mainText`,
  divider: `${PREFIX}-divider`,
  footer: `${PREFIX}-footer`,
  status: `${PREFIX}-status`,
  center: `${PREFIX}-center`,
  loading: `${PREFIX}-loading`
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
  [`& .${classes.status}`]: {
    marginTop: 15,
    color: theme.palette.text.secondary
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.loading}`]: {
    margin: '0 10px',
    position: 'absolute',
    right: '1rem'
  }
}));

const Summary: React.FC<StepComponentProps> = ({
  handleNext,
  resetFlow,
  total,
  batchRecipientData,
  maxSend,
  handleClose,
  activeButton
}) => {
  const [broadcastError, setBroadcastError] = useState('');
  const [advanceError, setAdvanceError] = useState('');
  const [statusText, setStatusText] = useState(
    'Waiting for signature from X1 wallet'
  );

  const { selectedWallet } = useSelectedWallet();

  const { coinDetails } = useCurrentCoin();
  const isNear = COINS[coinDetails.coinId].group === CoinGroup.Near;

  const { token } = useTokenContext();

  const { connected } = useNetwork();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  const coinPrice = token ? token.displayPrice : coinDetails.displayPrice;

  const { sendForm, sendTransaction } = useSendTransactionContext();

  const [open, setOpen] = useState(false);

  const { addCustomAccountSyncItemFromCoin } = useSync();

  const handleSend = async () => {
    setOpen(true);
    setBroadcastError('');
    setAdvanceError('');
    broadcastTxn(sendTransaction.signedTxn, coinDetails.coinId)
      .then(res => {
        setOpen(false);
        sendTransaction.setHash(res);
        sendTransaction.onTxnBroadcast({
          accountId: coinDetails.accountId,
          walletId: selectedWallet._id,
          coinId: token?.coinId || coinDetails.coinId,
          parentCoinId: coinDetails.coinId,
          txHash: res
        });
        if (isNear)
          (async () => {
            const coins = await accountDb.getAll({
              walletId: coinDetails.walletId,
              slug: coinDetails.slug
            });
            if (coins.length >= 1)
              addCustomAccountSyncItemFromCoin(coins[0], {});
          })();
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
        logger.error(
          `${CysyncError.SEND_TXN_BROADCAST_FAILED} Transaction broadcast error`,
          e
        );
        if (e.isAxiosError) {
          if (e.response) {
            if (e.response.data && e.response.data.cysyncError) {
              setAdvanceError(e.response.data.cysyncError);
            }
            if (selectedWallet.passphraseSet) {
              setBroadcastError(
                'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime\nThis may be due to incorrect passphrase'
              );
            } else {
              setBroadcastError(
                'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime'
              );
            }
          } else {
            setBroadcastError(
              'Failed to broadcast the transaction. Check your internet connection and try again'
            );
          }
        } else if (e.message) {
          setAdvanceError(e.message);
          setBroadcastError(
            'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime' +
              (selectedWallet.passphraseSet
                ? '\nThis may be due to incorrect passphrase'
                : '')
          );
        } else {
          setBroadcastError(
            'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime'
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
    resetFlow();
  };

  useEffect(() => {
    if (!connected) setStatusText('');
    else {
      if (sendTransaction.signedTxn) {
        setStatusText('Broadcasting transaction');
        handleSend();
      } else {
        setStatusText('Waiting for signature from X1 wallet');
      }
    }
  }, [connected, sendTransaction.signedTxn]);

  const cyError = new CyError(CysyncError.SEND_TXN_BROADCAST_FAILED);
  return (
    <Root className={classes.root}>
      {broadcastError && (
        <ErrorDialog
          open={!!broadcastError && sendForm}
          handleClose={() => handleClose(true)}
          actionText="Retry"
          handleAction={handleRetry}
          errorObj={cyError}
          overrideErrorObj={true}
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
        {activeButton === 0 && (
          <LabelText
            label="Recipient's Address"
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
                    parseFloat(sendTransaction.sendMaxAmount) *
                      parseFloat(coinPrice),
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
          label="Transaction Fee"
          text={`~ ${
            sendTransaction.totalFees
          } ${coinDetails.slug.toUpperCase()} ~( $${formatDisplayAmount(
            parseFloat(sendTransaction.totalFees) *
              parseFloat(coinDetails.displayPrice),
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
        <Typography className={classes.status}>{statusText}</Typography>
        {sendTransaction.signedTxn?.length > 0 || !connected || (
          <CircularProgress
            size={22}
            className={classes.loading}
            color="secondary"
          />
        )}
      </div>
    </Root>
  );
};

Summary.propTypes = StepComponentPropTypes;

export default Summary;
