import LoadingIcon from '@mui/icons-material/Loop';
import WarningIcon from '@mui/icons-material/Warning';
import { Button, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import { useSync } from '../../../store/provider';

const PREFIX = 'SyncStatus';

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

export interface SyncStatusProps {
  loaderIconClassName: string;
}

const SyncStatus: React.FC<SyncStatusProps> = props => {
  const theme = useTheme();
  const { isSyncing, isWaitingForConnection, reSync } = useSync();
  const [resyncAvailable, setResyncAvailable] = useState(isSyncing);

  const handleResync = () => {
    reSync();
    setResyncAvailable(false);
  };

  // Resync Button enabled after 15 minutes of last sync
  const interval = React.useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (!isSyncing && !resyncAvailable) {
      interval.current = setTimeout(() => {
        setResyncAvailable(true);
      }, 1000 * 60 * 15);
    }
    return () => {
      if (interval.current) {
        clearTimeout(interval.current);
        interval.current = undefined;
      }
    };
  }, [isSyncing, resyncAvailable]);

  const getSyncIcon = () => {
    if (isSyncing && !isWaitingForConnection) {
      return (
        <LoadingIcon
          className={props.loaderIconClassName}
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
    <Root title={getSyncToolTip()}>
      <div className={classes.connectedStatus}>
        {getSyncIcon()}
        {getSyncText()}
      </div>
    </Root>
  );
};

SyncStatus.propTypes = {
  loaderIconClassName: PropTypes.string.isRequired
};

export default SyncStatus;
