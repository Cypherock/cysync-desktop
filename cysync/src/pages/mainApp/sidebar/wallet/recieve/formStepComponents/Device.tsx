import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import Backdrop from '../../../../../../designSystem/genericComponents/Backdrop';
import {
  useConnection,
  useCurrentCoin,
  useCustomAccountContext,
  useReceiveTransactionContext,
  useSelectedWallet,
  useTokenContext
} from '../../../../../../store/provider';
import logger from '../../../../../../utils/logger';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const Root = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  padding: '3rem 10rem 6rem'
}));

const Device: React.FC<StepComponentProps> = ({ handleClose, handleNext }) => {
  const { coinDetails } = useCurrentCoin();
  const { customAccount } = useCustomAccountContext();

  const { selectedWallet } = useSelectedWallet();

  const { deviceConnection, deviceSdkVersion, beforeFlowStart, setIsInFlow } =
    useConnection();

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
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: selectedWallet._id,
        coinType: coinDetails.slug,
        xpub: coinDetails.xpub,
        zpub: coinDetails.zpub,
        customAccount: customAccount?.name,
        contractAbbr: token ? token.slug : undefined,
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

  return (
    <Root>
      <Backdrop open={open} />
      <Typography color="textSecondary">
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
    </Root>
  );
};

Device.propTypes = StepComponentPropTypes;

export default Device;
