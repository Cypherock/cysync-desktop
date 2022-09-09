import LoadingIcon from '@mui/icons-material/Loop';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import WarningIcon from '@mui/icons-material/Warning';
import { Button, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import PropTypes from 'prop-types';
import React from 'react';

import { DeviceConnectionState, useConnection } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

const PREFIX = 'DeviceConnectionStatus';

const classes = {
  text: `${PREFIX}-text`,
  connectedStatus: `${PREFIX}-connectedStatus`
};

const Root = styled(Tooltip)(() => ({
  [`& .${classes.text}`]: {
    marginLeft: 10
  },

  [`&.${classes.connectedStatus}`]: {
    textTransform: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '1rem'
  }
}));

export interface DeviceConnectionStatusProps {
  loaderIconClassName: string;
}

export enum ConnectionStatus {
  NOT_CONNECTED,
  CONNECTING,
  CONNECTED,
  UPDATING,
  DEVICE_NOT_READY,
  PARTIAL_STATE,
  NEW_DEVICE,
  LAST_AUTH_FAILED,
  IN_TEST_APP,
  IN_BOOTLOADER,
  UPDATE_REQUIRED,
  UNKNOWN_ERROR
}

const DeviceConnectionStatus: React.FC<DeviceConnectionStatusProps> = props => {
  const theme = useTheme();
  const {
    deviceConnectionState,
    inBackgroundProcess,
    setOpenMisconfiguredPrompt,
    isDeviceUpdating,
    isDeviceNotReadyCheck,
    blockNewConnection,
    isDeviceAvailable
  } = useConnection();

  const getConnectionState = (): ConnectionStatus => {
    if (isDeviceUpdating) {
      return ConnectionStatus.UPDATING;
    } else if (isDeviceNotReadyCheck) {
      return ConnectionStatus.DEVICE_NOT_READY;
    } else if (inBackgroundProcess) {
      return ConnectionStatus.CONNECTING;
    } else if (blockNewConnection) {
      if (isDeviceAvailable) {
        return ConnectionStatus.CONNECTED;
      } else {
        return ConnectionStatus.NOT_CONNECTED;
      }
    } else if (deviceConnectionState === DeviceConnectionState.NOT_CONNECTED) {
      return ConnectionStatus.NOT_CONNECTED;
    } else if (deviceConnectionState === DeviceConnectionState.VERIFIED) {
      return ConnectionStatus.CONNECTED;
    } else if (deviceConnectionState === DeviceConnectionState.IN_TEST_APP) {
      return ConnectionStatus.IN_TEST_APP;
    } else if (deviceConnectionState === DeviceConnectionState.IN_BOOTLOADER) {
      return ConnectionStatus.IN_BOOTLOADER;
    } else if (deviceConnectionState === DeviceConnectionState.PARTIAL_STATE) {
      return ConnectionStatus.PARTIAL_STATE;
    } else if (deviceConnectionState === DeviceConnectionState.NEW_DEVICE) {
      return ConnectionStatus.NEW_DEVICE;
    } else if (
      deviceConnectionState === DeviceConnectionState.LAST_AUTH_FAILED
    ) {
      return ConnectionStatus.LAST_AUTH_FAILED;
    } else if (
      deviceConnectionState === DeviceConnectionState.DEVICE_NOT_READY
    ) {
      return ConnectionStatus.DEVICE_NOT_READY;
    } else if (
      deviceConnectionState === DeviceConnectionState.UPDATE_REQUIRED
    ) {
      return ConnectionStatus.UPDATE_REQUIRED;
    } else {
      return ConnectionStatus.UNKNOWN_ERROR;
    }
  };

  const connectedState = React.useMemo(getConnectionState, [
    deviceConnectionState,
    inBackgroundProcess,
    isDeviceUpdating,
    isDeviceNotReadyCheck,
    isDeviceAvailable,
    blockNewConnection
  ]);

  const getDeviceConnectedIcon = () => {
    switch (connectedState) {
      case ConnectionStatus.NOT_CONNECTED:
        return (
          <NotInterestedIcon
            style={{ color: theme.palette.text.secondary, fontSize: '1rem' }}
          />
        );
      case ConnectionStatus.CONNECTING:
        return (
          <LoadingIcon
            className={props.loaderIconClassName}
            style={{ color: theme.palette.secondary.dark, fontSize: '1.2rem' }}
          />
        );
      case ConnectionStatus.CONNECTED:
      case ConnectionStatus.UPDATING:
        return (
          <SettingsEthernetIcon
            style={{ color: theme.palette.secondary.dark, fontSize: '1.2rem' }}
          />
        );
      case ConnectionStatus.DEVICE_NOT_READY:
      case ConnectionStatus.PARTIAL_STATE:
      case ConnectionStatus.NEW_DEVICE:
      case ConnectionStatus.LAST_AUTH_FAILED:
      case ConnectionStatus.IN_TEST_APP:
      case ConnectionStatus.IN_BOOTLOADER:
      case ConnectionStatus.UPDATE_REQUIRED:
      case ConnectionStatus.UNKNOWN_ERROR:
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
      case ConnectionStatus.NOT_CONNECTED:
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
      case ConnectionStatus.CONNECTING:
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
      case ConnectionStatus.CONNECTED:
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
      case ConnectionStatus.UPDATING:
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
      case ConnectionStatus.DEVICE_NOT_READY:
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
      case ConnectionStatus.PARTIAL_STATE:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            style={{
              marginLeft: '0.5rem',
              color: theme.palette.error.dark
            }}
          >
            Device Unauthenticated
          </Typography>
        );
      case ConnectionStatus.NEW_DEVICE:
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
      case ConnectionStatus.LAST_AUTH_FAILED:
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
      case ConnectionStatus.IN_TEST_APP:
      case ConnectionStatus.IN_BOOTLOADER:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            style={{
              marginLeft: '0.5rem',
              color: theme.palette.error.dark
            }}
          >
            Device not configured
          </Typography>
        );
      case ConnectionStatus.UPDATE_REQUIRED:
        return (
          <Typography
            variant="body2"
            className={classes.text}
            style={{
              marginLeft: '0.5rem',
              color: theme.palette.error.dark
            }}
          >
            Incompatible Device
          </Typography>
        );
      case ConnectionStatus.UNKNOWN_ERROR:
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
      case ConnectionStatus.NOT_CONNECTED:
        return 'Device is not connected.';
      case ConnectionStatus.CONNECTING:
        return 'CySync is establishing connection with the device.';
      case ConnectionStatus.CONNECTED:
        return 'The device is connected.';
      case ConnectionStatus.UPDATING:
        return 'The device is being updated.';
      case ConnectionStatus.DEVICE_NOT_READY:
        return 'The device is not in the main menu.';
      case ConnectionStatus.PARTIAL_STATE:
        return 'The device is unauthenticated.';
      case ConnectionStatus.NEW_DEVICE:
        return 'A new device has been connected to the CySync app.';
      case ConnectionStatus.LAST_AUTH_FAILED:
        return 'Device authentication failed the last time.';
      case ConnectionStatus.IN_TEST_APP:
      case ConnectionStatus.IN_BOOTLOADER:
        return 'Device needs to be configured.';
      case ConnectionStatus.UPDATE_REQUIRED:
        return 'This device is incompatible with cysync.';
      case ConnectionStatus.UNKNOWN_ERROR:
      default:
        return 'An unknown error occurred while connecting the device';
    }
  };

  if (
    ![
      ConnectionStatus.NOT_CONNECTED,
      ConnectionStatus.CONNECTING,
      ConnectionStatus.CONNECTED,
      ConnectionStatus.UPDATING
    ].includes(connectedState)
  ) {
    return (
      <Root title={getDeviceConnectedTooltip()}>
        <Button
          onClick={() => {
            logger.info('Device update prompt opened from navbar.');
            Analytics.Instance.event(
              Analytics.Categories.NAVBAR_DEVICE_CONNECTED,
              Analytics.Actions.CLICKED
            );
            setOpenMisconfiguredPrompt(true);
          }}
          className={classes.connectedStatus}
        >
          {getDeviceConnectedIcon()}
          {getDeviceConnectedText()}
        </Button>
      </Root>
    );
  }

  return (
    <Root title={getDeviceConnectedTooltip()}>
      <div className={classes.connectedStatus}>
        {getDeviceConnectedIcon()}
        {getDeviceConnectedText()}
      </div>
    </Root>
  );
};

DeviceConnectionStatus.propTypes = {
  loaderIconClassName: PropTypes.string.isRequired
};

export default DeviceConnectionStatus;
