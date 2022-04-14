import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../../constants/routes';
import ErrorBox from '../../../../../designSystem/designComponents/dialog/errorDialog';
import { useAddWallet } from '../../../../../store/hooks/flows';
import { useConnection, useWallets } from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import AddWalletFlow from './addWalletFlow';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column'
    },
    content: {
      border: `2px dashed rgba(255,255,255,0.2)`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      minHeight: '10rem',
      width: '90%'
    },
    button: {
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
  })
);

const Index = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { allWallets } = useWallets();

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
    errorMessage,
    setErrorMessage,
    cancelAddWallet,
    completed,
    resetHooks,
    walletId,
    updateName,
    isNameDiff
  } = useAddWallet();

  const [open, setOpen] = useState(false);

  const { deviceConnection, deviceSdkVersion, beforeFlowStart, setIsInFlow } =
    useConnection();

  const handleClose = (abort?: boolean, openAddCoinForm?: boolean) => {
    if (abort && deviceConnection) cancelAddWallet(deviceConnection);
    if (completed) {
      setErrorMessage('');
      Analytics.Instance.event(
        Analytics.Categories.ADD_WALLET,
        Analytics.Actions.COMPLETED
      );
      if (openAddCoinForm) {
        navigate(`${Routes.wallet.index}/${walletId}?openAddCoinForm=true`);
      } else {
        navigate(`${Routes.wallet.index}/${walletId}`);
      }
    }

    Analytics.Instance.event(
      Analytics.Categories.ADD_WALLET,
      Analytics.Actions.CLOSED
    );
    logger.info('Add wallet form closed');
    resetHooks();
    setOpen(false);
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

  useEffect(() => {
    if (errorMessage) {
      Analytics.Instance.event(
        Analytics.Categories.ADD_WALLET,
        Analytics.Actions.ERROR
      );
    }
  }, [errorMessage]);

  const handleErrorBoxClose = () => {
    handleClose();
    setErrorMessage('');
    resetHooks();
  };

  const onUpdateName = async () => {
    await updateName();
  };

  return (
    <Grid container className={classes.root}>
      <ErrorBox
        open={!!errorMessage}
        actionText={isNameDiff ? 'Yes' : undefined}
        handleAction={isNameDiff ? onUpdateName : undefined}
        handleClose={handleErrorBoxClose}
        text={errorMessage}
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
          You can import 4 wallets on cySync from cypherock X1 device
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
    </Grid>
  );
};

export default Index;
