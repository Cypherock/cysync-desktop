import React, { useEffect, useState } from 'react';

import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import {
  useAddCoinContext,
  useCoinSpecificDataContext,
  useConnection
} from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import Device from './formStepComponents/Device';
import Recieve from './formStepComponents/Recieve';
import Verification from './formStepComponents/Verification';
import StepperForm from './StepperForm';

const ReceiveFormComponents = [
  ['Device', Device],
  ['Verification', Verification],
  ['Receive', Recieve]
];

const WalletStoreCoinSpecificData = () => {
  const { coinSpecificDataForm, setCoinSpecificDataForm, coinSpecificData } =
    useCoinSpecificDataContext();
  const { setAddCoinFormOpen, setActiveStep, setXpubMissing } =
    useAddCoinContext();

  const { deviceConnection } = useConnection();

  const [isDeviceFlow, setDeviceFlow] = useState(!!deviceConnection);

  useEffect(() => {
    if (coinSpecificDataForm) {
      setDeviceFlow(!!deviceConnection);
      Analytics.Instance.event(
        Analytics.Categories.RECEIVE_ADDR,
        Analytics.Actions.OPEN
      );
      logger.info('Receive address form opened');
    }
  }, [coinSpecificDataForm]);

  const handleClose = (abort?: boolean) => {
    if (abort && deviceConnection)
      coinSpecificData.cancelReceiveTxn(deviceConnection);
    Analytics.Instance.event(
      Analytics.Categories.RECEIVE_ADDR,
      Analytics.Actions.CLOSED
    );
    logger.info('Receive address form closed');
    coinSpecificData.resetHooks();
    coinSpecificData.setXpubMissing(false);
    setCoinSpecificDataForm(false);
  };

  const handleXpubMissing = () => {
    setActiveStep(0);
    setXpubMissing(true);
    setAddCoinFormOpen(true);
  };

  if (isDeviceFlow)
    return (
      <DialogBox
        fullWidth
        maxWidth="md"
        open={coinSpecificDataForm}
        isClosePresent
        handleClose={handleClose}
        dialogHeading="Receive"
        disableBackdropClick
        restComponents={
          <StepperForm
            stepsData={ReceiveFormComponents}
            handleClose={handleClose}
            handleXpubMissing={handleXpubMissing}
          />
        }
      />
    );

  return (
    <DialogBox
      fullWidth
      maxWidth="md"
      open={coinSpecificDataForm}
      disableBackdropClick
      isClosePresent
      handleClose={handleClose}
      dialogHeading="Receive"
      restComponents={
        <Recieve handleClose={handleClose} handleNext={handleClose} />
      }
    />
  );
};

export default WalletStoreCoinSpecificData;
