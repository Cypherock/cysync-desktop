import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import UsbIcon from '@mui/icons-material/Usb';
import { Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import withTheme from '@mui/styles/withTheme';
import OS from 'os';
import React, { useEffect, useState } from 'react';

import { LockscreenProvider } from '../store/provider';
import logger from '../utils/logger';
import { addToGroup, permissionStatus, restart } from '../utils/permissions';

import Root from './Root';

const PREFIX = 'PermissionSetup';

const classes = {
  root: `${PREFIX}-root`,
  text: `${PREFIX}-text`,
  content: `${PREFIX}-content`,
  button: `${PREFIX}-button`,
  icon: `${PREFIX}-icon`
};

const StyledGrid = styled(Grid)(() => ({
  [`&.${classes.root}`]: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#232222'
  },
  [`& .${classes.text}`]: {
    color: '#FFF',
    marginBottom: '1rem',
    fontSize: '1.5rem'
  },
  [`& .${classes.content}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.button}`]: {
    background: '#E0B36A',
    color: '#000',
    textTransform: 'none',
    '&:hover': {
      background: '#DAA147'
    }
  },
  [`& .${classes.icon}`]: {
    fontSize: '5rem',
    color: '#DAA147',
    marginBottom: '2rem'
  }
}));

const PermissionSetup = () => {
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
    <StyledGrid className={classes.root} container>
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
            sx={{ mb: 2 }}
          >
            Continue
          </Button>
          <div style={{ userSelect: 'text' }}>
            <Typography variant="body2" sx={{ color: '#eee' }}>
              If the above button does not work follow the instructions given
              below:
            </Typography>

            <Typography variant="body2" sx={{ color: '#eee' }}>
              <ol>
                <li>
                  Execute{' '}
                  <Typography
                    variant="caption"
                    sx={{ color: 'secondary.main' }}
                  >
                    sudo usermod -a -G dialout $USER
                  </Typography>{' '}
                  command in your terminal
                </li>

                <li>Restart your system and open cysync again</li>
              </ol>
            </Typography>
          </div>
        </Grid>
      )}
    </StyledGrid>
  );
};

export default withTheme(PermissionSetup);
