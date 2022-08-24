import { Wallet } from '@cypherock/database';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import React, { useEffect, useState } from 'react';
import {
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom';

import RouteLinks from '../../../../constants/routes';
import {
  AddCoinProvider,
  SelectedWalletContext,
  useWallets
} from '../../../../store/provider';
import Analytics from '../../../../utils/analytics';
import logger from '../../../../utils/logger';

import AddWallet from './addWallet';
import WalletView from './wallet';

const SingleWalletView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const openAddCoinForm = searchParams.get('openAddCoinForm');

  const { walletId } = useParams();
  const { allWallets, isLoading: isWalletLoading } = useWallets();
  const [currentWalletDetails, setCurrentWalletDetails] =
    useState<Wallet | null>(null);

  const afterAddCoinOpen = () => {
    setSearchParams({});
  };

  useEffect(() => {
    if (isWalletLoading) return;

    const wallet = allWallets.find(elem => elem._id === walletId);
    if (wallet) {
      setCurrentWalletDetails(wallet);
    } else {
      navigate(RouteLinks.wallet.index);
    }
  }, [walletId, isWalletLoading]);

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.WALLET);
    logger.info('In wallet screen');
  }, []);

  if (currentWalletDetails) {
    return (
      <AddCoinProvider>
        <SelectedWalletContext.Provider
          value={{
            selectedWallet: currentWalletDetails
          }}
        >
          <WalletView
            openAddCoinForm={openAddCoinForm === 'true'}
            addCoinOpened={afterAddCoinOpen}
          />
        </SelectedWalletContext.Provider>
      </AddCoinProvider>
    );
  }

  return (
    <Grid container>
      <Grid item xs={12}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '4rem'
          }}
        >
          <CircularProgress color="secondary" />
        </div>
      </Grid>
    </Grid>
  );
};

const Wallet: React.FC = () => {
  return (
    <Routes>
      <Route path={`/:walletId`} element={<SingleWalletView />} />
      <Route path={`/`} element={<AddWallet />} />
    </Routes>
  );
};

export default Wallet;
