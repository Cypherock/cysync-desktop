import { Button, Typography } from '@material-ui/core';
import { makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import LoadingIcon from '@material-ui/icons/Loop';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import SettingsEthernetIcon from '@material-ui/icons/SettingsEthernet';
import WarningIcon from '@material-ui/icons/Warning';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import CustomIconButton from '../../designSystem/designComponents/buttons/customIconButton';
import Icon from '../../designSystem/designComponents/icons/Icon';
import CySync from '../../designSystem/iconGroups/cySync';
import { useConnection, useLockscreen, useSync } from '../../store/provider';
import Analytics from '../../utils/analytics';
import logger from '../../utils/logger';

import NotificationComponent from './notification';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    borderBottom: `0.1px solid ${theme.palette.primary.light}`,
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%'
  },
  leftContent: {
    padding: `0px 50px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  rightContent: {
    padding: `0px 50px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    marginLeft: 10
  },
  divider: {
    background: theme.palette.text.secondary,
    height: '50%',
    margin: '0px 10px'
  },
  clearFix: {
    margin: `0px !important`,
    padding: `0px !important`
  },
  connectedStatus: {
    textTransform: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '1rem'
  },
  loaderIcon: {
    animation: `$rotate 1500ms ${theme.transitions.easing.easeInOut}`,
    animationIterationCount: 'infinite'
  },
  '@keyframes rotate': {
    '0%': {
      transform: 'rotateZ(0deg)'
    },
    '100%': {
      transform: 'rotateZ(360deg)'
    }
  }
}));

