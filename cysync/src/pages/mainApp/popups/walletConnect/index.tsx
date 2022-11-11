import React from 'react';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';
import {
  useWalletConnect,
  WalletConnectConnectionState
} from '../../../../store/provider';
{
  /* import Analytics from '../../../../utils/analytics'; */
}
{
  /* import logger from '../../../../utils/logger'; */
}

import UrlFormComponent from './urlForm';
import AccountSelection from './accountSelection';

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
};

export default WalletConnectPopup;
