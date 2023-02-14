import React from 'react';

import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import { useSignMessage } from '../../../../../store/hooks';
import {
  useConnection,
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
  const { deviceConnection } = useConnection();
  const signMessage = useSignMessage();

  const isOpen = !!(
    walletConnect.connectionState === WalletConnectConnectionState.CONNECTED &&
    walletConnect.callRequestData &&
    (
      [
        WalletConnectCallRequestMethodMap.SIGN_TYPED,
        WalletConnectCallRequestMethodMap.SIGN_PERSONAL,
        WalletConnectCallRequestMethodMap.ETH_SIGN
      ] as WalletConnectCallRequestMethod[]
    ).includes(walletConnect.callRequestData.method)
  );

  const handleClose = () => {
    walletConnect.rejectCallRequest();
    signMessage.cancelSignMessage(deviceConnection);
  };

  return (
    <DialogBox
      fullWidth
      maxWidth="sm"
      open={isOpen}
      handleClose={handleClose}
      disableBackdropClick
      isClosePresent
      dialogHeading="Sign Message"
      restComponents={
        <StepperForm
          stepsData={SignComponents}
          handleClose={handleClose}
          signMessage={signMessage}
        />
      }
    />
  );
};

export default WalletConnectSign;
