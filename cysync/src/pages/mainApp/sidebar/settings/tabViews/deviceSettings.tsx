import { Grid } from '@material-ui/core';
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
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import RouteLinks from '../../../../../constants/routes';
import { useConnection } from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import CardAuth from './deviceHealth/cardAuth';
import DeviceAuth from './deviceHealth/deviceAuth';
import DeviceUpgrade from './deviceHealth/deviceUpgrade';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 'min-content',
      padding: '0rem 1rem'
    },
    wrapperContainer: {
      background: '#0E121A'
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
      height: 3,
      background: '#13171D',
      margin: '0.5rem 0rem'
    },
    listItem: {
      color: theme.palette.text.primary,
      transition: 'all 0.3s ease-in',
      '&:hover': {
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.1)'
      }
    }
  })
);

interface DeviceSettingsProps {
  allowExit: boolean;
  setAllowExit: (val: boolean) => void;
}

const DeviceSettings = ({ allowExit, setAllowExit }: DeviceSettingsProps) => {
  const classes = useStyles();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { beforeNetworkAction, beforeFlowStart } = useConnection();

  const closeTab = () => {
    navigate(RouteLinks.settings.device.index);
  };

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.DEVICE_SETTINGS);
    logger.info('In device settings');
  }, []);

  const DeviceHealthItems = [
    {
      name: 'Device Upgrade',
      element: (
        <DeviceUpgrade
          allowExit={allowExit}
          setAllowExit={setAllowExit}
          handleDeviceHealthTabClose={closeTab}
        />
      ),
      route: RouteLinks.settings.device.upgrade
    },
    {
      name: 'Device Authentication',
      element: (
        <DeviceAuth
          allowExit={allowExit}
          setAllowExit={setAllowExit}
          handleDeviceHealthTabClose={closeTab}
        />
      ),
      route: RouteLinks.settings.device.auth
    },
    {
      name: 'X1 Card Authentication',
      element: (
        <CardAuth
          allowExit={allowExit}
          setAllowExit={setAllowExit}
          handleDeviceHealthTabClose={closeTab}
        />
      ),
      route: RouteLinks.settings.device.cardAuth
    }
  ];

  const handleDeviceHealthTabOpen = (index: number) => {
    if (beforeNetworkAction()) {
      if (index === 0 || beforeFlowStart()) {
        navigate(DeviceHealthItems[index].route);
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {location.pathname === RouteLinks.settings.device.index ? (
        <Grid item xs={12} className={classes.header}>
          <Typography color="secondary" variant="h5">
            Device Settings
          </Typography>
        </Grid>
      ) : null}
      <div style={{ width: '100%' }}>
        <Routes>
          {DeviceHealthItems.map(item => {
            const route = '/' + item.route.split('/').splice(3).join('/');
            return (
              <Route path={route} key={item.name} element={item.element} />
            );
          })}

          <Route
            path="/"
            element={
              <List className={classes.listWrapper}>
                {DeviceHealthItems.map((item, index) => {
                  return (
                    <div key={item.name}>
                      <ListItem
                        onClick={() => handleDeviceHealthTabOpen(index)}
                        className={classes.listItem}
                      >
                        <ListItemText primary={item.name} />
                        <ListItemSecondaryAction>
                          <Button
                            variant="text"
                            onClick={() => handleDeviceHealthTabOpen(index)}
                          >
                            <ChevronRightIcon
                              style={{
                                color: theme.palette.text.secondary,
                                fontSize: 30
                              }}
                            />
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider className={classes.divider} />
                    </div>
                  );
                })}
              </List>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

DeviceSettings.propTypes = {
  allowExit: PropTypes.bool.isRequired,
  setAllowExit: PropTypes.func.isRequired
};

export default DeviceSettings;
