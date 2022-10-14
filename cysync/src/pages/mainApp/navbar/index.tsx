import { Chip } from '@mui/material';
import { keyframes, styled, useTheme } from '@mui/material/styles';
import React from 'react';

import Icon from '../../../designSystem/designComponents/icons/Icon';
import CySync from '../../../designSystem/iconGroups/cySync';
import { useConnection, useFeedback } from '../../../store/provider';

import DeviceConnectionStatus from './deviceConnectionStatus';
import DiscreetMode from './discreetMode';
import LockStatus from './lockStatus';
import SyncStatus from './syncStatus';

const PREFIX = 'Navbar';

const classes = {
  root: `${PREFIX}-root`,
  leftContent: `${PREFIX}-leftContent`,
  rightContent: `${PREFIX}-rightContent`,
  text: `${PREFIX}-text`,
  divider: `${PREFIX}-divider`,
  clearFix: `${PREFIX}-clearFix`,
  loaderIcon: `${PREFIX}-loaderIcon`
};

const rotateKeyframe = keyframes`
  0% {
    transform: rotateZ(0deg);
  }

  100% {
    transform: rotateZ(360deg);
  }
`;

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.text}`]: {
    marginLeft: 10
  },

  [`& .${classes.divider}`]: {
    background: theme.palette.text.secondary,
    height: '50%',
    margin: '0px 10px'
  },

  [`& .${classes.clearFix}`]: {
    margin: `0px !important`,
    padding: `0px !important`
  },

  [`& .${classes.loaderIcon}`]: {
    animation: `${rotateKeyframe} 1500ms ${theme.transitions.easing.easeInOut} infinite`
  },

  [`&.${classes.root}`]: {
    borderBottom: `0.1px solid ${theme.palette.primary.light}`,
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%'
  },
  [`& .${classes.leftContent}`]: {
    padding: `0px 50px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.rightContent}`]: {
    padding: `0px 50px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

const Navbar: React.FC = () => {
  const theme = useTheme();
  const { deviceConnection } = useConnection();
  const { isRecording, stopRecording } = useFeedback();

  const RecordingButton = () => (
    <Chip
      label={'Stop Recording'}
      variant="outlined"
      style={{
        color: 'red',
        border: '1px solid',
        margin: 'auto 5px'
      }}
      onClick={stopRecording}
    />
  );

  return (
    <Root className={classes.root}>
      <div className={classes.leftContent}>
        <Icon
          size={74}
          height={34}
          viewBox="0 0 74 23"
          iconGroup={<CySync color={theme.palette.text.primary} />}
        />
        {process.env.BUILD_TYPE === 'debug' && (
          <Chip
            label="Test Build"
            variant="outlined"
            style={{
              color: theme.palette.info.main,
              border: '1px solid',
              margin: 'auto 5px'
            }}
          />
        )}
        {process.env.SERVER_ENV === 'development' && (
          <Chip
            label="Dev Server"
            variant="outlined"
            style={{
              color: theme.palette.warning.main,
              border: '1px solid',
              margin: 'auto 5px'
            }}
          />
        )}
        {process.env.SERVER_ENV === 'local' && (
          <Chip
            label="Local Server"
            variant="outlined"
            style={{
              color: theme.palette.warning.main,
              border: '1px solid',
              margin: 'auto 5px'
            }}
          />
        )}
        {process.env.BUILD_TYPE === 'debug' && deviceConnection && (
          <Chip
            label={deviceConnection.getPacketVersion()}
            variant="outlined"
            style={{
              color: theme.palette.success.main,
              border: '1px solid',
              margin: 'auto 5px'
            }}
          />
        )}
      </div>
      <div className={classes.rightContent}>
        {isRecording && <RecordingButton />}

        <SyncStatus loaderIconClassName={classes.loaderIcon} />

        <DeviceConnectionStatus loaderIconClassName={classes.loaderIcon} />

        <LockStatus />

        <DiscreetMode />
      </div>
    </Root>
  );
};

export default Navbar;
