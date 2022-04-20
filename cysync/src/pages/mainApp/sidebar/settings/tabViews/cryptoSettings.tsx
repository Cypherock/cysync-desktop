import { Grid } from '@mui/material';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import IconButton from '../../../../../designSystem/designComponents/buttons/customIconButton';
import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import DropMenu from '../../../../../designSystem/designComponents/menu/DropMenu';
import ICONS from '../../../../../designSystem/iconGroups/iconConstants';

const PREFIX = 'CryptoSettings';

const classes = {
  header: `${PREFIX}-header`,
  listWrapper: `${PREFIX}-listWrapper`,
  divider: `${PREFIX}-divider`,
  listItem: `${PREFIX}-listItem`
};

const Root = styled(Grid)(({ theme }) => ({
  height: 'min-content',
  [`& .${classes.header}`]: {
    maxHeight: '3rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.listWrapper}`]: {
    width: '100%'
  },
  [`& .${classes.divider}`]: {
    background: theme.palette.text.secondary
  },
  [`& .${classes.listItem}`]: {
    color: theme.palette.text.primary
  }
}));

type CryptoSettingsProps = {
  closeTab: () => void;
};

const CryptoSettings: React.FC<CryptoSettingsProps> = ({ closeTab }) => {
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
    <Root container>
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
    </Root>
  );
};

CryptoSettings.propTypes = {
  closeTab: PropTypes.func.isRequired
};

export default CryptoSettings;
