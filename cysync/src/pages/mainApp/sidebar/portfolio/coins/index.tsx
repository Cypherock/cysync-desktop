import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import BigNumber from 'bignumber.js';
import { isEqual } from 'lodash';
import React from 'react';

import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import { CoinDetails, UsePortfolioValues } from '../../../../../store/hooks';

import OneCoin from './OneCoin';

const PREFIX = 'index';

const classes = {
  root: `${PREFIX}-root`,
  coinMenuWrapper: `${PREFIX}-coinMenuWrapper`,
  headerButtons: `${PREFIX}-headerButtons`
};

const StyledGrid = styled(Grid)({
  [`&.${classes.root}`]: {
    marginTop: '1rem'
  },
  [`& .${classes.coinMenuWrapper}`]: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  [`& .${classes.headerButtons}`]: {
    padding: '0px',
    textTransform: 'none',
    fontSize: '1rem'
  }
});

export interface Props {
  currentWallet: UsePortfolioValues['currentWallet'];
  coins: UsePortfolioValues['coins'];
  total: UsePortfolioValues['total'];
  sortIndex: UsePortfolioValues['sortIndex'];
  setSortIndex: UsePortfolioValues['setSortIndex'];
  handleRedirecttoAddCoin: (walletId: string) => void;
  isLoading: boolean;
}

const PortfolioCoins = ({
  currentWallet,
  coins,
  total,
  sortIndex,
  setSortIndex,
  handleRedirecttoAddCoin,
  isLoading
}: Props) => {
  const calcCoinPortfolio = (coin: CoinDetails) => {
    if (total > 0) {
      const val = (
        new BigNumber(coin.value).dividedBy(total).multipliedBy(100) || 0
      ).toFixed(1);

      return `${val}%`;
    }

    return '- -';
  };

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

    if (coins.length > 0) {
      return coins.map((data, i: number) => {
        return (
          <OneCoin
            coinInitial={data.name}
            coinValue={data.value}
            coinPrice={data.price}
            coinPortfolio={calcCoinPortfolio(data)}
            coinHolding={data.balance}
            decimal={data.decimal}
            key={data.name}
            index={i}
            parentCoinId={data.parentCoinId}
            coinId={data.coinId}
          />
        );
      });
    }
    return (
      <CustomButton
        fullWidth
        style={{
          textTransform: 'none',
          margin: '1rem 0rem',
          padding: '0.8rem 0rem',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0)'
        }}
        variant="outlined"
        onClick={() => {
          handleRedirecttoAddCoin(currentWallet);
        }}
      >
        Add Account
      </CustomButton>
    );
  };

  return (
    <StyledGrid container className={classes.root}>
      <Grid container>
        <Grid item xs={6}>
          <Typography
            variant="h5"
            color="textPrimary"
            style={{ margin: '1rem 0rem' }}
          >
            {`Coin Allocation - ${coins.length}`}
          </Typography>
        </Grid>
      </Grid>
      <Grid container>
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
                <UnfoldMoreIcon style={{ color: '#ccc' }} />
              )
            }
          >
            <Typography color="textSecondary">Coin</Typography>
          </Button>
        </Grid>
        <Grid item xs={3}>
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
                <UnfoldMoreIcon style={{ color: '#ccc' }} />
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
                <UnfoldMoreIcon style={{ color: '#ccc' }} />
              )
            }
            style={{ marginLeft: '-0.2rem' }}
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
                <UnfoldMoreIcon style={{ color: '#ccc' }} />
              )
            }
            style={{ marginLeft: '-0.3rem' }}
          >
            <Typography color="textSecondary">Price</Typography>
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            className={classes.headerButtons}
            onClick={() => {
              if (sortIndex === 8) {
                setSortIndex(9);
              } else {
                setSortIndex(8);
              }
            }}
            startIcon={
              sortIndex === 8 ? (
                <ExpandMoreIcon color="secondary" />
              ) : sortIndex === 9 ? (
                <ExpandLessIcon color="secondary" />
              ) : (
                <UnfoldMoreIcon style={{ color: '#ccc' }} />
              )
            }
            style={{ marginLeft: '-0.5rem' }}
          >
            <Typography color="textSecondary">Portfolio</Typography>
          </Button>
        </Grid>
      </Grid>
      {getMainContent()}
    </StyledGrid>
  );
};

export default React.memo(PortfolioCoins, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
);
