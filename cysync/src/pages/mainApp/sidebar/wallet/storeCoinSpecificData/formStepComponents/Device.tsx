import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import DropMenu from '../../../../../../designSystem/designComponents/menu/DropMenu';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import Backdrop from '../../../../../../designSystem/genericComponents/Backdrop';
import {
  useCoinSpecificDataContext,
  useConnection,
  useCurrentCoin,
  useCustomAccountContext,
  useSelectedWallet,
  useTokenContext
} from '../../../../../../store/provider';
import logger from '../../../../../../utils/logger';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const classes = {
  footer: `footer`,
  footerBtn: `footerBtn`
};

const Root = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  padding: '3rem 10rem 6rem',
  [`& .${classes.footer}`]: {
    display: 'flex',
    alignItems: 'flex-end',
    width: '100%',
    justifyContent: 'flex-end'
  },
  [`& .${classes.footerBtn}`]: {
    width: '10rem',
    height: '3rem',
    marginTop: 15,
    textTransform: 'none',
    color: '#fff'
  }
}));

const Device: React.FC<StepComponentProps> = ({ handleClose, handleNext }) => {
  const { coinDetails } = useCurrentCoin();
  const { customAccount } = useCustomAccountContext();

  const { selectedWallet } = useSelectedWallet();

  const { deviceConnection, deviceSdkVersion, beforeFlowStart, setIsInFlow } =
    useConnection();

  const { coinSpecificData } = useCoinSpecificDataContext();

  const [open, setOpen] = useState(true);

  const { token } = useTokenContext();

  const [removeAccountIndex, setRemoveAccountIndex] = React.useState(0);

  const handleRemoveAccountSelectionChange = (index: number) => {
    setRemoveAccountIndex(index);
  };

  useEffect(() => {
    if (!beforeFlowStart() || !deviceConnection) {
      handleClose();
      return;
    }

    coinSpecificData
      .handleCoinSpecificData({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: selectedWallet._id,
        coinType: coinDetails.slug,
        xpub: coinDetails.xpub,
        zpub: coinDetails.zpub,
        addData: customAccount?.name,
        contractAbbr: token ? token.slug : undefined,
        passphraseExists: selectedWallet.passphraseSet
      })
      .then(() => {
        // empty
      })
      .catch(err => {
        logger.error('Error in receive transaction');
        logger.error(err);
      });
  }, []);

  useEffect(() => {
    if (coinSpecificData.coinsConfirmed === true) {
      setTimeout(handleNext, 500);
    }
  }, [coinSpecificData.coinsConfirmed]);

  useEffect(() => {
    if (coinSpecificData.pathSent) setOpen(false);
  }, [coinSpecificData.pathSent]);

  return (
    <Root>
      <Backdrop open={open} />
      <Typography color="textSecondary">
        Follow the instructions on Device
      </Typography>
      <TextView
        completed={coinSpecificData.pathSent}
        inProgress={!coinSpecificData.pathSent}
        text="Fetching a new address from the wallet"
      />
      <TextView
        completed={coinSpecificData.coinsConfirmed}
        inProgress={
          coinSpecificData.pathSent && !coinSpecificData.coinsConfirmed
        }
        text="Verify the Coin on Device"
        stylex={{ marginTop: '0rem' }}
      />
      {coinSpecificData.pathSent && !coinSpecificData.coinsConfirmed && (
        <>
          <Typography color="textSecondary">Remove account</Typography>
          <DropMenu
            options={['test', 'test2', 'test3', 'test4']}
            index={removeAccountIndex}
            handleMenuItemSelectionChange={handleRemoveAccountSelectionChange}
          />
          <div className={classes.footer}>
            <CustomButton className={classes.footerBtn} onClick={handleNext}>
              Replace Account
            </CustomButton>
          </div>
        </>
      )}
    </Root>
  );
};

Device.propTypes = StepComponentPropTypes;

export default Device;
