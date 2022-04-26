import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';

import AddTokenForm from './addTokenForm';

export interface AddTokenProps {
  openAddToken: boolean;
  tokenList: string[];
  ethCoin: string;
  handleClose: () => void;
}

const AddToken: React.FC<AddTokenProps> = ({
  openAddToken,
  tokenList,
  handleClose,
  ethCoin
}) => {
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
};

AddToken.propTypes = {
  openAddToken: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  tokenList: PropTypes.array.isRequired,
  ethCoin: PropTypes.string.isRequired
};

export default AddToken;
