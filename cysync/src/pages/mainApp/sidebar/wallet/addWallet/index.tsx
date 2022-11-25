import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Routes from '../../../../../constants/routes';
import ErrorBox from '../../../../../designSystem/designComponents/dialog/errorDialog';
import { useAddWallet } from '../../../../../store/hooks/flows';
import { useConnection, useWallets } from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import AddWalletFlow from './addWalletFlow';

const PREFIX = 'AddWallet';

const classes = {
  root: `${PREFIX}-root`,
  content: `${PREFIX}-content`,
  button: `${PREFIX}-button`
};

const Root = styled(Grid)(() => ({
  [`&.${classes.root}`]: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column'
  },
  [`& .${classes.content}`]: {
    border: `2px dashed rgba(255,255,255,0.2)`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    minHeight: '10rem',
    width: '90%'
  },
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: '#FFFFFF',
    textTransform: 'none',
    padding: '0.4rem 3rem',
    margin: '1rem 0rem',
    border: `1px solid #71624C`,
    fontWeight: 700,
    '&:hover': {
      border: `1px solid #71624C`
    }
  }
}));

const AddWallet = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { allWallets, isLoading: isWalletLoading } = useWallets();

  const [disableImportWallet, setDisableImportWallet] = useState(false);

  useEffect(() => {
    setDisableImportWallet(allWallets.length >= 4);
  }, [allWallets]);

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.ADD_WALLET);
    logger.info('In add wallet screen');
  }, []);

  const {
    handleAddWallet,
    walletName,
    walletSuccess,
    errorObj,
    clearErrorObj,
    cancelAddWallet,
    completed,
    resetHooks,
    walletId,
    updateName,
    isConfigDiff
  } = useAddWallet();

  const [open, setOpen] = useState(false);

  const {
    deviceConnection,
    deviceSdkVersion,
    beforeFlowStart,
    beforeNetworkAction,
    setIsInFlow
  } = useConnection();

  const handleClose = (abort?: boolean, openAddCoinForm?: boolean) => {
    if (abort && deviceConnection) cancelAddWallet(deviceConnection);
    let stopClose = false;

    if (completed) {
      let isCompleted = false;
      if (openAddCoinForm) {
        if (beforeNetworkAction()) {
          isCompleted = true;
          navigate(`${Routes.wallet.index}/${walletId}?openAddCoinForm=true`);
        } else {
          stopClose = true;
        }
      } else {
        isCompleted = true;
        navigate(`${Routes.wallet.index}/${walletId}`);
      }

      if (isCompleted) {
        clearErrorObj();
        Analytics.Instance.event(
          Analytics.Categories.ADD_WALLET,
          Analytics.Actions.COMPLETED
        );
      }
    }

    if (!stopClose) {
      Analytics.Instance.event(
        Analytics.Categories.ADD_WALLET,
        Analytics.Actions.CLOSED
      );
      logger.info('Add wallet form closed');
      resetHooks();
      setOpen(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    Analytics.Instance.event(
      Analytics.Categories.ADD_WALLET,
      Analytics.Actions.OPEN
    );
    logger.info('Add wallet form opened');
    try {
      if (!beforeFlowStart() || !deviceConnection) {
        handleClose();
        return;
      }

      await handleAddWallet({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow
      });
    } catch (e) {
      logger.error(e);
    }
  };

  const handleErrorBoxClose = () => {
    handleClose();
    clearErrorObj();
    resetHooks();
  };

  const onUpdateName = async () => {
    await updateName();
  };

  const handleRetry = async () => {
    handleClose();
    clearErrorObj();
    resetHooks();

    navigate(Routes.wallet.index + '?openImportWalletForm=true');
  };

  const openImportWalletForm = searchParams.get('openImportWalletForm');

  useEffect(() => {
    if (openImportWalletForm === 'true' && !isWalletLoading) {
      if (allWallets.length < 4) {
        handleOpen();
      }
      setSearchParams({});
    }
  }, [openImportWalletForm, isWalletLoading]);

  return (
    <Root container className={classes.root}>
      <ErrorBox
        open={errorObj.isSet}
        actionText={isConfigDiff ? 'Yes' : 'Retry'}
        handleAction={isConfigDiff ? onUpdateName : handleRetry}
        handleClose={handleErrorBoxClose}
        text={errorObj.showError()}
        errorObj={errorObj}
        flow="Adding Wallet"
      />
      <AddWalletFlow
        open={open}
        handleClose={handleClose}
        walletName={walletName}
        walletSuccess={walletSuccess}
      />
      <div className={classes.content}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          You can import 4 wallet accounts on cySync from X1 wallet
        </Typography>
        <Button
          color="secondary"
          className={classes.button}
          onClick={handleOpen}
          disabled={disableImportWallet}
        >
          Import Wallet
        </Button>
      </div>
    </Root>
  );
};

export default AddWallet;
