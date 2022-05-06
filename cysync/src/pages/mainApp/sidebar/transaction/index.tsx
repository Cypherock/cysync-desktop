import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import BigNumber from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AutoSizer, List } from 'react-virtualized';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../../designSystem/designComponents/icons/Icon';
import Input from '../../../../designSystem/designComponents/input/input';
import DropMenu from '../../../../designSystem/designComponents/menu/DropMenu';
import ICONS from '../../../../designSystem/iconGroups/iconConstants';
import {
  DisplayTransaction,
  useDebouncedFunction,
  useTransactionData
} from '../../../../store/hooks';
import { useWallets } from '../../../../store/provider';
import Analytics from '../../../../utils/analytics';
import logger from '../../../../utils/logger';

import OneTransaction from './OneTransaction';
import TransactionDialog from './TransactionDialog';

const PREFIX = 'Transaction';

const classes = {
  head: `${PREFIX}-head`,
  transactionsInfo: `${PREFIX}-transactionsInfo`,
  transactionsData: `${PREFIX}-transactionsData`,
  header: `${PREFIX}-header`,
  alignCenterRight: `${PREFIX}-alignCenterRight`,
  loaderContainer: `${PREFIX}-loaderContainer`,
  headerButtons: `${PREFIX}-headerButtons`
};

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.head}`]: {
    height: '5rem'
  },

  [`& .${classes.transactionsInfo}`]: {
    borderBottom: `1px solid ${theme.palette.text.secondary}`,
    marginTop: 30
  },

  [`& .${classes.transactionsData}`]: {
    // 300px is coverd by the rest of the elements on the screen
    height: 'calc(100vh - 300px)'
  },

  [`& .${classes.header}`]: {
    display: 'flex',
    marginTop: 30,
    width: 'calc(100% - 18px)'
  },

  [`& .${classes.alignCenterRight}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },

  [`& .${classes.loaderContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '4rem'
  },

  [`& .${classes.headerButtons}`]: {
    padding: '0px',
    color: theme.palette.grey[500],
    textTransform: 'none',
    fontSize: '1rem'
  }
}));

const Transaction = () => {
  const location = useLocation();

  const {
    setDays,
    isLoading,
    setIsLoading,
    showTxn,
    setShowTxn,
    allTxn,
    setCurrentWallet,
    walletIndex,
    coinIndex,
    setCoinIndex,
    setCurrentCoin,
    setWalletIndex,
    sortIndex,
    setSortIndex,
    onInitialSetupDone,
    isInitialSetupDone
  } = useTransactionData();

  const { allWallets, allCoins } = useWallets();

  const theme = useTheme();
  const [weekIndex, setWeekIndex] = React.useState(3);
  const [totalTransactions, setTotalTransactions] = useState(allTxn.length);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<DisplayTransaction[]>([]);

  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.LAST_TRANSACTIONS);
    logger.info('In last transactions');
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const coin = query.get('coin');
    const walletId = query.get('wallet');

    if (coin) {
      const index = allCoins.findIndex(
        elem => elem.abbr.toLowerCase() === coin.toLowerCase()
      );
      if (index !== -1) {
        setCurrentCoin(coin);
        setCoinIndex(index + 1);
      }
    }

    if (walletId) {
      const index = allWallets.findIndex(elem => elem.id === walletId);
      if (index !== -1) {
        setCurrentWallet(walletId);
        setWalletIndex(index + 1);
      }
    }

    if (!isInitialSetupDone) {
      onInitialSetupDone();
    }
  }, [location.search]);

  useEffect(() => {
    if (search) {
      setTotalTransactions(searchResults.length);
    } else {
      setTotalTransactions(allTxn.length);
    }
  }, [allTxn, searchResults, search]);

  const handleMenuItemWeekSelectionChange = (index: number) => {
    setWeekIndex(index);

    if (index === 0) setDays(7);
    else if (index === 1) setDays(30);
    else if (index === 2) setDays(365);
    else setDays(-1);
  };

  const handleSearch = () => {
    const results = allTxn.filter(txn => {
      if (txn.coin && txn.coin.toLowerCase().indexOf(search) !== -1) {
        return true;
      }

      if (txn.coinName && txn.coinName.toLowerCase().indexOf(search) !== -1) {
        return true;
      }

      if (txn.hash && txn.hash.toLowerCase().indexOf(search) !== -1) {
        return true;
      }

      return false;
    });

    setSearchResults(results);
    setIsLoading(false);
  };

  const debouncedhandleSearch = useDebouncedFunction(handleSearch, 800);

  useEffect(() => {
    setIsLoading(true);
    debouncedhandleSearch();
  }, [search]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value.toLowerCase());
  };

  const handleWalletChange = (selectedIndex: number) => {
    setWalletIndex(selectedIndex);
    if (selectedIndex === 0) setCurrentWallet(undefined);
    else setCurrentWallet(allWallets[selectedIndex - 1].id);
  };

  const handleCoinChange = (selectedIndex: number) => {
    setCoinIndex(selectedIndex);
    if (selectedIndex === 0) setCurrentCoin(undefined);
    else setCurrentCoin(allCoins[selectedIndex - 1].abbr);
  };

  const renderTxnRow = ({ index, key, style }: any) => {
    const data = search ? searchResults[index] : allTxn[index];
    return (
      <div key={key} style={style}>
        <OneTransaction
          key={data._id}
          date={new Date(data.confirmed).toLocaleDateString()}
          time={new Date(data.confirmed).toLocaleTimeString()}
          walletName={data.walletName}
          initial={data.coin.toUpperCase()}
          amount={data.displayAmount}
          value={new BigNumber(data.displayValue).toFixed(2)}
          result={data.sentReceive}
          decimal={data.coinDecimal}
          address={data.hash}
          onShowMore={() => setShowTxn(data)}
          status={
            data.status === 1
              ? 'SUCCESS'
              : data.status === 0
              ? 'PENDING'
              : 'FAILED'
          }
        />
      </div>
    );
  };

  const getMainTxnContent = () => {
    if (isLoading) {
      return (
        <Grid container>
          <Grid item xs={12}>
            <div className={classes.loaderContainer}>
              <CircularProgress color="secondary" />
            </div>
          </Grid>
        </Grid>
      );
    }
    if (totalTransactions > 0) {
      return (
        <div style={{ width: '100%' }}>
          <Grid item xs={12} className={classes.header}>
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
                <Typography color="textSecondary">Time</Typography>
              </Button>
            </Grid>
            <Grid item xs={1}>
              <Typography color="textSecondary">Wallet</Typography>
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
                <Typography color="textSecondary">Amount</Typography>
              </Button>
            </Grid>
            <Grid item xs={1}>
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
                <Typography color="textSecondary">Value</Typography>
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Typography color="textSecondary" style={{ marginLeft: '17px' }}>
                Result
              </Typography>
            </Grid>
            <Grid item xs={1}>
              <Typography color="textSecondary" style={{ marginLeft: '5px' }}>
                Status
              </Typography>
            </Grid>
          </Grid>
          <Grid container className={classes.transactionsData}>
            <AutoSizer>
              {({ height, width }: any) => (
                <List
                  width={width}
                  height={height}
                  rowHeight={80}
                  rowRenderer={renderTxnRow}
                  rowCount={search ? searchResults.length : allTxn.length}
                  overscanRowCount={3}
                />
              )}
            </AutoSizer>
          </Grid>
        </div>
      );
    }

    return (
      <Grid container>
        <Grid item xs={12}>
          <div className={classes.loaderContainer}>
            <Typography variant="subtitle1" color="textSecondary">
              No Transactions available.
            </Typography>
          </div>
        </Grid>
      </Grid>
    );
  };

  return (
    <StyledGrid container>
      <DialogBox
        maxWidth={false}
        open={showTxn !== null}
        handleClose={() => setShowTxn(null)}
        isClosePresent
        restComponents={
          <TransactionDialog
            txn={
              showTxn
                ? {
                    hash: showTxn.hash,
                    total: showTxn.total,
                    fees: showTxn.fees,
                    amount: showTxn.amount,
                    confirmations: showTxn.confirmations,
                    walletId: showTxn.walletId,
                    walletName: showTxn.walletName,
                    coin: showTxn.coin,
                    ethCoin: showTxn.ethCoin,
                    status: showTxn.status,
                    sentReceive: showTxn.sentReceive,
                    confirmed: showTxn.confirmed,
                    blockHeight: showTxn.blockHeight,
                    displayAmount: showTxn.displayAmount,
                    displayFees: showTxn.displayFees,
                    displayTotal: showTxn.displayTotal,
                    displayValue: showTxn.displayValue,
                    isErc20: showTxn.isErc20,
                    coinName: showTxn.coinName,
                    coinDecimal: showTxn.coinDecimal,
                    inputs: showTxn.inputs,
                    outputs: showTxn.outputs
                  }
                : null
            }
          />
        }
      />
      <Grid container className={classes.head}>
        <Grid
          item
          xs={6}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '2.5rem'
          }}
        >
          <Typography
            variant="h2"
            style={{
              color: theme.palette.secondary.dark,
              marginRight: '20px'
            }}
          >
            Transactions
          </Typography>
          <DropMenu
            options={['All Wallets', ...allWallets.map(wallet => wallet.name)]}
            handleMenuItemSelectionChange={handleWalletChange}
            index={walletIndex}
            bg={false}
            style={{ marginRight: '10px' }}
          />
          <DropMenu
            options={['All Coins', ...allCoins.map(coin => coin.name)]}
            handleMenuItemSelectionChange={handleCoinChange}
            index={coinIndex}
            bg={false}
          />
        </Grid>
        <Grid
          item
          xs={6}
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Input
            style={{ width: '70%' }}
            placeholder="Search Your Coins"
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              )
            }}
            size="small"
            styleType="light"
          />
        </Grid>
      </Grid>
      <Grid container className={classes.transactionsInfo}>
        <Grid item xs={7} style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Typography variant="body1" color="textSecondary">
            {`Total Transactions - ${totalTransactions}`}
          </Typography>
        </Grid>
        <Grid
          item
          xs={5}
          className={classes.alignCenterRight}
          style={{ justifyContent: 'flex-end' }}
        >
          <DropMenu
            options={['Week', 'Month', 'Year', 'All']}
            index={weekIndex}
            handleMenuItemSelectionChange={handleMenuItemWeekSelectionChange}
            startAdornment={
              <Icon
                icon={ICONS.funnel}
                viewBox="0 0 10 12"
                color={theme.palette.secondary.main}
                style={{ margin: '0px 5px' }}
              />
            }
          />
        </Grid>
      </Grid>
      {getMainTxnContent()}
    </StyledGrid>
  );
};

export default Transaction;
