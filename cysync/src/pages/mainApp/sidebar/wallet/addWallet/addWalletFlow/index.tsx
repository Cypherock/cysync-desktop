import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../../../../designSystem/designComponents/dialog/dialogBox';

import AddWalletForm from './addWalletForm';

interface AddWalletFlowProps {
  open: boolean;
  handleClose: (
    abort?: boolean | undefined,
    openAddCoinForm?: boolean | undefined
  ) => void;
  walletName?: string;
  walletSuccess: boolean;
}

const AddWalletFlow: React.FC<AddWalletFlowProps> = ({
  open,
  handleClose,
  walletName,
  walletSuccess
}) => {
  return (
    <DialogBox
      fullWidth
      maxWidth="sm"
      open={open}
      handleClose={() => handleClose(true)}
      dialogHeading={walletSuccess ? 'Wallet added successfully' : 'Add wallet'}
      disableBackdropClick
      isClosePresent
      restComponents={
        <AddWalletForm
          handleClose={handleClose}
          walletName={walletName}
          walletSuccess={walletSuccess}
        />
      }
    />
  );
};

AddWalletFlow.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  walletName: PropTypes.string,
  walletSuccess: PropTypes.bool.isRequired
};

AddWalletFlow.defaultProps = {
  walletName: undefined
};

export default AddWalletFlow;
