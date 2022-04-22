import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';

import AddTokenForm from './addTokenForm';

function AddToken({ openAddToken, tokenList, handleClose, ethCoin }: any) {
  return (
    <DialogBox
      fullWidth
      maxWidth="sm"
      open={openAddToken}
      handleClose={handleClose}
      dialogHeading="Add Token"
      disableBackdropClick
      isClosePresent
      restComponents={
        <AddTokenForm
          tokenList={tokenList}
          ethCoin={ethCoin}
          handleClose={handleClose}
        />
      }
    />
  );
}

AddToken.propTypes = {
  openAddToken: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  tokenList: PropTypes.array.isRequired,
  ethCoin: PropTypes.string.isRequired
};

export default AddToken;
