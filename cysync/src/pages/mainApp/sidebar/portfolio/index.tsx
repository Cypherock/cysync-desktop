import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import lodash from 'lodash';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import DropMenu from '../../../../designSystem/designComponents/menu/DropMenu';
import { usePortfolio } from '../../../../store/hooks';
import { useWallets } from '../../../../store/provider';
import Analytics from '../../../../utils/analytics';
import logger from '../../../../utils/logger';

import Charts from './charts';
import CoinAllocation from './coins';
import { DeprecationNotice } from './dialogs';

const Portfolio = () => {
  const { allWallets } = useWallets();

  const theme = useTheme();
  const navigate = useNavigate();

  const [index, setIndex] = React.useState(0);
  const {
    currentWallet,
    isLoading,
    setCurrentWallet,
    coins,
    total,
    sortIndex,
    setSortIndex,
    coinHolding,
    coinList,
    oldTotalPrice,
    hasCoins,
    timeActiveButton,
    setTimeActive,
    coinIndex,
    setCoinIndex,
    sinceText,
    sinceLastTotalPrice,
    series
  } = usePortfolio();

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.PORTFOLIO);
    logger.info('In portfolio screen');
  }, []);

  const handleWalletMenuItemChange = (selectedIndex: number) => {
    setIndex(selectedIndex);
    if (selectedIndex === 0) {
      setCoinIndex(0);
      setCurrentWallet('');
    } else {
      setCoinIndex(0);
      setCurrentWallet(allWallets[selectedIndex - 1]._id);
    }
  };

  const handleCoinMenuItemChange = (selectedIndex: number) => {
    setCoinIndex(selectedIndex);
  };

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (allWallets[0]._id === '') setOpen(true);
    else {
      setOpen(false);
    }
  }, [allWallets]);

  const onAddCoin = React.useCallback((walletId: string) => {
    navigate(`${Routes.wallet.index}/${walletId}`);
  }, []);

  const setSortIndexProxy = React.useCallback((val: number) => {
    setSortIndex(val);
  }, []);

  const onAddWallet = () => {
    setOpen(false);
    navigate(Routes.wallet.index + '?openImportWalletForm=true');
  };

  return (
    <Grid
      container
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {open && (
        <div
          style={{
            width: '80%',
            height: '88%',
            position: 'absolute',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            display: 'flex'
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '101%',
              height: '101%',
              backdropFilter: 'blur(5px)'
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              zIndex: 100
            }}
          >
            <Typography
              variant="h2"
              color="textPrimary"
              style={{ marginBottom: '2rem' }}
            >
              Import a wallet account from X1 wallet
            </Typography>
            <CustomButton
              style={{ padding: '0.5rem 2rem ' }}
              onClick={onAddWallet}
            >
              Import Wallet
            </CustomButton>
          </div>
        </div>
      )}
      <DeprecationNotice />

      <Grid
        container
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: '1rem'
        }}
      >
        <Typography
          variant="h2"
          style={{
            color: theme.palette.secondary.dark,
            marginRight: '2rem'
          }}
        >
          Portfolio
        </Typography>
        <DropMenu
          options={['All Wallets', ...allWallets.map(wallet => wallet.name)]}
          handleMenuItemSelectionChange={handleWalletMenuItemChange}
          index={index}
          bg={false}
          disabled={isLoading}
          style={{ marginRight: '10px' }}
        />
        <DropMenu
          options={coinList.map(item =>
            item
              .split(' ')
              .map(e => lodash.capitalize(e))
              .join(' ')
          )}
          handleMenuItemSelectionChange={handleCoinMenuItemChange}
          index={coinIndex}
          bg={false}
        />
      </Grid>
      <Charts
        coinHolding={coinHolding}
        oldTotalPrice={oldTotalPrice}
        coinList={coinList}
        hasCoins={hasCoins}
        timeActiveButton={timeActiveButton}
        setTimeActive={setTimeActive}
        coinIndex={coinIndex}
        setCoinIndex={setCoinIndex}
        sinceText={sinceText}
        sinceLastTotalPrice={sinceLastTotalPrice}
        series={series}
        isLoading={isLoading}
      />
      <CoinAllocation
        currentWallet={currentWallet}
        coins={coins}
        total={total}
        sortIndex={sortIndex}
        setSortIndex={setSortIndexProxy}
        handleRedirecttoAddCoin={onAddCoin}
        isLoading={isLoading}
      />
    </Grid>
  );
};

export default Portfolio;
