import { COINS, NearCoinData } from '@cypherock/communication';
import { CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import ErrorDialog from '../../../../../../designSystem/designComponents/dialog/errorDialog';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Backdrop from '../../../../../../designSystem/genericComponents/Backdrop';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  accountDb,
  CustomAccount,
  customAccountDb
} from '../../../../../../store/database';
import { broadcastTxn } from '../../../../../../store/hooks/flows';
import {
  useCurrentCoin,
  useNetwork,
  useSelectedWallet,
  useSendTransactionContext,
  useSync
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
import formatDisplayAmount from '../../../../../../utils/formatDisplayAmount';
import logger from '../../../../../../utils/logger';
import LabelText from '../../send/generalComponents/LabelText';

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
  [`& .${classes.deviceContinueButton}`]: {
    width: '10rem',
    height: '3rem',
    marginTop: 15,
    textTransform: 'none',
    color: '#fff'
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
  recipientData,
  creatorAccount,
  handleClose
}) => {
  const [broadcastError, setBroadcastError] = useState('');
  const [advanceError, setAdvanceError] = useState('');
  const [statusText, setStatusText] = useState(
    'Waiting for signature from X1 wallet'
  );

  const { selectedWallet } = useSelectedWallet();

  const { coinDetails } = useCurrentCoin();
  const coinNetwork = (COINS[coinDetails.coinId] as NearCoinData).network;
  const nearSuffix = coinNetwork === 'testnet' ? '.testnet' : '.near';

  const { connected } = useNetwork();

  const { sendTransaction } = useSendTransactionContext();

  const [open, setOpen] = useState(false);
  const { addBalanceSyncItemFromCoin } = useSync();

  const handleSend = () => {
    setOpen(true);
    setBroadcastError('');
    setAdvanceError('');
    broadcastTxn(sendTransaction.signedTxn, coinDetails.coinId)
      .then(res => {
        setOpen(false);
        sendTransaction.setHash(res);
        sendTransaction.onAddAccountTxnBroadcast({
          walletId: selectedWallet._id,
          coinId: coinDetails.coinId,
          accountId: coinDetails.accountId,
          txHash: res
        });
        (async () => {
          try {
            const coin = await accountDb.getOne({
              accountId: coinDetails.accountId
            });
            if (!coin) throw new Error('No coins found');
            const data: CustomAccount = {
              accountId: coinDetails.accountId,
              coinId: coinDetails.coinId,
              name: recipientData[0].recipient + nearSuffix,
              walletId: coinDetails.walletId,
              balance: '0'
            };
            await customAccountDb.insert(data);
            addBalanceSyncItemFromCoin(coin, {});
          } catch (error) {
            logger.error('Custom Account database update failed', error);
          }
        })();
        handleNext();
        Analytics.Instance.event(
          Analytics.Categories.SEND_TXN,
          Analytics.Actions.COMPLETED
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
                'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime.\nThis may be due to incorrect passphrase.'
              );
            } else {
              setBroadcastError(
                'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime.'
              );
            }
          } else {
            setBroadcastError(
              'Failed to broadcast the transaction. Check your internet connection and try again.'
            );
          }
        } else {
          setBroadcastError(
            'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime.'
          );
        }
        Analytics.Instance.event(
          Analytics.Categories.SEND_TXN,
          Analytics.Actions.BROADCAST_ERROR
        );
      });
  };

  const coinAbbr = COINS[coinDetails.coinId]?.abbr?.toUpperCase();

  const handleRetry = () => {
    Analytics.Instance.event(
      Analytics.Categories.SEND_TXN,
      Analytics.Actions.RETRY
    );
    logger.info('Send transaction retry');
    handleSend();
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
          The new account is successfully verified. Confirm the details
        </Typography>
        <LabelText label="Create From" text={creatorAccount} verified />
        <LabelText
          label="New Account Id"
          text={recipientData[0].recipient + nearSuffix}
          verified
        />
        <LabelText
          label="Amount"
          text={`~ ${0.1} ${coinAbbr} ( $${formatDisplayAmount(
            0.1 * parseFloat(coinDetails.displayPrice),
            2,
            true
          )})`}
          verified={sendTransaction.verified}
        />
        <LabelText
          label="Transaction Fee"
          text={`~ ${0.0012} ${coinAbbr} ~( $${formatDisplayAmount(
            0.0012 * parseFloat(coinDetails.displayPrice),
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
