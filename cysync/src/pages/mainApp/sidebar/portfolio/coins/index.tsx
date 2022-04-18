import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import UnfoldMoreIcon from '@material-ui/icons/UnfoldMore';
import BigNumber from 'bignumber.js';
import { isEqual } from 'lodash';
import React from 'react';

import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import { UsePortfolioValues } from '../../../../../store/hooks';

import OneCoin from './OneCoin';

const useStyles = makeStyles({
  root: {
    marginTop: '1rem'
  },
  coinMenuWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  headerButtons: {
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
}

const PortfolioCoins = ({
  currentWallet,
  coins,
  total,
  sortIndex,
  setSortIndex,
  handleRedirecttoAddCoin
}: Props) => {
  const classes = useStyles();

  return (
    <Grid container className={classes.root}>
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
                <UnfoldMoreIcon />
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
                <UnfoldMoreIcon />
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
                <UnfoldMoreIcon />
              )
            }
            style={{ marginLeft: '-0.5rem' }}
          >
            <Typography color="textSecondary">Portfolio</Typography>
          </Button>
        </Grid>
      </Grid>
      {coins.length > 0 ? (
        coins.map((data, i: number) => {
          return (
            <OneCoin
              coinInitial={data.name}
              coinValue={data.value}
              coinPrice={new BigNumber(data.price).toFixed(2)}
              coinPortfolio={`${(
                new BigNumber(data.value).dividedBy(total).multipliedBy(100) ||
                0
              ).toFixed(1)}%`}
              coinHolding={data.balance}
              decimal={data.decimal}
              key={data.name}
              index={i}
            />
          );
        })
      ) : (
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
          Add Coins
        </CustomButton>
      )}
    </Grid>
  );
};

export default React.memo(PortfolioCoins, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
);
