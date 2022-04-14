import { ALLCOINS as COINS } from '@cypherock/communication';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import InputAdornment from '@material-ui/core/InputAdornment';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SearchIcon from '@material-ui/icons/Search';
import UnfoldMoreIcon from '@material-ui/icons/UnfoldMore';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import Input from '../../../../designSystem/designComponents/input/input';
import { useHistory, useWalletData } from '../../../../store/hooks';
import {
  CurrentCoinContext,
  useAddCoinContext,
  useConnection,
  useSelectedWallet
} from '../../../../store/provider';
import Analytics from '../../../../utils/analytics';

import AddCoinForm from './addCoin';
import EthereumOneCoin from './EthereumOneCoin';
import OneCoin from './OneCoin';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    search: {
      width: '50%',
      marginRight: '1rem'
    },
    button: {
      width: '100%',
      height: '100%',
      textTransform: 'none',
      background: 'rgba(255,255,255,0.05)'
    },
    walletButtons: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: `1px solid ${theme.palette.primary.light}`,
      borderRadius: 5,
      height: '2.5rem',
      width: '9rem'
    },
    icon: {
      margin: 0
    },
    coinDataContainer: {
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
    divider: {
      backgroundColor: theme.palette.primary.light,
      height: '50%',
      margin: `0px 10px`
    },
    totalFilter: {
      marginTop: 50,
      borderBottom: `1px solid ${theme.palette.primary.light}`
    },
    header: {
      marginTop: 30,
      width: 'calc(100% - 18px)'
    },
    alignCenterRight: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end'
    },
    headerButtons: {
      padding: '0px',
      color: theme.palette.grey[500],
      textTransform: 'none',
      fontSize: '1rem'
    }
  })
);

interface WalletViewProps {
  openAddCoinForm?: boolean;
}

const WalletView: React.FC<WalletViewProps> = ({ openAddCoinForm }) => {
  const classes = useStyles();
  const theme = useTheme();

  const {
    coinData,
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
      setCurrentWalletId(selectedWallet.walletId);
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  useEffect(() => {
    if (openAddCoinForm) {
      setAddCoinFormOpen(true);
    }
  }, [openAddCoinForm]);

  return (
    <Grid container>
      <AddCoinForm
        handleClose={handleAddCoinFormClose}
        coinsPresent={coinsPresent}
      />
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
              Please add a coin in your wallet.
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
            placeholder="Search Your Coin"
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              )
            }}
            className={classes.search}
            size="small"
            styleType="light"
          />
          <div className={classes.walletButtons}>
            <Button
              variant="text"
              disableRipple
              className={classes.button}
              startIcon={<AddCircleIcon style={{ color: '#84633E' }} />}
              onClick={handleAddCoinFormOpen}
            >
              ADD COIN
            </Button>
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
                const coinObj = COINS[coin.coin];
                return (
                  (coinObj &&
                    coinObj.name
                      .toUpperCase()
                      .includes(search.toUpperCase())) ||
                  coin.coin.toUpperCase().includes(search.toUpperCase())
                );
              })
              .map(coin => {
                const coinObj = COINS[coin.coin];
                return (
                  <CurrentCoinContext.Provider
                    value={{ coinDetails: coin }}
                    key={coin.coin}
                  >
                    {coinObj && coinObj.isEth ? (
                      <EthereumOneCoin
                        initial={coin.coin.toUpperCase()}
                        name={coinObj.name}
                        holding={coin.displayBalance}
                        value={coin.displayValue}
                        price={coin.displayPrice}
                        decimal={coinObj.decimal}
                        isEmpty={coin.isEmpty}
                        deleteCoin={deleteCoinByXpub}
                        deleteHistory={deleteCoinHistory}
                        walletId={selectedWallet.walletId}
                      />
                    ) : (
                      <OneCoin
                        initial={coin.coin.toUpperCase()}
                        name={coinObj ? coinObj.name : ''}
                        holding={coin.displayBalance}
                        value={coin.displayValue}
                        price={coin.displayPrice}
                        decimal={coinObj.decimal}
                        isEmpty={coin.isEmpty}
                        deleteCoin={deleteCoinByXpub}
                        deleteHistory={deleteCoinHistory}
                        walletId={selectedWallet.walletId}
                      />
                    )}
                  </CurrentCoinContext.Provider>
                );
              })}
          </Grid>
        </Grid>
      </div>
    </Grid>
  );
};

WalletView.propTypes = {
  openAddCoinForm: PropTypes.bool
};

WalletView.defaultProps = {
  openAddCoinForm: false
};

export default WalletView;
