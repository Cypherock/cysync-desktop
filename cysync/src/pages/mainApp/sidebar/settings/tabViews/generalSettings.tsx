import { Chip } from '@mui/material';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import { styled, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import SwitchButton from '../../../../../designSystem/designComponents/buttons/switchButton';
import DialogBoxConfirmation from '../../../../../designSystem/designComponents/dialog/dialogBoxConfirmation';
import { useLockscreen } from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import { passwordExists } from '../../../../../utils/auth';
import { setAutoLock as storeAutoLock } from '../../../../../utils/autolock';
import { triggerClearData } from '../../../../../utils/clearData';
import logger from '../../../../../utils/logger';

import ChangePassword from './generalSettings/changePassword';
import ConfirmPassword from './generalSettings/confirmPassword';
import RemovePasswordComponent from './generalSettings/removePassword';
import SetEmailComponent from './generalSettings/setEmail';

const PREFIX = 'GeneralSettings';

const classes = {
  header: `${PREFIX}-header`,
  listWrapper: `${PREFIX}-listWrapper`,
  divider: `${PREFIX}-divider`,
  listItem: `${PREFIX}-listItem`,
  button: `${PREFIX}-button`,
  marginTopBottom: `${PREFIX}-marginTopBottom`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.header}`]: {
    maxHeight: '3rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.listWrapper}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  [`& .${classes.divider}`]: {
    height: 3,
    background: '#13171D',
    margin: '0.3rem 0rem'
  },
  [`& .${classes.listItem}`]: {
    color: theme.palette.text.primary
  },
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: '#FFFFFF',
    textTransform: 'none',
    padding: '0.5rem 1.5rem',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  },
  [`& .${classes.marginTopBottom}`]: {
    margin: '0.5rem 0rem'
  }
}));

const GeneralSettings = () => {
  const location = useLocation();
  const theme = useTheme();
  const { autoLock, setAutoLock } = useLockscreen();

  const [previousSetPassword, setPreviousSetPassword] = React.useState(
    passwordExists()
  );
  const [changePasswordDialog, setChangePasswordDialog] = React.useState(false);
  const [newPasswordDialog, setNewPasswordDialog] = React.useState(false);
  const [resetAppDialog, setResetAppDialog] = React.useState(false);
  const [disableProvision, setDisableProvision] = React.useState(
    localStorage.getItem('disableProvision') === 'true'
  );

  const [removePasswordDialog, setRemovePasswordDialog] = React.useState(false);
  const [confirmPasswordDialog, setConfirmPasswordDialog] =
    React.useState(false);

  const [emailText, setEmailText] = React.useState(
    localStorage.getItem('email') || ''
  );
  const [allowAuthEmail, setAllowAuthEmail] = React.useState(
    (JSON.parse(localStorage.getItem('allowAuthEmail')) as boolean) ?? false
  );
  const [setEmailDialog, setSetEmailDialog] = React.useState(false);
  const [removeEmail, setRemoveEmail] = React.useState(false);

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.GENERAL_SETTINGS);
    logger.info('In general settings');

    if (location.search) {
      const query = new URLSearchParams(location.search);
      if (query && query.has('resetApp')) {
        setResetAppDialog(true);
      }
    }
  }, []);

  useEffect(() => {
    setEmailText(localStorage.getItem('email') || '');
  }, [setEmailDialog]);

  const handleAutoLockToggle = () => {
    const newAutoLock = !autoLock;
    setAutoLock(newAutoLock);
    storeAutoLock(newAutoLock);
  };

  const handleAllowAuthEmailToggle = async () => {
    const newState = !allowAuthEmail;
    localStorage.setItem('allowAuthEmail', JSON.stringify(newState));
    setAllowAuthEmail(newState);
  };

  const handleDisableProvisionClick = () => {
    localStorage.setItem(
      'disableProvision',
      disableProvision ? 'false' : 'true'
    );
    setDisableProvision(!disableProvision);
  };

  const ListData = [
    {
      name: 'Password',
      secondaryText: '(Change password, Turn Off or On password usage)',
      element: previousSetPassword ? (
        <>
          <Button
            className={classes.button}
            onClick={() => {
              setRemovePasswordDialog(true);
            }}
            style={{
              marginRight: '0.8rem'
            }}
          >
            Remove Password
          </Button>
          <Button
            className={classes.button}
            onClick={() => {
              setChangePasswordDialog(true);
            }}
          >
            Change Password
          </Button>
        </>
      ) : (
        <Button
          className={classes.button}
          onClick={() => {
            setNewPasswordDialog(true);
          }}
        >
          Set Password
        </Button>
      )
    },
    {
      name: 'Email Auth',
      chip: emailText && (
        <Chip
          label={emailText}
          style={{ marginLeft: '10px' }}
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => {
            setRemoveEmail(false);
            setEmailText(localStorage.getItem('email') || '');
            setSetEmailDialog(true);
          }}
          onDelete={() => {
            setRemoveEmail(true);
            setEmailText(localStorage.getItem('email') || '');
            setSetEmailDialog(true);
          }}
        />
      ),
      secondaryText: !emailText ? (
        <div>
          <div>
            Email Authentication helps you verify the integrity of the X1 Cards{' '}
          </div>
          <div>
            and the X1 Wallet by receiving authentication reports on your mail
          </div>
        </div>
      ) : allowAuthEmail ? (
        'Email auth is enabled'
      ) : (
        'Email auth is disabled'
      ),
      element: emailText ? (
        <SwitchButton
          name="toggleAuthEmail"
          completed={allowAuthEmail}
          handleChange={handleAllowAuthEmailToggle}
        />
      ) : (
        <Button
          className={classes.button}
          onClick={() => {
            localStorage.setItem('allowAuthEmail', JSON.stringify(true));
            setAllowAuthEmail(true);
            setRemoveEmail(false);
            setEmailText(localStorage.getItem('email') || '');
            setSetEmailDialog(true);
          }}
        >
          Add Email Auth
        </Button>
      )
    },
    {
      name: 'Auto Lock',
      secondaryText:
        'Lock the app automatically when your laptop goes to sleep',
      element: previousSetPassword ? (
        <SwitchButton
          name="toggleAutoLock"
          completed={autoLock}
          handleChange={handleAutoLockToggle}
        />
      ) : (
        <Tooltip title="Set a password to enable this feature" placement="top">
          <span style={{ width: '100%', height: '100%' }}>
            <SwitchButton
              disabled
              name="toggleAutoLock"
              completed={false}
              handleChange={handleAutoLockToggle}
            />
          </span>
        </Tooltip>
      ),
      disabled: !previousSetPassword
    },
    {
      name: 'Clear cysync app data',
      secondaryText: (
        <div>
          <div>(You will lose all the data stored in the CySync app</div>
          <div>
            NOTE: Your wallet accounts stored on your device will not be
            affected)
          </div>
        </div>
      ),
      element: (
        <Button
          className={classes.button}
          onClick={() => {
            setResetAppDialog(true);
          }}
          style={{
            marginRight: '0.8rem'
          }}
        >
          Clear Data
        </Button>
      )
    }
  ];

  if (process.env.BUILD_TYPE === 'debug') {
    ListData.push({
      name: 'Disable provision check for devices',
      secondaryText: '(This will disable the check for provision on devices)',
      element: (
        <SwitchButton
          name="disableProvision"
          completed={disableProvision}
          handleChange={handleDisableProvisionClick}
        />
      )
    });
  }

  const resetAppConfirmationComponent = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        marginBottom: '5rem'
      }}
    >
      <Typography align="center" variant="h5" gutterBottom>
        Do you really want to clear all the application data?
      </Typography>
      <Typography align="center" color="textSecondary">
        You will lose all the data stored in your CySync app
      </Typography>
      {!passwordExists() && (
        <Typography align="center" color="textSecondary">
          Restart the application if it does not starts automatically
        </Typography>
      )}
    </div>
  );

  const onResetConfirmation = () => {
    if (passwordExists()) {
      setResetAppDialog(false);
      setConfirmPasswordDialog(true);
    } else {
      setResetAppDialog(false);
      onResetApp();
    }
  };

  const onResetApp = () => {
    triggerClearData();
  };

  return (
    <Root style={{ width: '100%' }}>
      <DialogBoxConfirmation
        isClosePresent
        maxWidth="sm"
        fullScreen
        open={resetAppDialog}
        handleClose={() => {
          setResetAppDialog(false);
        }}
        handleConfirmation={onResetConfirmation}
        restComponents={resetAppConfirmationComponent}
      />
      <RemovePasswordComponent
        open={removePasswordDialog}
        onClose={() => {
          setRemovePasswordDialog(false);
          setPreviousSetPassword(passwordExists());
        }}
      />
      <SetEmailComponent
        open={setEmailDialog}
        onClose={() => {
          setSetEmailDialog(false);
        }}
        remove={removeEmail}
        emailText={emailText}
      />
      <ConfirmPassword
        open={confirmPasswordDialog}
        onClose={() => {
          setConfirmPasswordDialog(false);
        }}
        onSuccess={onResetApp}
      />
      <ChangePassword
        type="change"
        handleChangePasswordDialog={changePasswordDialog}
        closeChangePassword={() => {
          setChangePasswordDialog(false);
          setPreviousSetPassword(passwordExists());
        }}
      />
      <ChangePassword
        type="set"
        handleChangePasswordDialog={newPasswordDialog}
        closeChangePassword={() => {
          setNewPasswordDialog(false);
          setPreviousSetPassword(passwordExists());
        }}
      />
      <div className={classes.header}>
        <Typography
          variant="h4"
          style={{ color: theme.palette.secondary.dark }}
        >
          General Settings
        </Typography>
      </div>
      <div style={{ width: '100%' }}>
        <List className={classes.listWrapper}>
          {ListData.map(item => {
            return (
              <div key={item.name}>
                <ListItem disabled={item.disabled}>
                  <ListItemText
                    className={classes.listItem}
                    primary={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {item.name}
                        {item.chip}
                      </div>
                    }
                    secondary={item.secondaryText ? item.secondaryText : null}
                  />
                  <ListItemSecondaryAction>
                    {item.element}
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider className={classes.divider} />
              </div>
            );
          })}
        </List>
      </div>
    </Root>
  );
};

export default GeneralSettings;
