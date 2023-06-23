import React from 'react';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';
import {
  useWalletConnect,
  WalletConnectConnectionState
} from '../../../../store/provider';

import AccountSelection from './accountSelection';
import ConnectedPopup from './connected';
import WalletConnectErrorDisplay from './errorDisplay';
import Send from './send';
import Sign from './sign';
import UrlFormComponent from './urlForm';

const WalletConnectPopup = () => {
  const { isOpen, handleClose, connectionState } = useWalletConnect();

  if (connectionState === WalletConnectConnectionState.SELECT_ACCOUNT) {
    return (
      <DialogBox
        fullWidth
        maxWidth="sm"
        open={isOpen}
        handleClose={handleClose}
        isClosePresent
        dialogHeading="WalletConnect"
        restComponents={<AccountSelection handleClose={handleClose} />}
      />
    );
  }

  if (connectionState === WalletConnectConnectionState.CONNECTED) {
    return (
      <>
        <Sign />
        <Send />
        <DialogBox
          fullWidth
          maxWidth="sm"
          open={isOpen}
          handleClose={handleClose}
          isClosePresent={false}
          dialogHeading="WalletConnect"
          disableBackdropClick={true}
          restComponents={<ConnectedPopup handleClose={handleClose} />}
        />
      </>
    );
  }

  if (connectionState === WalletConnectConnectionState.CONNECTION_ERROR) {
    return (
      <DialogBox
        fullWidth
        maxWidth="sm"
        open={isOpen}
        handleClose={handleClose}
        isClosePresent
        dialogHeading="WalletConnect"
        restComponents={<WalletConnectErrorDisplay handleClose={handleClose} />}
      />
    );
  }

  if (connectionState === WalletConnectConnectionState.CONNECTING || isOpen) {
    return (
      <DialogBox
        fullWidth
        maxWidth="sm"
        open={isOpen}
        handleClose={handleClose}
        isClosePresent
        dialogHeading="WalletConnect"
        restComponents={<UrlFormComponent handleClose={handleClose} />}
      />
    );
  }

  return <></>;
};

export default WalletConnectPopup;
