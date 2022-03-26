import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import RouteLinks from '../../constants/routes';
import { UpdateProvider, WalletsProvider } from '../../store/provider';

import DbCleanup from './dbCleanup';
import DeviceUpdater from './deviceUpdater';
import Navbar from './Navbar';
import Sidebar from './sidebar';
import Portfolio from './sidebar/portfolio';
import Settings from './sidebar/settings';
import Transaction from './sidebar/transaction';
import Tutorial from './sidebar/tutorial';
import Wallet from './sidebar/wallet';
import Updater from './updater';

const useStyles = makeStyles((theme: any) => ({
  root: {
    background: theme.palette.background.default,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    overflow: 'hidden'
  },
  navbar: {
    height: '60px'
  },
  content: {
    height: 'calc(100% - 60px)'
  },
  contentChild: {
    height: '100%',
    padding: '20px 40px 10px 30px',
    overflowY: 'scroll',
    overflowX: 'hidden'
  },
  sideBarMain: {
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'start',
    padding: '1rem',
    overflow: 'hidden'
  },
  dialogHeading: {
    width: '100%',
    textAlign: 'center',
    margin: '2rem 0rem'
  },
  dialogCloseButton: {
    position: 'absolute',
    right: '10px',
    top: '10px'
  },
  dialogClose: {
    textTransform: 'none',
    background: theme.palette.primary.light,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.text.secondary}`,
    '&:hover': {
      background: theme.palette.text.primary,
      color: theme.palette.primary.main
    }
  },
  dialogButtonWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem 0rem 4rem'
  }
}));

interface Props {
  handleLock: () => void;
}

const Index: React.FC<Props> = ({ handleLock }) => {
  const classes = useStyles();

  return (
    <HashRouter>
      <WalletsProvider>
        <UpdateProvider>
          <Grid container className={classes.root}>
            <Grid container className={classes.navbar}>
              <Navbar handleLock={handleLock} />
            </Grid>
            <Grid
              container
              justify="center"
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
          </Grid>
        </UpdateProvider>
      </WalletsProvider>
    </HashRouter>
  );
};

Index.propTypes = {
  handleLock: PropTypes.func.isRequired
};

export default Index;
