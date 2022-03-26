import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme,
  withStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ArrawBackIcon from '@material-ui/icons/ArrowBack';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import React, { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import RouteLinks from '../../../../constants/routes';
import Analytics from '../../../../utils/analytics';
import logger from '../../../../utils/logger';

import AboutSettings from './tabViews/aboutSettings';
import DeviceSettings from './tabViews/deviceSettings';
import GeneralSettings from './tabViews/generalSettings';

const IconButton = withStyles((theme: Theme) => ({
  root: {
    color: theme.palette.secondary.dark,
    background: theme.palette.primary.light
  }
}))(Fab);

const useStyles = makeStyles(theme =>
  createStyles({
    root: {},
    wrapperContainer: {
      background: '#0E121A',
      padding: '1rem 1.5rem',
      height: 'calc(100vh - 230px)',
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      paddingRight: '10px',
      '&::-webkit-scrollbar': {
        width: '8px',
        background: theme.palette.primary.light
      },
      '&::-webkit-scrollbar-thumb': {
        background: theme.palette.text.secondary
      }
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
      transition: 'all 0.3s ease-in',
      '&:hover': {
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.1)'
      }
    }
  })
);

const Settings = () => {
  const classes = useStyles();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [allowExit, setAllowExit] = useState(true);

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.SETTINGS);
    logger.info('In Settings');
  }, []);

  const SettingsMenuItems = [
    {
      name: 'General Settings',
      element: <GeneralSettings />,
      route: RouteLinks.settings.general.index
    },
    {
      name: 'Device Settings',
      element: (
        <DeviceSettings setAllowExit={setAllowExit} allowExit={allowExit} />
      ),
      route: RouteLinks.settings.device.index
    },
    {
      name: 'About',
      element: <AboutSettings />,
      route: RouteLinks.settings.about.index
    }
  ];

  const closeTab = () => {
    navigate(RouteLinks.settings.index);
  };

  const handleTabOpen = (index: number) => {
    navigate(SettingsMenuItems[index].route);
  };

  return (
    <Grid container className={classes.root} spacing={2}>
      {location.pathname !== '/' ? (
        <Grid item xs={12}>
          <IconButton
            disabled={!allowExit}
            onClick={closeTab}
            size="medium"
            color="primary"
          >
            <ArrawBackIcon />
          </IconButton>
        </Grid>
      ) : null}
      <Grid item xs={12}>
        <Typography
          style={{ color: theme.palette.secondary.dark }}
          variant="h2"
        >
          Settings
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Grid container className={classes.wrapperContainer}>
          <Routes>
            {SettingsMenuItems.map(item => {
              const route =
                '/' + item.route.split('/').splice(2).join('/') + '/*';
              return (
                <Route path={route} key={item.name} element={item.element} />
              );
            })}
            <Route
              path="/"
              element={
                <List className={classes.listWrapper}>
                  {SettingsMenuItems.map((item, index) => {
                    return (
                      <div key={item.name}>
                        <ListItem
                          onClick={() => handleTabOpen(index)}
                          className={classes.listItem}
                        >
                          <Typography color="textPrimary">
                            {item.name}
                          </Typography>
                          <ListItemSecondaryAction>
                            <Button
                              variant="text"
                              onClick={() => handleTabOpen(index)}
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
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Settings;
