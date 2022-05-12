import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import React from 'react';

import { UsePortfolioValues } from '../../../../../store/hooks';
import formatDisplayAmount from '../../../../../utils/formatDisplayAmount';

import DonutChart from './DonutChart';
import LineChart from './LineChart';

const PREFIX = 'PortfolioChart';

const classes = {
  root: `${PREFIX}-root`,
  left: `${PREFIX}-left`,
  right: `${PREFIX}-right`
};

const Root = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    border: `1px solid ${theme.palette.primary.light}`,
    borderRadius: '1rem',
    padding: '0.5rem 0rem'
  },
  [`& .${classes.left}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.right}`]: {
    borderLeft: `1px solid ${theme.palette.primary.light}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

export interface Props {
  coinHolding: UsePortfolioValues['coinHolding'];
  oldTotalPrice: UsePortfolioValues['oldTotalPrice'];
  coinList: UsePortfolioValues['coinList'];
  hasCoins: UsePortfolioValues['hasCoins'];
  timeActiveButton: UsePortfolioValues['timeActiveButton'];
  setTimeActive: UsePortfolioValues['setTimeActive'];
  coinIndex: UsePortfolioValues['coinIndex'];
  setCoinIndex: UsePortfolioValues['setCoinIndex'];
  sinceLastTotalPrice: UsePortfolioValues['sinceLastTotalPrice'];
  sinceText: UsePortfolioValues['sinceText'];
  series: UsePortfolioValues['series'];
}

const PortfolioCharts = ({
  coinHolding,
  coinList,
  hasCoins,
  timeActiveButton,
  setTimeActive,
  coinIndex,
  setCoinIndex,
  sinceLastTotalPrice,
  sinceText,
  series
}: Props) => {
  const theme = useTheme();

  return (
    <Root container className={classes.root}>
      <Grid item xs={9} className={classes.left}>
        <LineChart
          coinList={coinList}
          timeActiveButton={timeActiveButton}
          setTimeActive={setTimeActive}
          coinIndex={coinIndex}
          setCoinIndex={setCoinIndex}
          series={series}
        />
      </Grid>
      <Grid item xs={3} className={classes.right}>
        {coinHolding.length === 0 && !hasCoins ? (
          <Typography color="textSecondary" variant="h2">
            No Data
          </Typography>
        ) : (
          <div>
            <div style={{ margin: '1rem 0rem' }}>
              <Typography color="secondary" variant="h3" align="center">
                {`$ ${
                  coinHolding.length > 0
                    ? coinIndex !== 0
                      ? formatDisplayAmount(coinHolding[coinIndex - 1], 2, true)
                      : formatDisplayAmount(
                          coinHolding.reduce((a: any, b: any) => {
                            return a + b;
                          }, 0),
                          2,
                          true
                        )
                    : 0
                }`}
              </Typography>
              <Typography color="textSecondary" align="center" gutterBottom>
                Total
              </Typography>
            </div>
            <div style={{ margin: '1rem 0rem' }}>
              <Typography
                color="textPrimary"
                variant="h5"
                align="center"
                style={{
                  color:
                    sinceLastTotalPrice > 0
                      ? theme.palette.success.main
                      : theme.palette.error.main
                }}
              >
                {sinceLastTotalPrice >= 0
                  ? `+ $${sinceLastTotalPrice.toFixed(2)}`
                  : `- $${Math.abs(sinceLastTotalPrice).toFixed(2)}`}
              </Typography>
              <Typography
                color="textSecondary"
                align="center"
                variant="body2"
                gutterBottom
              >
                {sinceText}
              </Typography>
            </div>
            <div>
              <DonutChart
                hasCoins={hasCoins}
                series={
                  coinIndex !== 0 ? [coinHolding[coinIndex - 1]] : coinHolding
                }
                labels={
                  coinIndex !== 0 ? [coinList[coinIndex]] : coinList.slice(1)
                }
                currentCoinLabel={
                  coinIndex > 0 ? coinList[coinIndex].toUpperCase() : 'ALL'
                }
              />
            </div>
          </div>
        )}
      </Grid>
    </Root>
  );
};

export default PortfolioCharts;
