import { ALLCOINS as COINS } from '@cypherock/communication';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../../constants/routes';
import PopOverText from '../../../../../designSystem/designComponents/hover/popoverText';
import colors from '../../../../../designSystem/designConstants/colors';
import CoinIcons from '../../../../../designSystem/genericComponents/coinIcons';
import formatDisplayAmount from '../../../../../utils/formatDisplayAmount';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      background: theme.palette.primary.light,
      padding: theme.spacing(1),
      borderRadius: 5,
      margin: `${theme.spacing(1)}px 0px`,
      cursor: 'pointer',
      '&:hover': {
        background: '#343a42'
      }
    },
    coin: {
      display: 'flex'
    },
    coinText: {
      display: 'flex',
      flexDirection: 'column'
    },
    alignStartCenter: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center'
    },
    text: {
      color: colors.systemColors.textAndBackground.light[100]
    },
    bold: {
      fontWeight: 700
    }
  })
);

interface OneCoinProps {
  coinInitial: string;
  coinHolding: string;
  coinValue: string;
  coinPrice: string;
  coinPortfolio: string;
  decimal: number;
  index: number;
}

const OneCoin: React.FC<OneCoinProps> = props => {
  const {
    coinInitial,
    coinHolding,
    coinPrice,
    coinValue,
    decimal,
    coinPortfolio,
    index
  } = props;

  const navigate = useNavigate();
  const color = ['#DB953C', '#328332', '#F3BA2F'];

  const onClick = () => {
    navigate(`${Routes.transactions.index}?coin=${coinInitial.toLowerCase()}`);
  };

  const coin = COINS[coinInitial];

  if (!coin) {
    throw new Error(`Cannot find coinType: ${coinInitial}`);
  }

  const classes = useStyles();
  return (
    <Grid onClick={onClick} container className={classes.root}>
      <Grid item xs={3} className={classes.coin}>
        <CoinIcons initial={coinInitial.toUpperCase()} />
        <div className={classes.coinText}>
          <Typography variant="body2" color="textPrimary">
            {coinInitial.toUpperCase()}
          </Typography>
          <Typography color="textPrimary" style={{ fontSize: '0.6rem' }}>
            {coin.name.toUpperCase()}
          </Typography>
        </div>
      </Grid>
      <Grid item xs={3} className={classes.alignStartCenter}>
        <PopOverText
          text={`${formatDisplayAmount(
            coinHolding,
            4
          )} ${coinInitial.toUpperCase()} `}
          color="textPrimary"
          variant="body2"
          className={classes.bold}
          hoverText={`${formatDisplayAmount(
            coinHolding,
            decimal,
            true
          )} ${coinInitial.toUpperCase()}`}
        />
      </Grid>
      <Grid item xs={2} className={classes.alignStartCenter}>
        <Typography variant="body2" color="textPrimary">
          <span className={classes.bold}>{`$ ${coinValue}`}</span>
        </Typography>
      </Grid>
      <Grid item xs={2} className={classes.alignStartCenter}>
        <Typography variant="body2" color="textPrimary">
          <span className={classes.bold}>{`$ ${coinPrice}`}</span>
        </Typography>
      </Grid>
      <Grid item xs={2} className={classes.alignStartCenter}>
        <Typography
          variant="h6"
          style={{ color: color[index % 3], fontWeight: 700 }}
        >
          {coinPortfolio}
        </Typography>
      </Grid>
    </Grid>
  );
};

OneCoin.propTypes = {
  coinInitial: PropTypes.string.isRequired,
  coinHolding: PropTypes.string.isRequired,
  coinValue: PropTypes.string.isRequired,
  coinPrice: PropTypes.string.isRequired,
  coinPortfolio: PropTypes.string.isRequired,
  decimal: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};

export default React.memo(OneCoin);
