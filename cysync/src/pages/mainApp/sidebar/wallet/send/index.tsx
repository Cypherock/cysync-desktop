import React, { useEffect } from 'react';

import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import ErrorDialog from '../../../../../designSystem/designComponents/dialog/errorDialog';
import {
  useConnection,
  useCurrentCoin,
  useSendTransactionContext,
  useTokenContext
} from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import Confirmation from './formStepComponents/Confirmation';
import Device from './formStepComponents/Device';
import Recipient from './formStepComponents/Recipient';
import Summary from './formStepComponents/Summary';
import Verify from './formStepComponents/Verify';
import StepperForm from './stepperForm';

const SenderData = [
  ['Recipient', Recipient],
  ['Verify', Verify],
  ['Device', Device],
  ['Summary', Summary],
  ['Confirmation', Confirmation]
];

const WalletSend = () => {
  const { sendForm, setSendForm, sendTransaction } =
    useSendTransactionContext();

  const { deviceConnection } = useConnection();

  const { coinDetails } = useCurrentCoin();
  const { token } = useTokenContext();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  useEffect(() => {
    if (sendForm) {
      Analytics.Instance.event(Analytics.EVENTS.WALLET.SEND.OPEN, {
        coinAbbr,
        token: token?.slug,
        coinDetails: coinDetails?.slug
      });
      logger.info('Send Txn form open');
    }
  }, [sendForm]);

  const handleSendFormClose = (abort?: boolean) => {
    if (abort) {
      sendTransaction.cancelSendTxn(deviceConnection);
    }
    Analytics.Instance.event(Analytics.EVENTS.WALLET.SEND.CLOSED, {
      coinAbbr,
      token: token?.slug,
      coinDetails: coinDetails?.slug
    });
    logger.info('Send Txn form closed');
    sendTransaction.resetHooks();
    setSendForm(false);
  };

  return (
    <>
      {sendTransaction.errorObj.isSet && (
        <ErrorDialog
          open={sendTransaction.errorObj.isSet && sendForm}
          handleClose={() => handleSendFormClose(true)}
          errorObj={sendTransaction.errorObj}
          flow="Sending Transaction"
        />
      )}
      <DialogBox
        fullWidth
        maxWidth="md"
        open={sendForm}
        handleClose={() => handleSendFormClose(true)}
        disableBackdropClick
        isClosePresent
        dialogHeading="Send"
        restComponents={
          <StepperForm
            stepsData={SenderData}
            handleClose={handleSendFormClose}
          />
        }
      />
    </>
  );
};

export default WalletSend;
