import { COINS } from '@cypherock/communication';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../../constants/routes';
import PopOverText from '../../../../../designSystem/designComponents/hover/popoverText';
import colors from '../../../../../designSystem/designConstants/colors';
import CoinIcons from '../../../../../designSystem/genericComponents/coinIcons';
import { useDiscreetMode } from '../../../../../store/provider';
import formatDisplayAmount from '../../../../../utils/formatDisplayAmount';

const PREFIX = 'PortfolioOneCoin';

const classes = {
  coin: `${PREFIX}-coin`,
  coinText: `${PREFIX}-coinText`,
  alignStartCenter: `${PREFIX}-alignStartCenter`,
  text: `${PREFIX}-text`,
  bold: `${PREFIX}-bold`
};

const Root = styled(Grid)(({ theme }) => ({
  background: theme.palette.primary.light,
  padding: theme.spacing(1),
  borderRadius: 5,
  margin: `${theme.spacing(1)} 0px`,
  cursor: 'pointer',
  '&:hover': {
    background: '#343a42'
  },
  [`& .${classes.coin}`]: {
    display: 'flex'
  },
  [`& .${classes.coinText}`]: {
    display: 'flex',
    flexDirection: 'column'
  },
  [`& .${classes.alignStartCenter}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  [`& .${classes.text}`]: {
    color: colors.systemColors.textAndBackground.light[100]
  },
  [`& .${classes.bold}`]: {
    fontWeight: 700
  }
}));

interface OneCoinProps {
  coinId: string;
  parentCoinId: string;
  coinInitial: string;
  coinHolding: string;
  coinValue: string;
  coinPrice: string;
  coinPortfolio: string;
  decimal: number;
  index: number;
}

const OneCoin: React.FC<OneCoinProps> = props => {
  const discreetMode = useDiscreetMode();
  const {
    coinId,
    parentCoinId,
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
    navigate(`${Routes.transactions.index}?slug=${coinInitial.toLowerCase()}`);
  };

  let coin;
  if (parentCoinId) {
    const parent = COINS[parentCoinId];
    if (!parent) {
      throw new Error(`Cannot find coinType: ${parentCoinId}`);
    }
    coin = parent.tokenList[coinId];
  } else coin = COINS[coinId];

  if (!coin) {
    throw new Error(`Cannot find coinType: ${coinId}`);
  }

  return (
    <Root onClick={onClick} container>
      <Grid item xs={3} className={classes.coin}>
        <CoinIcons
          initial={coinId}
          parentCoin={parentCoinId}
          style={{ marginRight: '10px' }}
        />
        <div className={classes.coinText}>
          <Typography
            variant="body2"
            color="textPrimary"
            className={classes.bold}
          >
            {coinInitial.toUpperCase()}
          </Typography>
          <PopOverText
            hoverText={coin.name.toUpperCase()}
            color="textPrimary"
            style={{ fontSize: '0.6rem', paddingRight: '8px' }}
            className={classes.bold}
          >
            {coin.name.toUpperCase()}
          </PopOverText>
        </div>
      </Grid>
      <Grid item xs={3} className={classes.alignStartCenter}>
        <PopOverText
          color="textPrimary"
          variant="body2"
          className={classes.bold}
          hoverText={`${discreetMode.handleSensitiveDataDisplay(
            formatDisplayAmount(coinHolding, decimal, true)
          )} ${coinInitial.toUpperCase()}`}
          style={{ paddingRight: '8px' }}
        >
          {discreetMode.handleSensitiveDataDisplay(
            formatDisplayAmount(coinHolding, 5, true)
          )}{' '}
          {coinInitial.toUpperCase()}
        </PopOverText>
      </Grid>
      <Grid item xs={2} className={classes.alignStartCenter}>
        <PopOverText
          color="textPrimary"
          variant="body2"
          className={classes.bold}
          hoverText={`$ ${discreetMode.handleSensitiveDataDisplay(
            formatDisplayAmount(coinValue, undefined, true)
          )} `}
          style={{ paddingRight: '8px' }}
        >
          {`$ ${discreetMode.handleSensitiveDataDisplay(
            formatDisplayAmount(coinValue, 2, true)
          )}`}
        </PopOverText>
      </Grid>
      <Grid item xs={2} className={classes.alignStartCenter}>
        <PopOverText
          color="textPrimary"
          variant="body2"
          className={classes.bold}
          hoverText={`$ ${formatDisplayAmount(coinPrice, undefined, true)} `}
          style={{ paddingRight: '8px' }}
        >
          {`$ ${formatDisplayAmount(coinPrice, 2, true)}`}
        </PopOverText>
      </Grid>
      <Grid item xs={2} className={classes.alignStartCenter}>
        <Typography
          variant="h6"
          style={{ color: color[index % 3], fontWeight: 700 }}
        >
          {discreetMode.handleSensitiveDataDisplay(coinPortfolio)}
        </Typography>
      </Grid>
    </Root>
  );
};

OneCoin.propTypes = {
  coinId: PropTypes.string.isRequired,
  parentCoinId: PropTypes.string,
  coinInitial: PropTypes.string.isRequired,
  coinHolding: PropTypes.string.isRequired,
  coinValue: PropTypes.string.isRequired,
  coinPrice: PropTypes.string.isRequired,
  coinPortfolio: PropTypes.string.isRequired,
  decimal: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};

export default React.memo(OneCoin);
