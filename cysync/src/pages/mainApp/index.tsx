import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import clsx from 'clsx';
import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import RouteLinks from '../../constants/routes';
import { UpdateProvider, WalletsProvider } from '../../store/provider';

import DbCleanup from './dbCleanup';
import DeviceUpdater from './deviceUpdater';
import Navbar from './navbar';
import Sidebar from './sidebar';
import Portfolio from './sidebar/portfolio';
import Settings from './sidebar/settings';
import Swap from './sidebar/swap';
import Transaction from './sidebar/transaction';
import Tutorial from './sidebar/tutorial';
import Wallet from './sidebar/wallet';
import Updater from './updater';

const PREFIX = 'MainApp';

const classes = {
  root: `${PREFIX}-root`,
  navbar: `${PREFIX}-navbar`,
  content: `${PREFIX}-content`,
  contentChild: `${PREFIX}-contentChild`,
  sideBarMain: `${PREFIX}-sideBarMain`,
  dialogHeading: `${PREFIX}-dialogHeading`,
  dialogCloseButton: `${PREFIX}-dialogCloseButton`,
  dialogClose: `${PREFIX}-dialogClose`,
  dialogButtonWrapper: `${PREFIX}-dialogButtonWrapper`
};

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    background: theme.palette.background.default,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    overflow: 'hidden'
  },

  [`& .${classes.navbar}`]: {
    height: '60px'
  },

  [`& .${classes.content}`]: {
    height: 'calc(100% - 60px)'
  },

  [`& .${classes.contentChild}`]: {
    height: '100%',
    padding: '20px 40px 10px 30px',
    overflowY: 'scroll',
    overflowX: 'hidden'
  },

  [`& .${classes.sideBarMain}`]: {
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'start',
    padding: '1rem',
    overflow: 'hidden'
  },

  [`& .${classes.dialogHeading}`]: {
    width: '100%',
    textAlign: 'center',
    margin: '2rem 0rem'
  },

  [`& .${classes.dialogCloseButton}`]: {
    position: 'absolute',
    right: '10px',
    top: '10px'
  },

  [`& .${classes.dialogClose}`]: {
    textTransform: 'none',
    background: theme.palette.primary.light,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.text.secondary}`,
    '&:hover': {
      background: theme.palette.text.primary,
      color: theme.palette.primary.main
    }
  },

  [`& .${classes.dialogButtonWrapper}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem 0rem 4rem'
  }
}));

const MainApp: React.FC = () => {
  return (
    <HashRouter>
      <WalletsProvider>
        <UpdateProvider>
          <StyledGrid container className={classes.root}>
            <Grid container className={classes.navbar}>
              <Navbar />
            </Grid>
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              className={classes.content}
            >
              <Grid
                xs={2}
                item
                className={clsx(classes.contentChild, classes.sideBarMain)}
              >
                <Sidebar />
              </Grid>
              <Grid item xs={10} className={classes.contentChild}>
                <Routes>
                  <Route
                    path={RouteLinks.wallet.index + '/*'}
                    element={<Wallet />}
                  />

                  <Route path={RouteLinks.swap.index} element={<Swap />} />

                  <Route
                    path={RouteLinks.transactions.index}
                    element={<Transaction />}
                  />

                  <Route
                    path={RouteLinks.tutorial.index}
                    element={<Tutorial />}
                  />

                  <Route
                    path={RouteLinks.settings.index + '/*'}
                    element={<Settings />}
                  />

                  <Route
                    path={RouteLinks.portfolio.index}
                    element={<Portfolio />}
                  />
                </Routes>
              </Grid>
            </Grid>
            <Updater />
            <DeviceUpdater />
            <DbCleanup />
          </StyledGrid>
        </UpdateProvider>
      </WalletsProvider>
    </HashRouter>
  );
};

export default MainApp;
