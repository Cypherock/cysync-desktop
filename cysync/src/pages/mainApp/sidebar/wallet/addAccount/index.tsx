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
  ['Add Account', Recipient],
  ['Verify', Verify],
  ['Device', Device],
  ['Summary', Summary],
  ['Confirmation', Confirmation]
];

const WalletAddAccount = () => {
  const {
    sendForm: addAccountForm,
    setSendForm: setAddAccountForm,
    sendTransaction
  } = useSendTransactionContext();

  const { deviceConnection } = useConnection();

  const { coinDetails } = useCurrentCoin();
  const { token } = useTokenContext();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  useEffect(() => {
    if (addAccountForm) {
      Analytics.Instance.event(
        Analytics.Categories.SEND_TXN,
        Analytics.Actions.OPEN,
        coinAbbr
      );
      logger.info('Add Account form open');
    }
  }, [addAccountForm]);

  const handleAddAccountFormClose = (abort?: boolean) => {
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
    setAddAccountForm(false);
  };

  useEffect(() => {
    if (addAccountForm) {
      Analytics.Instance.event(
        Analytics.Categories.SEND_TXN,
        Analytics.Actions.OPEN,
        coinAbbr
      );
      logger.info('Add Account form open');
    }
  }, [addAccountForm]);

  return (
    <>
      {sendTransaction.errorObj.isSet && (
        <ErrorDialog
          open={sendTransaction.errorObj.isSet}
          handleClose={() => handleAddAccountFormClose(true)}
          errorObj={sendTransaction.errorObj}
          flow="Adding Account"
        />
      )}
      <DialogBox
        fullWidth
        maxWidth="md"
        open={addAccountForm}
        handleClose={() => handleAddAccountFormClose(true)}
        disableBackdropClick
        isClosePresent
        dialogHeading="Add Account"
        restComponents={
          <StepperForm
            stepsData={SenderData}
            handleClose={handleAddAccountFormClose}
          />
        }
      />
    </>
  );
};

export default WalletAddAccount;
