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
  ['Custom Account', Recipient],
  ['Verify', Verify],
  ['Device', Device],
  ['Summary', Summary],
  ['Confirmation', Confirmation]
];

const WalletAddAccount = () => {
  const { sendForm, setSendForm, sendTransaction } =
    useSendTransactionContext();

  const { deviceConnection } = useConnection();

  const { coinDetails } = useCurrentCoin();
  const { token } = useTokenContext();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  useEffect(() => {
    if (sendForm) {
      Analytics.Instance.event(
        Analytics.Categories.SEND_TXN,
        Analytics.Actions.OPEN,
        coinAbbr
      );
      logger.info('Add Account form open');
    }
  }, [sendForm]);

  const handleSendFormClose = (abort?: boolean) => {
    if (abort) {
      sendTransaction.cancelSendTxn(deviceConnection);
    }
    Analytics.Instance.event(
      Analytics.Categories.SEND_TXN,
      Analytics.Actions.CLOSED,
      coinAbbr
    );
    logger.info('Add Account form closed');
    sendTransaction.resetHooks();
    setSendForm(false);
  };

  useEffect(() => {
    if (sendTransaction.errorMessage) {
      Analytics.Instance.event(
        Analytics.Categories.SEND_TXN,
        Analytics.Actions.ERROR,
        coinAbbr
      );
    }
  }, [sendTransaction.errorMessage]);

  return (
    <>
      {sendTransaction.errorMessage && (
        <ErrorDialog
          open={!!sendTransaction.errorMessage}
          handleClose={() => handleSendFormClose(true)}
          text={sendTransaction.errorMessage}
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
        dialogHeading="Add Account"
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

export default WalletAddAccount;
