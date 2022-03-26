import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import SwitchButton from '../../../../../designSystem/designComponents/buttons/switchButton';
import DialogBoxConfirmation from '../../../../../designSystem/designComponents/dialog/dialogBoxConfirmation';
import DropMenu from '../../../../../designSystem/designComponents/menu/DropMenu';
import Analytics from '../../../../../utils/analytics';
import { passwordExists } from '../../../../../utils/auth';
import {
  autolockOptions,
  getAutolockIndex,
  setAutolockIndex
} from '../../../../../utils/autolock';
import { triggerClearData } from '../../../../../utils/clearData';
import logger from '../../../../../utils/logger';

import ChangePassword from './generalSettings/changePassword';
import RemovePasswordComponent from './generalSettings/removePassword';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    header: {
      maxHeight: '3rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    listWrapper: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start'
    },
    divider: {
      height: 3,
      background: '#13171D',
      margin: '0.3rem 0rem'
    },
    listItem: {
      color: theme.palette.text.primary
    },
    button: {
      background: '#71624C',
      color: '#FFFFFF',
      textTransform: 'none',
      padding: '0.5rem 1.5rem',
      '&:hover': {
        background: theme.palette.secondary.dark
      }
    },
    marginTopBottom: {
      margin: '0.5rem 0rem'
    }
  })
);

const GeneralSettings = () => {
  const location = useLocation();
  const classes = useStyles();
  const theme = useTheme();

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

  const [index, setIndex] = React.useState({
    currency: 0,
    language: 0,
    theme: 0,
    autolock: 0
  });

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.GENERAL_SETTINGS);
    logger.info('In general settings');

    const autolockIndex = getAutolockIndex();

    if (autolockIndex !== 0) {
      setIndex({ ...index, autolock: autolockIndex });
    }

    if (location.search) {
      const query = new URLSearchParams(location.search);
      if (query && query.has('resetApp')) {
        setResetAppDialog(true);
      }
    }
  }, []);

  const handleListItemClick = (Lindex: number, type: string) => {
    if (type) {
      setIndex({
        ...index,
        [type]: Lindex
      });

      switch (type) {
        case 'autolock':
          setAutolockIndex(Lindex);
          break;
        default:
          break;
      }
    } else {
      setIndex({ ...index });
    }
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
      name: 'Counter Value',
      secondaryText: '(The balance will be denominated in this currency)',
      element: (
        <DropMenu
          options={[
            'US Dollars (USD)'
            // "Indian Rupee (INR)"
          ]}
          type="currency"
          index={index.currency}
          handleMenuItemSelectionChange={handleListItemClick}
          stylex={2}
        />
      )
    },
    {
      name: 'Display Language',
      secondaryText: '(Set the Language to be displayed in CySync)',
      element: (
        <DropMenu
          options={[
            'English'
            // "Hindi"
          ]}
          type="language"
          index={index.language}
          handleMenuItemSelectionChange={handleListItemClick}
          stylex={2}
        />
      )
    },
    {
      name: 'Theme',
      secondaryText: '(Select the Theme)',
      element: (
        <DropMenu
          options={[
            'Dark'
            // "Light"
          ]}
          type="theme"
          index={index.theme}
          handleMenuItemSelectionChange={handleListItemClick}
          stylex={2}
        />
      )
    },
    {
      name: 'Password',
      secondaryText: '(Change the password, Turn Off or On password)',
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
      name: 'Auto-Lock',
      secondaryText: 'Lock the app automatically after inactivity.',
      element: (
        <DropMenu
          options={[...autolockOptions]}
          type="autolock"
          index={index.autolock}
          handleMenuItemSelectionChange={handleListItemClick}
        />
      )
    },
    {
      name: 'Clear Data',
      secondaryText: '(You will loose all the data stored in the CySync app)',
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
        You will loose all the data stored in your CySync app.
      </Typography>
      <Typography align="center" color="textSecondary">
        Please restart the application if it does not starts automatically.
      </Typography>
    </div>
  );

  const onResetApp = () => {
    triggerClearData();
    setResetAppDialog(false);
  };

  return (
    <div style={{ width: '100%' }}>
      <DialogBoxConfirmation
        isClosePresent
        maxWidth="sm"
        fullScreen
        open={resetAppDialog}
        handleClose={() => {
          setResetAppDialog(false);
        }}
        handleConfirmation={onResetApp}
        restComponents={resetAppConfirmationComponent}
      />
      <RemovePasswordComponent
        open={removePasswordDialog}
        onClose={() => {
          setRemovePasswordDialog(false);
          setPreviousSetPassword(passwordExists());
        }}
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
                <ListItem>
                  <ListItemText
                    className={classes.listItem}
                    primary={item.name}
                    secondary={
                      item.secondaryText.length > 0 ? item.secondaryText : null
                    }
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
    </div>
  );
};

export default GeneralSettings;