interface NavbarProps {
  handleLock: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ handleLock }) => {
  const classes = useStyles();
  const theme = useTheme();
  const { isSyncing, isWaitingForConnection, reSync } = useSync();
  const { isPasswordSet } = useLockscreen();
  const [resyncAvailable, setResyncAvailable] = useState(isSyncing);

  /*
   * 0: Not connected
   * 1: Connecting
   * 2: Connected
   * 3: Updating
   * 4: Device Not Ready
   * 5: In partial update state
   * 6: Is new device
   * 7: Last auth failed
   * 8: Unknown error
   */
  const [connectedState, setConnectedState] = useState<
    0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  >(0);
  const {
    verifyState,
    inBackgroundProcess,
    setOpenVerifyPrompt,
    isDeviceUpdating,
    isDeviceNotReadyCheck
  } = useConnection();

  useEffect(() => {
    if (isDeviceNotReadyCheck) {
      setConnectedState(4);
    } else if (inBackgroundProcess) {
      setConnectedState(1);
    } else if (isDeviceUpdating) {
      setConnectedState(3);
    } else if (verifyState === -1) {
      setConnectedState(0);
    } else if (verifyState === 0) {
      setConnectedState(2);
    } else if (verifyState === 6) {
      setConnectedState(4);
    } else if (verifyState === 3) {
      setConnectedState(5);
    } else if (verifyState === 4) {
      setConnectedState(6);
    } else if (verifyState === 5) {
      setConnectedState(7);
    } else {
      setConnectedState(8);
    }
  }, [verifyState, inBackgroundProcess]);

  const getDeviceConnectedIcon = () => {
    switch (connectedState) {
      case 0:
        return (
          <NotInterestedIcon
            style={{ color: theme.palette.text.secondary, fontSize: '1rem' }}
          />
        );
      case 1:
        return (
          <LoadingIcon
            className={classes.loaderIcon}
            style={{ color: theme.palette.secondary.dark, fontSize: '1.2rem' }}
          />
        );
      case 2:
      case 3:
        return (
          <SettingsEthernetIcon
            style={{ color: theme.palette.secondary.dark, fontSize: '1.2rem' }}
          />
        );
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      default:
        return (
          <WarningIcon
            style={{ color: theme.palette.error.dark, fontSize: '1.2rem' }}
          />
        );
    }
  };

  const getDeviceConnectedText = () => {
    switch (connectedState) {
      case 0:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            color="textSecondary"
            style={{ marginLeft: '0.5rem' }}
          >
            Device Disconnected
          </Typography>
        );
      case 1:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            color="secondary"
            style={{ marginLeft: '0.5rem' }}
          >
            Device Connecting
          </Typography>
        );
      case 2:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            color="secondary"
            style={{ marginLeft: '0.5rem' }}
          >
            Device Connected
          </Typography>
        );
      case 3:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            color="secondary"
            style={{ marginLeft: '0.5rem' }}
          >
            Device Updating
          </Typography>
        );
      case 4:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            style={{
              marginLeft: '0.5rem',
              color: theme.palette.error.dark
            }}
          >
            Device Not Ready
          </Typography>
        );
      case 5:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            style={{
              marginLeft: '0.5rem',
              color: theme.palette.error.dark
            }}
          >
            Device Misconfigured
          </Typography>
        );
      case 6:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            style={{
              marginLeft: '0.5rem',
              color: theme.palette.error.dark
            }}
          >
            New Device
          </Typography>
        );
      case 7:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            style={{
              marginLeft: '0.5rem',
              color: theme.palette.error.dark
            }}
          >
            Previous Auth Failed on Device
          </Typography>
        );
      case 8:
      default:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            style={{
              marginLeft: '0.5rem',
              color: theme.palette.error.dark
            }}
          >
            Device Connection Error
          </Typography>
        );
    }
  };

  const getDeviceConnectedTooltip = () => {
    switch (connectedState) {
      case 0:
        return 'Device is not connected.';
      case 1:
        return 'CySync is establishing connection with the device.';
      case 2:
        return 'The device is connected.';
      case 3:
        return 'The device is being updated.';
      case 4:
        return 'The device is not in the main menu.';
      case 5:
        return 'The device is misconfigured.';
      case 6:
        return 'A new device has been connected to the CySync app.';
      case 7:
        return 'Device authentication failed the last time.';
      case 8:
      default:
        return 'An unknown error occurred while connecting the device';
    }
  };

  const handleResync = () => {
    reSync();
    setResyncAvailable(false);
  };

  // Resync Button enabled after 15 minutes of last sync
  let interval: NodeJS.Timeout | undefined;
  useEffect(() => {
    if (!isSyncing && !resyncAvailable) {
      interval = setTimeout(() => {
        setResyncAvailable(true);
      }, 1000 * 60 * 15);
    }
    return () => {
      if (interval) {
        clearTimeout(interval);
        interval = undefined;
      }
    };
  }, [isSyncing, resyncAvailable]);

  const getSyncIcon = () => {
    if (isSyncing && !isWaitingForConnection) {
      return (
        <LoadingIcon
          className={classes.loaderIcon}
          style={{ color: theme.palette.secondary.dark, fontSize: '1.2rem' }}
        />
      );
    }

    if (isSyncing && isWaitingForConnection) {
      return (
        <WarningIcon
          style={{ color: theme.palette.error.dark, fontSize: '1.2rem' }}
        />
      );
    }

    if (!isSyncing && resyncAvailable) {
      return <></>;
    }

    return (
      <LoadingIcon
        style={{
          color: theme.palette.secondary.dark,
          fontSize: '1.2rem',
          marginRight: '0.5rem'
        }}
      />
    );
  };

  const getSyncText = () => {
    if (isSyncing && !isWaitingForConnection) {
      return (
        <Typography
          variant="body2"
          className={classes.text}
          color="secondary"
          style={{ marginLeft: '0.5rem' }}
        >
          Syncing
        </Typography>
      );
    }

    if (isSyncing && isWaitingForConnection) {
      return (
        <Typography
          variant="body2"
          className={classes.text}
          style={{
            marginLeft: '0.5rem',
            color: theme.palette.error.dark
          }}
        >
          Waiting for Internet
        </Typography>
      );
    }

    if (!isSyncing && resyncAvailable) {
      return (
        <Button
          className={classes.text}
          color="secondary"
          style={{ textTransform: 'none' }}
          onClick={handleResync}
        >
          <LoadingIcon
            style={{
              color: theme.palette.secondary.dark,
              fontSize: '1.2rem',
              marginRight: '0.5rem'
            }}
          />
          Resync
        </Button>
      );
    }

    return (
      <Typography
        variant="body2"
        className={classes.text}
        color="secondary"
        style={{ marginLeft: '0.5rem' }}
      >
        Synced
      </Typography>
    );
  };

  const getSyncToolTip = () => {
    if (isSyncing && !isWaitingForConnection) {
      return 'CySync app is syncing with the blockchain.';
    }

    if (isSyncing && isWaitingForConnection) {
      return 'CySync app is waiting for a working internet connection.';
    }

    if (!isSyncing && resyncAvailable) {
      return 'CySync app is fully synced with the blockchain. However you may sync it again.';
    }

    return 'CySync app is synced with the blockchain.';
  };

  return (
    <div className={classes.root}>
      <div className={classes.leftContent}>
        <Icon
          size={74}
          height={34}
          viewBox="0 0 74 23"
          iconGroup={<CySync color={theme.palette.text.primary} />}
        />
      </div>
      <div className={classes.rightContent}>
        <Tooltip title={getSyncToolTip()}>
          <div className={classes.connectedStatus}>
            {getSyncIcon()}
            {getSyncText()}
          </div>
        </Tooltip>

        {[4, 5, 6, 7, 8].includes(connectedState) ? (
          <Tooltip title={getDeviceConnectedTooltip()}>
            <Button
              onClick={() => {
                logger.info('Device update prompt opened from navbar.');
                Analytics.Instance.event(
                  Analytics.Categories.NAVBAR_DEVICE_CONNECTED,
                  Analytics.Actions.CLICKED
                );
                setOpenVerifyPrompt(true);
              }}
              className={classes.connectedStatus}
            >
              {getDeviceConnectedIcon()}
              {getDeviceConnectedText()}
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title={getDeviceConnectedTooltip()}>
            <div className={classes.connectedStatus}>
              {getDeviceConnectedIcon()}
              {getDeviceConnectedText()}
            </div>
          </Tooltip>
        )}

        <NotificationComponent />
        {isPasswordSet && (
          <CustomIconButton onClick={handleLock} title="Lock App">
            <LockOpenIcon style={{ color: theme.palette.secondary.dark }} />
          </CustomIconButton>
        )}
      </div>
    </div>
  );
};

Navbar.propTypes = {
  handleLock: PropTypes.func.isRequired
};

export default Navbar;
