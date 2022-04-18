import { Grid } from '@mui/material';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import IconButton from '../../../../../designSystem/designComponents/buttons/customIconButton';
import SwitchButton from '../../../../../designSystem/designComponents/buttons/switchButton';
import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import ICONS from '../../../../../designSystem/iconGroups/iconConstants';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 'min-content'
    },
    header: {
      maxHeight: '3rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    listWrapper: {
      width: '100%'
    },
    divider: {
      background: theme.palette.text.secondary
    },
    button: {
      margin: '1rem'
    },
    listItem: {
      color: theme.palette.text.primary
    }
  })
);

type WalletSettingsProps = {
  closeTab?: () => void;
};

const WalletSettings: React.FC<WalletSettingsProps> = ({ closeTab }) => {
  const classes = useStyles();

  const [walletSettings, setWallSettings] = React.useState({
    hideEmptyToken: false,
    hiddenToken: false,
    activeButton: 0
  });

  const handleSwitchChange = (event: any) => {
    switch (event.target.name) {
      case 'hideEmptyToken':
        setWallSettings({
          ...walletSettings,
          hideEmptyToken: !walletSettings.hideEmptyToken
        });
        break;
      case 'hiddenToken':
        setWallSettings({
          ...walletSettings,
          hiddenToken: !walletSettings.hiddenToken
        });
        break;
      default:
        break;
    }
  };

  const handleButtonChange = (index: number) => {
    setWallSettings({
      ...walletSettings,
      activeButton: index
    });
  };

  const ListData = [
    {
      name: 'Hide Empty Token Balances',
      secondaryText: '',
      element: (
        <SwitchButton
          name="hideEmptyToken"
          handleChange={event => handleSwitchChange(event)}
          completed={walletSettings.hideEmptyToken}
        />
      )
    },
    {
      name: 'Operation History',
      secondaryText: '',
      element: (
        <Button variant="contained" color="secondary">
          Download
        </Button>
      )
    },
    {
      name: 'Fetch xPUB',
      secondaryText: '',
      element: (
        <Button variant="contained" color="secondary">
          Download
        </Button>
      )
    },
    {
      name: 'Hidden Tokens',
      secondaryText: '',
      element: (
        <SwitchButton
          handleChange={event => handleSwitchChange(event)}
          name="hiddenToken"
          completed={walletSettings.hiddenToken}
        />
      )
    }
  ];

  let finalCloseTab = closeTab;

  if (!finalCloseTab) {
    finalCloseTab = () => {
      // empty
    };
  }

  return (
    <Grid container className={classes.root}>
      <Grid item xs={12} className={classes.header}>
        <Typography color="secondary" variant="h4">
          Crypto Assets
        </Typography>
        <IconButton onClick={finalCloseTab} title="Close">
          <Icon size={16} viewBox="0 0 14 14" icon={ICONS.close} color="red" />
        </IconButton>
      </Grid>
      <Grid item xs={12}>
        <Button
          variant={walletSettings.activeButton === 0 ? 'contained' : 'outlined'}
          color="secondary"
          onClick={() => handleButtonChange(0)}
          className={classes.button}
        >
          Wallet 1
        </Button>
        <Button
          variant={walletSettings.activeButton === 1 ? 'contained' : 'outlined'}
          color="secondary"
          onClick={() => handleButtonChange(1)}
          className={classes.button}
        >
          Wallet 2
        </Button>
        <Button
          variant={walletSettings.activeButton === 2 ? 'contained' : 'outlined'}
          color="secondary"
          onClick={() => handleButtonChange(2)}
          className={classes.button}
        >
          Wallet 3
        </Button>
      </Grid>
      <Grid container>
        <List className={classes.listWrapper}>
          {ListData.map(item => {
            return (
              <>
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
              </>
            );
          })}
        </List>
      </Grid>
    </Grid>
  );
};

WalletSettings.propTypes = {
  closeTab: PropTypes.func
};

WalletSettings.defaultProps = {
  closeTab: undefined
};

export default WalletSettings;
