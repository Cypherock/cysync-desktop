import React from 'react';

import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import {
  useWalletConnect,
  WalletConnectCallRequestMethod,
  WalletConnectCallRequestMethodMap,
  WalletConnectConnectionState
} from '../../../../../store/provider';

import Confirmation from './confirmation';
import Device from './device';
import StepperForm from './stepperForm';

const SignComponents = [
  ['Summary', Confirmation],
  ['Device', Device]
];

const WalletConnectSign = () => {
  const walletConnect = useWalletConnect();

  const isOpen = !!(
    walletConnect.connectionState === WalletConnectConnectionState.CONNECTED &&
    walletConnect.callRequestId &&
    (
      [
        WalletConnectCallRequestMethodMap.SIGN_PERSONAL,
        WalletConnectCallRequestMethodMap.ETH_SIGN
      ] as WalletConnectCallRequestMethod[]
    ).includes(walletConnect.callRequestMethod)
  );

  return (
    <DialogBox
      fullWidth
      maxWidth="sm"
      open={isOpen}
      handleClose={walletConnect.rejectCallRequest}
      disableBackdropClick
      isClosePresent
      dialogHeading="Sign Message"
      restComponents={
        <StepperForm
          stepsData={SignComponents}
          handleClose={walletConnect.rejectCallRequest}
        />
      }
    />
  );
};

export default WalletConnectSign;
