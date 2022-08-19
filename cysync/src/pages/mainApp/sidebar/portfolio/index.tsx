import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
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

  const handleMenuItemChange = (selectedIndex: number) => {
    setIndex(selectedIndex);
    if (selectedIndex === 0) {
      setCoinIndex(0);
      setCurrentWallet('');
    } else {
      setCoinIndex(0);
      setCurrentWallet(allWallets[selectedIndex - 1]._id);
    }
  };

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (allWallets[0]._id === '') setOpen(true);
    else {
      setCurrentWallet(allWallets[0]._id);
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
    navigate(Routes.wallet.index);
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
              Import a wallet from Cypherock X1
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
          handleMenuItemSelectionChange={handleMenuItemChange}
          index={index}
          bg={false}
          disabled={isLoading}
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
