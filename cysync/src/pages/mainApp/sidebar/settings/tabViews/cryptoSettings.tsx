import { Grid } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import IconButton from '../../../../../designSystem/designComponents/buttons/customIconButton';
import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import DropMenu from '../../../../../designSystem/designComponents/menu/DropMenu';
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
    listItem: {
      color: theme.palette.text.primary
    }
  })
);

type CryptoSettingsProps = {
  closeTab: () => void;
};

const CryptoSettings: React.FC<CryptoSettingsProps> = ({ closeTab }) => {
  const classes = useStyles();
  const [index, setIndex] = React.useState({
    confirmation: 0,
    forex: 0,
    assets: 0
  });
  const handleListItemClick = (Lindex: number, type: string) => {
    if (type) {
      setIndex({
        ...index,
        [type]: Lindex
      });
    } else {
      setIndex({ ...index });
    }
  };

  const ListData = [
    {
      name: 'Change Confirmations',
      secondaryText: '',
      element: (
        <DropMenu
          options={['1', '2', '3', '4', '5']}
          type="confirmation"
          index={index.confirmation}
          handleMenuItemSelectionChange={handleListItemClick}
        />
      )
    },
    {
      name: 'Choose from where rates are fetched ?',
      secondaryText: '',
      element: (
        <DropMenu
          options={['BitForex', 'BlockCypher']}
          type="forex"
          index={index.forex}
          handleMenuItemSelectionChange={handleListItemClick}
        />
      )
    }
  ];
  return (
    <Grid container className={classes.root}>
      <Grid item xs={12} className={classes.header}>
        <Typography color="secondary" variant="h4">
          Crypto Assets
        </Typography>
        <IconButton onClick={closeTab} title="Close">
          <Icon size={16} viewBox="0 0 14 14" icon={ICONS.close} color="red" />
        </IconButton>
      </Grid>
      <Grid item xs={12}>
        <DropMenu
          options={['Asset 1', 'Asset 2', 'Asset 3']}
          type="assets"
          index={index.assets}
          handleMenuItemSelectionChange={handleListItemClick}
        />
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

CryptoSettings.propTypes = {
  closeTab: PropTypes.func.isRequired
};

export default CryptoSettings;
