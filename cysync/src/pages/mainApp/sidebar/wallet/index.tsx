import { Wallet2 } from '@cypherock/database';
import React, { useEffect, useState } from 'react';
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
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
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const openAddCoinForm = query.get('openAddCoinForm');
  const { walletId } = useParams();
  const navigate = useNavigate();
  const { allWallets } = useWallets();
  const [currentWalletDetails, setCurrentWalletDetails] =
    useState<Wallet2 | null>(null);

  useEffect(() => {
    const wallet = allWallets.find(elem => elem._id === walletId);
    if (wallet) {
      setCurrentWalletDetails(wallet);
    } else {
      navigate(RouteLinks.wallet.index);
    }
  }, [walletId]);

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
          <WalletView openAddCoinForm={openAddCoinForm === 'true'} />
        </SelectedWalletContext.Provider>
      </AddCoinProvider>
    );
  }

  return <></>;
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
