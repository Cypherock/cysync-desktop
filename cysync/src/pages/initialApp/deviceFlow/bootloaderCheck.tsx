import { DeviceUpdater } from '@cypherock/protocols';
import { stmFirmware as firmwareServer } from '@cypherock/server-wrapper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AlertIcon from '@material-ui/icons/ReportProblemOutlined';
import Alert from '@material-ui/lab/Alert';
import { ipcRenderer } from 'electron';
import React, { useEffect } from 'react';

import success from '../../../assets/icons/generic/success.png';
import CustomButton from '../../../designSystem/designComponents/buttons/button';
import AvatarIcon from '../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../designSystem/iconGroups/errorExclamation';
import { useConnection } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    middle: {
      minHeight: '20rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    progress: {
      marginBottom: '3rem',
      color: theme.palette.text.secondary
    },
    success: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    },
    primaryColor: {
      color: theme.palette.secondary.dark
    }
  })
);

const BootloaderCheck = (props: any) => {
  const classes = useStyles();

  /**
   * Complete States:
   * -1: Error
   * 0: Downloading/Waiting for device confirmation
   * 1: Updating
   * 2: Completed successfully
   */
  const defaultErrorMsg = 'Some error occurred.';
  const [errorMsg, setErrorMessage] = React.useState('');
  const [isCompleted, setCompleted] = React.useState<-1 | 0 | 1 | 2>(0);
  const [updateDownloaded, setUpdateDownloaded] = React.useState(false);
  const [firmwarePath, setFirmwarePath] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [isInternetSlow, setIsInternetSlow] = React.useState(false);
  let internetSlowTimeout: NodeJS.Timeout | null = null;

  const refreshComponent = () => {
    setCompleted(0);
    setErrorMessage('');
    setUpdateDownloaded(false);
    setFirmwarePath('');
    setIsInternetSlow(false);
    if (internetSlowTimeout) {
      clearTimeout(internetSlowTimeout);
      internetSlowTimeout = null;
    }
    setRefresh(ref => ref + 1);
  };

  const {
    internalDeviceConnection: deviceConnection,
    devicePacketVersion,
    deviceSdkVersion,
    inBootloader,
    setIsDeviceUpdating
  } = useConnection();

  const deviceUpdater = new DeviceUpdater();

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.BOOTLOADER_CHECK,
      Analytics.Actions.OPEN
    );
    logger.info('BootloaderCheck: Opened');

    return () => {
      Analytics.Instance.event(
        Analytics.Categories.BOOTLOADER_CHECK,
        Analytics.Actions.CLOSED
      );
      logger.info('BootloaderCheck: Closed');
    };
  }, []);

  const onDownloadComplete = (_event: any, filePath: any) => {
    setFirmwarePath(filePath);
    setUpdateDownloaded(true);
    if (internetSlowTimeout !== null) {
      clearTimeout(internetSlowTimeout);
      internetSlowTimeout = null;
    }
  };

  const onDownloadError = (error: any) => {
    logger.error('Error in downloading firmware');
    logger.error(error);
    setErrorMessage('Error in downloading the firmware.');
    setCompleted(-1);
    setUpdateDownloaded(false);
  };

  useEffect(() => {
    const toReturn = () => {
      setIsDeviceUpdating(false);
    };

    if (!deviceConnection) {
      logger.info('Failed due to device not connected');
      setCompleted(-1);
      return toReturn;
    }

    if (!inBootloader) {
      logger.info('BootloaderCheck: Not in bootloader mode');
      props.handleNext();
      return toReturn;
    }

    Analytics.Instance.event(
      Analytics.Categories.BOOTLOADER_CHECK,
      Analytics.Actions.INITIATED
    );
    logger.info('BootloaderCheck: In bootloader mode, initiating flow');
    firmwareServer
      .getLatest()
      .then(response => {
        internetSlowTimeout = setTimeout(() => {
          logger.verbose('Setting internet Slow.');
          setIsInternetSlow(true);
        }, 5000);
        ipcRenderer.send('download', {
          url: response.data.firmware.downloadUrl,
          properties: {
            directory: `${process.env.userDataPath}`,
            filename: 'app_dfu_package.bin'
          }
        });
        return null;
      })
      .catch(e => {
        setErrorMessage('Error while downloading latest firmware');
        logger.error('Error in getting firmware version');
        logger.error(e);
        setCompleted(-1);
        setIsDeviceUpdating(false);
      });

    ipcRenderer.on('download complete', onDownloadComplete);
    ipcRenderer.on('download error', onDownloadError);

    return () => {
      setIsDeviceUpdating(false);
      ipcRenderer.removeListener('download complete', onDownloadComplete);
      ipcRenderer.removeListener('download error', onDownloadError);
    };
  }, [refresh]);

  useEffect(() => {
    if (updateDownloaded) {
      logger.info('Running device update');
      deviceUpdater
        .run({
          connection: deviceConnection,
          packetVersion: devicePacketVersion,
          sdkVersion: deviceSdkVersion,
          firmwareVersion: '',
          firmwarePath,
          inBootloaderMode: inBootloader
        })
        .catch(e => {
          logger.error('Error in upgrading', e);
        });
      setIsDeviceUpdating(true);
    }

    return () => {
      setIsDeviceUpdating(false);
    };
  }, [updateDownloaded]);

  deviceUpdater.on('updateConfirmed', (val: boolean) => {
    if (val) {
      logger.info('Device update confirmed');
      setCompleted(1);
    } else {
      logger.info('Device update rejected');
      setErrorMessage('Rejected from device.');
      setCompleted(-1);
    }
  });

  deviceUpdater.on('completed', () => {
    logger.info('Device Update completed');
    deviceUpdater.removeAllListeners();
    setCompleted(2);
    setTimeout(() => props.handlePrev(), 3000);
  });

  deviceUpdater.on('error', e => {
    logger.error('Error in device updater', e);
    setErrorMessage(defaultErrorMsg);
    setCompleted(-1);
    setIsDeviceUpdating(false);
    deviceUpdater.removeAllListeners();
  });

  deviceUpdater.on('failed', () => {
    logger.error('Failed after retying 5 times');
    setErrorMessage(defaultErrorMsg);
    setCompleted(-1);
    setIsDeviceUpdating(false);
    deviceUpdater.removeAllListeners();
  });

  useEffect(() => {
    if (isCompleted === -1) {
      Analytics.Instance.event(
        Analytics.Categories.BOOTLOADER_CHECK,
        Analytics.Actions.ERROR
      );
    } else if (isCompleted === 2) {
      Analytics.Instance.event(
        Analytics.Categories.BOOTLOADER_CHECK,
        Analytics.Actions.COMPLETED
      );
    }
  }, [isCompleted]);

  return (
    <Grid container>
      <Grid item xs={2} />
      <Grid item xs={8} className={classes.middle}>
        {isCompleted === 0 && updateDownloaded === false && (
          <>
            {isInternetSlow ? (
              <>
                <Alert severity="warning" variant="outlined">
                  Your Internet connection is slow
                </Alert>
                <br />
              </>
            ) : null}
            <CircularProgress className={classes.progress} size={70} />
            <Typography
              variant="h4"
              color="textPrimary"
              align="center"
              style={{ marginBottom: '1.5rem' }}
            >
              Please wait while we download the latest firmware
            </Typography>
            <Typography variant="body2" color="textPrimary" align="center">
              It might take a few seconds ...
            </Typography>
          </>
        )}
        {isCompleted === 2 && (
          <>
            <div className={classes.success}>
              <AvatarIcon alt="success" src={success} />
              <Typography color="secondary" variant="h5">
                Device configured Successfully
              </Typography>
            </div>
          </>
        )}
        {isCompleted === -1 && (
          <>
            <div className={classes.success}>
              <Icon
                viewBox="0 0 60 60"
                size={50}
                iconGroup={<ErrorExclamation />}
              />
              <Typography color="error" variant="h5">
                {errorMsg || defaultErrorMsg}
              </Typography>
            </div>
            <CustomButton
              onClick={refreshComponent}
              style={{ marginTop: '2rem' }}
            >
              Try Again
            </CustomButton>
          </>
        )}
        {isCompleted === 0 && updateDownloaded === true && (
          <>
            <CircularProgress className={classes.progress} size={70} />
            <Typography
              variant="h4"
              color="textPrimary"
              align="center"
              style={{ marginBottom: '1.5rem' }}
            >
              Please confirm the update on the device.
            </Typography>
            <div className={classes.center} style={{ margin: '15px 0' }}>
              <AlertIcon
                className={classes.primaryColor}
                style={{ marginRight: '5px' }}
              />
              <Typography variant="body2" color="textSecondary" align="center">
                Do not disconnect device while it is being updated. This may
                take a few minutes.
              </Typography>
            </div>
          </>
        )}
        {isCompleted === 1 && updateDownloaded === true && (
          <>
            <CircularProgress className={classes.progress} size={70} />
            <Typography
              variant="h4"
              color="textPrimary"
              align="center"
              style={{ marginBottom: '1.5rem' }}
            >
              Please wait while Cypherock X1 is being configured
            </Typography>
            <div className={classes.center} style={{ margin: '15px 0' }}>
              <AlertIcon
                className={classes.primaryColor}
                style={{ marginRight: '5px' }}
              />
              <Typography variant="body2" color="textSecondary" align="center">
                Do not disconnect device while it is being updated. This may
                take a few minutes.
              </Typography>
            </div>
          </>
        )}
      </Grid>
      <Grid item xs={2} />
    </Grid>
  );
};

export default BootloaderCheck;
