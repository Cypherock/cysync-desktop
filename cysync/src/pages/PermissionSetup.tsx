import { Button } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { makeStyles, withTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import SettingsBackupRestoreIcon from '@material-ui/icons/SettingsBackupRestore';
import UsbIcon from '@material-ui/icons/Usb';
import OS from 'os';
import React, { useEffect, useState } from 'react';

import { LockscreenProvider } from '../store/provider';
import logger from '../utils/logger';
import { addToGroup, permissionStatus, restart } from '../utils/permissions';

import Root from './Root';

const useStyles = makeStyles({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#232222'
  },
  text: {
    color: '#FFF',
    marginBottom: '1rem',
    fontSize: '1.5rem'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    background: '#E0B36A',
    textTransform: 'none',
    '&:hover': {
      background: '#DAA147'
    }
  },
  icon: {
    fontSize: '5rem',
    color: '#DAA147',
    marginBottom: '2rem'
  }
});

const PermissionSetup = () => {
  const classes = useStyles();

  const [hasPermission, setHasPermission] = useState({
    permission: false,
    restart: true
  });

  useEffect(() => {
    logger.info('In PermissionSetup');
    if (OS.platform() !== 'linux') {
      setHasPermission({
        permission: true,
        restart: false
      });
    } else {
      permissionStatus().then(d => {
        setHasPermission(d);
        return d;
      });
    }

    return () => {
      logger.info('PermissionSetup closed');
    };
  }, []);

  if (hasPermission.permission && !hasPermission.restart) {
    return (
      <LockscreenProvider>
        <Root />
      </LockscreenProvider>
    );
  }

  const addUserGroup = async () => {
    const res = await addToGroup();
    if (res) {
      permissionStatus()
        .then(d => {
          setHasPermission(d);
        })
        .catch(() => {
          // empty
        });
    }
  };

  const restartPc = async () => {
    await restart();
  };

  return (
    <Grid className={classes.root} container>
      {hasPermission.permission ? (
        <Grid container className={classes.content}>
          <SettingsBackupRestoreIcon className={classes.icon} />
          <Typography gutterBottom className={classes.text}>
            Press restart to allow changes to take effect
          </Typography>
          <Button
            onClick={restartPc}
            variant="contained"
            className={classes.button}
          >
            Restart
          </Button>
        </Grid>
      ) : (
        <Grid container className={classes.content}>
          <UsbIcon className={classes.icon} />
          <Typography gutterBottom className={classes.text}>
            Press continue to allow application to access usb port
          </Typography>
          <Button
            onClick={addUserGroup}
            variant="contained"
            className={classes.button}
          >
            Continue
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default withTheme(PermissionSetup);
