import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import Backdrop from '../../../../../../designSystem/genericComponents/Backdrop';
import {
  useConnection,
  useCurrentCoin,
  useReceiveTransactionContext,
  useSelectedWallet,
  useTokenContext
} from '../../../../../../store/provider';
import logger from '../../../../../../utils/logger';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: '3rem 10rem 6rem'
    },
    text: {}
  })
);

const Device: React.FC<StepComponentProps> = ({ handleClose, handleNext }) => {
  const { coinDetails } = useCurrentCoin();

  const { selectedWallet } = useSelectedWallet();

  const {
    deviceConnection,
    devicePacketVersion,
    deviceSdkVersion,
    beforeFlowStart,
    setIsInFlow
  } = useConnection();

  const { receiveTransaction } = useReceiveTransactionContext();

  const [open, setOpen] = useState(true);

  const { token } = useTokenContext();

  useEffect(() => {
    if (!beforeFlowStart() || !deviceConnection) {
      handleClose();
      return;
    }

    receiveTransaction
      .handleReceiveTransaction({
        connection: deviceConnection,
        packetVersion: devicePacketVersion,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: selectedWallet.walletId,
        coinType: coinDetails.coin,
        xpub: coinDetails.xpub,
        zpub: coinDetails.zpub,
        contractAbbr: token ? token.coin : undefined,
        passphraseExists: selectedWallet.passphraseSet
      })
      .then(() => {
        // empty
      })
      .catch(err => {
        logger.error('Error in receive transaction');
        logger.error(err);
      });
  }, []);

  useEffect(() => {
    if (receiveTransaction.cardTapped) {
      setTimeout(handleNext, 500);
    }
  }, [receiveTransaction.cardTapped]);

  useEffect(() => {
    if (receiveTransaction.pathSent) setOpen(false);
  }, [receiveTransaction.pathSent]);

  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Backdrop open={open} />
      <Typography className={classes.text} color="textSecondary">
        Follow the instructions on Device
      </Typography>
      <TextView
        completed={receiveTransaction.pathSent}
        inProgress={!receiveTransaction.pathSent}
        text="Fetching a new address from the wallet"
      />
      <TextView
        completed={receiveTransaction.coinsConfirmed}
        inProgress={
          receiveTransaction.pathSent && !receiveTransaction.coinsConfirmed
        }
        text="Verify the Coin on Device"
        stylex={{ marginTop: '0rem' }}
      />
      {selectedWallet.passphraseSet && (
        <TextView
          completed={receiveTransaction.passphraseEntered}
          inProgress={
            receiveTransaction.pathSent &&
            receiveTransaction.coinsConfirmed &&
            !receiveTransaction.passphraseEntered
          }
          text="Enter Passphrase"
          stylex={{ marginTop: '0rem' }}
        />
      )}
      {selectedWallet.passwordSet && (
        <TextView
          completed={receiveTransaction.cardTapped}
          inProgress={
            selectedWallet.passphraseSet
              ? receiveTransaction.pathSent &&
                receiveTransaction.coinsConfirmed &&
                receiveTransaction.passphraseEntered &&
                !receiveTransaction.cardTapped
              : receiveTransaction.pathSent &&
                receiveTransaction.coinsConfirmed &&
                !receiveTransaction.cardTapped
          }
          text="Enter the pin and tap any X1 Card"
          stylex={{ marginTop: '0rem' }}
        />
      )}
      {selectedWallet.passwordSet || (
        <TextView
          completed={receiveTransaction.cardTapped}
          inProgress={
            selectedWallet.passphraseSet
              ? receiveTransaction.pathSent &&
                receiveTransaction.coinsConfirmed &&
                receiveTransaction.passphraseEntered &&
                !receiveTransaction.cardTapped
              : receiveTransaction.pathSent &&
                receiveTransaction.coinsConfirmed &&
                !receiveTransaction.cardTapped
          }
          text="Tap any X1 Card"
          stylex={{ marginTop: '0rem' }}
        />
      )}
    </div>
  );
};

Device.propTypes = StepComponentPropTypes;

export default Device;
