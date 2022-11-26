import React from 'react';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';
import {
  useWalletConnect,
  WalletConnectConnectionState
} from '../../../../store/provider';

import AccountSelection from './accountSelection';
import ConnectedPopup from './connected';
import Sign from './sign';
import UrlFormComponent from './urlForm';

const WalletConnectPopup = () => {
  const { isOpen, handleClose, connectionState } = useWalletConnect();

  if (connectionState <= WalletConnectConnectionState.CONNECTING) {
    return (
      <DialogBox
        fullWidth
        maxWidth="sm"
        open={isOpen}
        handleClose={handleClose}
        isClosePresent
        dialogHeading="Wallet Connect"
        restComponents={<UrlFormComponent handleClose={handleClose} />}
      />
    );
  }

  if (connectionState === WalletConnectConnectionState.SELECT_ACCOUNT) {
    return (
      <DialogBox
        fullWidth
        maxWidth="sm"
        open={isOpen}
        handleClose={handleClose}
        isClosePresent
        dialogHeading="Wallet Connect"
        restComponents={<AccountSelection handleClose={handleClose} />}
      />
    );
  }

  if (connectionState === WalletConnectConnectionState.CONNECTED) {
    return (
      <>
        <Sign />
        <DialogBox
          fullWidth
          maxWidth="sm"
          open={isOpen}
          handleClose={handleClose}
          isClosePresent
          dialogHeading="Wallet Connect"
          restComponents={<ConnectedPopup handleClose={handleClose} />}
        />
      </>
    );
  }

  return <></>;
};

export default WalletConnectPopup;
