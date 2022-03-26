import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import { useAddCoinContext } from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import CoinAddForm from './addCoinForm';
import SelectCoin from './formStepComponents/selectCoin';
import SelectWallet from './formStepComponents/selectWallet';
import Syncing from './formStepComponents/syncing';
import Verify from './formStepComponents/verify';

const addCoinWalletData = [
  ['Select Coins', SelectCoin],
  ['Verify Coins', SelectWallet],
  ['Tap CyCards', Verify],
  ['Fetch Balance', Syncing]
];

interface AddCoinProps {
  handleClose: (abort?: boolean) => void;
  coinsPresent: any[];
}

const Index: React.FC<AddCoinProps> = ({ handleClose, coinsPresent }) => {
  const {
    addCoinFormOpen,
    coinAdder,
    isXpubMissing,
    isAddCoinLoading,
    setIsAddCoinLoading
  } = useAddCoinContext();

  useEffect(() => {
    if (addCoinFormOpen) {
      setIsAddCoinLoading(false);
      Analytics.Instance.event(
        Analytics.Categories.ADD_COIN,
        Analytics.Actions.OPEN
      );
      logger.info('Add coin form opened');
    }
  }, [addCoinFormOpen]);

  useEffect(() => {
    if (coinAdder.addCoinCompleted) {
      setIsAddCoinLoading(false);
    }
  }, [coinAdder.addCoinCompleted]);

  useEffect(() => {
    if (coinAdder.cardTap) {
      setIsAddCoinLoading(true);
    }
  }, [coinAdder.cardTap]);

  return (
    <DialogBox
      fullWidth
      maxWidth="sm"
      open={addCoinFormOpen}
      handleClose={() => handleClose(true)}
      dialogHeading={isXpubMissing ? 'Configure Wallet' : 'Add Coin'}
      disableBackdropClick
      disableEscapeKeyDown={isAddCoinLoading}
      isClosePresent={!isAddCoinLoading}
      restComponents={
        <CoinAddForm
          stepsData={addCoinWalletData}
          handleClose={handleClose}
          coinsPresent={coinsPresent}
        />
      }
    />
  );
};

Index.propTypes = {
  handleClose: PropTypes.func.isRequired,
  coinsPresent: PropTypes.arrayOf(PropTypes.any).isRequired
};

export default Index;
