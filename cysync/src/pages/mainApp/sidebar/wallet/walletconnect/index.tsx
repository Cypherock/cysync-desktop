import React from 'react';

import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import { useWalletConnect } from '../../../../../store/provider';

const WalletConnect = () => {
  const { isOpen, closeDialogBox } = useWalletConnect();

  return (
    <DialogBox
      fullWidth
      maxWidth="md"
      open={isOpen}
      disableBackdropClick
      isClosePresent
      handleClose={closeDialogBox}
      dialogHeading="Wallet Connect"
      restComponents={<h1>test walletconnect</h1>}
    />
  );
};

export default WalletConnect;
