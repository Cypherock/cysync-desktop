import { CoinGroup, COINS } from '@cypherock/communication';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import { styled, useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import Input from '../../../../designSystem/designComponents/input/input';
import { useHistory, useWalletData } from '../../../../store/hooks';
import {
  CurrentCoinContext,
  useAddCoinContext,
  useConnection,
  useSelectedWallet,
  useWalletConnect
} from '../../../../store/provider';
import Analytics from '../../../../utils/analytics';

import AddCoinForm from './addCoin';
import allCoins from './addCoin/coins';
import EthereumOneCoin from './EthereumOneCoin';
import NearOneCoin from './NearOneCoin';
import OneCoin from './OneCoin';
import WalletConnect from './walletconnect';

const PREFIX = 'Wallet';

const classes = {
  search: `${PREFIX}-search`,
  button: `${PREFIX}-button`,
  walletButtons: `${PREFIX}-walletButtons`,
  icon: `${PREFIX}-icon`,
  coinDataContainer: `${PREFIX}-coinDataContainer`,
  divider: `${PREFIX}-divider`,
  totalFilter: `${PREFIX}-totalFilter`,
  header: `${PREFIX}-header`,
  alignCenterRight: `${PREFIX}-alignCenterRight`,
  headerButtons: `${PREFIX}-headerButtons`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.search}`]: {
    width: '50%',
    marginRight: '1rem'
  },
  [`& .${classes.button}`]: {
    width: '100%',
    height: '100%',
    textTransform: 'none',
    background: 'rgba(255,255,255,0.05)',
    color: theme.palette.text.primary
  },
  [`& .${classes.walletButtons}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: `1px solid ${theme.palette.primary.light}`,
    borderRadius: 5,
    height: '2.5rem',
    width: '9rem'
  },
  [`& .${classes.icon}`]: {
    margin: 0
  },
  [`& .${classes.coinDataContainer}`]: {
    // 290px is coverd by the rest of the elements on the screen
    maxHeight: 'calc(100vh - 290px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
      width: '8px',
      background: theme.palette.primary.light
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.text.secondary
    }
  },
  [`& .${classes.divider}`]: {
    backgroundColor: theme.palette.primary.light,
    height: '50%',
    margin: `0px 10px`
  },
  [`& .${classes.totalFilter}`]: {
    marginTop: 50,
    borderBottom: `1px solid ${theme.palette.primary.light}`
  },
  [`& .${classes.header}`]: {
    marginTop: 30,
    width: 'calc(100% - 18px)'
  },
  [`& .${classes.alignCenterRight}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  [`& .${classes.headerButtons}`]: {
    padding: '0px',
    color: theme.palette.grey[500],
    textTransform: 'none',
    fontSize: '1rem'
  }
}));

interface WalletViewProps {
  openAddCoinForm?: boolean;
  addCoinOpened?: () => void;
}

const WalletView: React.FC<WalletViewProps> = ({
  openAddCoinForm,
  addCoinOpened
}) => {
  const theme = useTheme();

  const {
    coinData,
    isLoading,
    setCurrentWalletId,
    coinsPresent,
    deleteCoinByXpub,
    refreshCoins,
    sortIndex,
    setSortIndex,
    sortCoinsByIndex
  } = useWalletData();

  const { deleteCoinHistory } = useHistory();

  const { selectedWallet } = useSelectedWallet();

  useEffect(() => {
    if (selectedWallet) {
      setCurrentWalletId(selectedWallet._id);
    }
  }, [selectedWallet]);

  const {
    coinAdder,
    setAddCoinFormOpen,
    setActiveStep,
    setXpubMissing,
    activeStep
  } = useAddCoinContext();

  const { deviceConnection, beforeNetworkAction } = useConnection();

  const handleAddCoinFormOpen = () => {
    if (beforeNetworkAction()) {
      setXpubMissing(false);
      setActiveStep(0);
      setAddCoinFormOpen(true);
    }
  };

  const handleAddCoinFormClose = (abort?: boolean) => {
    if (abort && deviceConnection) {
      coinAdder.cancelAddCoin(deviceConnection);
    }
    Analytics.Instance.event(
      Analytics.Categories.ADD_COIN,
      Analytics.Actions.CLOSED,
      activeStep.toString()
    );
    setAddCoinFormOpen(false);
    coinAdder.resetHooks();
    refreshCoins();
  };

  const [noCoinOverlay, setNoCoinOverlay] = React.useState(
    coinData.length === 0
  );

  useEffect(() => {
    sortCoinsByIndex(sortIndex);

    setNoCoinOverlay(coinData.length === 0);
  }, [coinData.length, sortIndex, selectedWallet]);

  const [search, setSearch] = useState('');
  const [wcuri, setwcuri] = useState('');
  const { openDialogBox } = useWalletConnect();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  useEffect(() => {
    if (openAddCoinForm) {
      setAddCoinFormOpen(true);
      addCoinOpened();
    }
  }, [openAddCoinForm]);

  const canAddMoreCoins = allCoins.length !== coinsPresent.length;

  const getMainContent = () => {
    if (isLoading) {
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
    }

    return (
      <>
        {noCoinOverlay && (
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
                Add a coin in your wallet.
              </Typography>
              <Button
                variant="text"
                disableRipple
                className={classes.button}
                style={{
                  width: 'max-content',
                  padding: '0.5rem 2rem'
                }}
                startIcon={<AddCircleIcon style={{ color: '#84633E' }} />}
                onClick={handleAddCoinFormOpen}
              >
                ADD COIN
              </Button>
            </div>
          </div>
        )}
        <Grid container>
          <Grid item xs={5}>
            <Typography
              variant="h2"
              style={{ color: theme.palette.secondary.dark }}
            >
              {selectedWallet.name}
            </Typography>
          </Grid>
          <Grid
            item
            xs={7}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end'
            }}
          >
            <Input
              placeholder="WalletConnect uri"
              value={wcuri}
              onChange={openDialogBox}
              className={classes.search}
              size="small"
              styleType="light"
            />
            <Input
              placeholder="Search Your Coin"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      style={{ color: theme.palette.text.secondary }}
                    />
                  </InputAdornment>
                )
              }}
              className={classes.search}
              size="small"
              styleType="light"
            />
            <div className={classes.walletButtons}>
              {!canAddMoreCoins ? (
                <Tooltip title="All coins are already added">
                  <span style={{ width: '100%', height: '100%' }}>
                    <Button
                      variant="text"
                      disableRipple
                      className={classes.button}
                      startIcon={<AddCircleIcon style={{ color: '#84633E' }} />}
                      onClick={handleAddCoinFormOpen}
                      disabled={true}
                    >
                      ADD COIN
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button
                  variant="text"
                  disableRipple
                  className={classes.button}
                  startIcon={<AddCircleIcon style={{ color: '#84633E' }} />}
                  onClick={handleAddCoinFormOpen}
                >
                  ADD COIN
                </Button>
              )}
            </div>
          </Grid>
        </Grid>
        <div style={{ width: '100%' }}>
          <Grid container className={classes.totalFilter}>
            <Grid item xs={6}>
              <Typography color="textPrimary">{`Total Coins - ${coinData.length}`}</Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid container className={classes.header}>
              <Grid item xs={3}>
                <Button
                  className={classes.headerButtons}
                  style={{ marginLeft: '1.5rem' }}
                  onClick={() => {
                    if (sortIndex === 3) {
                      setSortIndex(2);
                    } else {
                      setSortIndex(3);
                    }
                  }}
                  startIcon={
                    sortIndex === 3 ? (
                      <ExpandMoreIcon color="secondary" />
                    ) : sortIndex === 2 ? (
                      <ExpandLessIcon color="secondary" />
                    ) : (
                      <UnfoldMoreIcon />
                    )
                  }
                >
                  <Typography color="textSecondary">Coin</Typography>
                </Button>
              </Grid>
              <Grid item xs={2}>
                <Button
                  className={classes.headerButtons}
                  onClick={() => {
                    if (sortIndex === 4) {
                      setSortIndex(5);
                    } else {
                      setSortIndex(4);
                    }
                  }}
                  startIcon={
                    sortIndex === 4 ? (
                      <ExpandMoreIcon color="secondary" />
                    ) : sortIndex === 5 ? (
                      <ExpandLessIcon color="secondary" />
                    ) : (
                      <UnfoldMoreIcon />
                    )
                  }
                >
                  <Typography color="textSecondary">Holding</Typography>
                </Button>
              </Grid>
              <Grid item xs={2}>
                <Button
                  className={classes.headerButtons}
                  onClick={() => {
                    if (sortIndex === 0) {
                      setSortIndex(1);
                    } else {
                      setSortIndex(0);
                    }
                  }}
                  startIcon={
                    sortIndex === 0 ? (
                      <ExpandMoreIcon color="secondary" />
                    ) : sortIndex === 1 ? (
                      <ExpandLessIcon color="secondary" />
                    ) : (
                      <UnfoldMoreIcon />
                    )
                  }
                >
                  <Typography color="textSecondary">Value</Typography>
                </Button>
              </Grid>
              <Grid item xs={2}>
                <Button
                  className={classes.headerButtons}
                  onClick={() => {
                    if (sortIndex === 6) {
                      setSortIndex(7);
                    } else {
                      setSortIndex(6);
                    }
                  }}
                  startIcon={
                    sortIndex === 6 ? (
                      <ExpandMoreIcon color="secondary" />
                    ) : sortIndex === 7 ? (
                      <ExpandLessIcon color="secondary" />
                    ) : (
                      <UnfoldMoreIcon />
                    )
                  }
                >
                  <Typography color="textSecondary">Price</Typography>
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button className={classes.headerButtons} disabled>
                  <Typography color="textSecondary">Actions</Typography>
                </Button>
              </Grid>
            </Grid>
            <Grid container className={classes.coinDataContainer}>
              {coinData
                .filter(coin => {
                  const coinObj = COINS[coin.slug];
                  return (
                    (coinObj &&
                      coinObj.name
                        .toUpperCase()
                        .includes(search.toUpperCase())) ||
                    coin.slug.toUpperCase().includes(search.toUpperCase())
                  );
                })
                .map(coin => {
                  const coinObj = COINS[coin.slug];
                  return (
                    <CurrentCoinContext.Provider
                      value={{ coinDetails: coin }}
                      key={coin.slug}
                    >
                      {coinObj && coinObj.group === CoinGroup.Ethereum ? (
                        <EthereumOneCoin
                          initial={coin.slug.toUpperCase()}
                          name={coinObj.name}
                          holding={coin.displayBalance}
                          value={coin.displayValue}
                          price={coin.displayPrice}
                          decimal={coinObj.decimal}
                          isEmpty={coin.isEmpty}
                          deleteCoin={deleteCoinByXpub}
                          deleteHistory={deleteCoinHistory}
                          walletId={selectedWallet._id}
                          sortIndex={sortIndex}
                        />
                      ) : coinObj && coinObj.group === CoinGroup.Near ? (
                        <NearOneCoin
                          initial={coin.slug.toUpperCase()}
                          name={coinObj.name}
                          holding={coin.displayBalance}
                          value={coin.displayValue}
                          price={coin.displayPrice}
                          decimal={coinObj.decimal}
                          isEmpty={coin.isEmpty}
                          deleteCoin={deleteCoinByXpub}
                          deleteHistory={deleteCoinHistory}
                          walletId={selectedWallet._id}
                          sortIndex={sortIndex}
                        />
                      ) : (
                        <OneCoin
                          initial={coin.slug.toUpperCase()}
                          name={coinObj ? coinObj.name : ''}
                          holding={coin.displayBalance}
                          value={coin.displayValue}
                          price={coin.displayPrice}
                          decimal={coinObj.decimal}
                          isEmpty={coin.isEmpty}
                          deleteCoin={deleteCoinByXpub}
                          deleteHistory={deleteCoinHistory}
                          walletId={selectedWallet._id}
                        />
                      )}
                    </CurrentCoinContext.Provider>
                  );
                })}
            </Grid>
          </Grid>
        </div>
      </>
    );
  };

  return (
    <Root container>
      <AddCoinForm
        handleClose={handleAddCoinFormClose}
        coinsPresent={coinsPresent}
      />
      <WalletConnect />
      {getMainContent()}
    </Root>
  );
};

WalletView.propTypes = {
  openAddCoinForm: PropTypes.bool,
  addCoinOpened: PropTypes.func
};

WalletView.defaultProps = {
  openAddCoinForm: false,
  addCoinOpened: undefined
};

export default WalletView;
