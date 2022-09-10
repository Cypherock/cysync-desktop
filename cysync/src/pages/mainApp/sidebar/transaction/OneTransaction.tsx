import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import PopOverText from '../../../../designSystem/designComponents/hover/popoverText';
import Icon from '../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../designSystem/genericComponents/coinIcons';
import ICONS from '../../../../designSystem/iconGroups/iconConstants';
import { useDiscreetMode } from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';

const PREFIX = 'OneTransaction';

const classes = {
  root: `${PREFIX}-root`,
  alignStartCenter: `${PREFIX}-alignStartCenter`,
  alignCenterCenter: `${PREFIX}-alignCenterCenter`,
  flexColumn: `${PREFIX}-flexColumn`,
  capitalize: `${PREFIX}-capitalize`,
  clearFix: `${PREFIX}-clearFix`,
  blue: `${PREFIX}-blue`,
  red: `${PREFIX}-red`,
  orange: `${PREFIX}-orange`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    background: theme.palette.primary.light,
    padding: '0.5rem 0rem 0.5rem 0rem',
    borderRadius: 5,
    minHeight: 50,
    maxHeight: 60,
    margin: `${theme.spacing(1)} 0px`
  },
  [`& .${classes.alignStartCenter}`]: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  [`& .${classes.alignCenterCenter}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.flexColumn}`]: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  [`& .${classes.capitalize}`]: {
    textTransform: 'uppercase'
  },
  [`& .${classes.clearFix}`]: {
    margin: `0px !important`,
    padding: `0px !important`
  },
  [`& .${classes.blue}`]: {
    color: theme.palette.info.main
  },
  [`& .${classes.red}`]: {
    color: theme.palette.error.main
  },
  [`& .${classes.orange}`]: {
    color: theme.palette.secondary.main
  }
}));

interface OneTransactionProps {
  date: string;
  time: string;
  walletName: string;
  initial: string;
  coinParent: string;
  amount: string;
  value: string;
  result: string;
  address: string;
  decimal: number;
  onShowMore: () => void;
  status: string;
}

const OneTransaction: React.FC<OneTransactionProps> = props => {
  const theme = useTheme();
  const discreetMode = useDiscreetMode();

  const {
    date,
    time,
    walletName,
    initial,
    coinParent,
    amount,
    decimal,
    value,
    result,
    status,
    onShowMore
  } = props;

  const getResultIcon = () => {
    switch (result) {
      case 'SENT':
        return (
          <Icon
            viewBox="0 0 14 14"
            icon={ICONS.send}
            color={theme.palette.secondary.main}
          />
        );
      case 'RECEIVED':
        return (
          <Icon
            viewBox="0 0 14 14"
            icon={ICONS.recieve}
            color={theme.palette.info.main}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Root style={{ marginRight: '10px' }}>
      <Grid container className={classes.root}>
        <Grid
          item
          xs={3}
          style={{
            display: 'flex'
          }}
        >
          <CoinIcons
            initial={initial}
            style={{ marginRight: '10px' }}
            parentCoin={coinParent?.toLowerCase()}
          />
          <div
            className={clsx(classes.alignStartCenter, classes.flexColumn)}
            style={{ justifyContent: 'center' }}
          >
            <Typography color="textPrimary">{date}</Typography>
            <Typography color="textPrimary" variant="caption">
              {time}
            </Typography>
          </div>
        </Grid>
        <Grid item xs={1} className={classes.alignStartCenter}>
          <PopOverText
            text={`${walletName.substring(0, 5)}${
              walletName.length > 5 ? '...' : ''
            } `}
            color="textPrimary"
            hoverText={walletName}
          />
        </Grid>
        <Grid item xs={2} className={classes.alignStartCenter}>
          <PopOverText
            text={`${initial} ${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(amount, 4)
            )}`}
            color="textPrimary"
            hoverText={`${initial} ${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(amount, decimal, true)
            )}`}
          />
        </Grid>
        <Grid item xs={1} className={classes.alignStartCenter}>
          <Typography color="textPrimary">{`$ ${discreetMode.handleSensitiveDataDisplay(
            formatDisplayAmount(value)
          )}`}</Typography>
        </Grid>
        <Grid
          item
          xs={2}
          className={clsx(classes.alignStartCenter, classes.capitalize)}
        >
          <Typography
            className={!(result === 'SENT') ? classes.blue : classes.orange}
            variant="body2"
          >
            {getResultIcon()}
            {result}
          </Typography>
        </Grid>
        <Grid
          item
          xs={1}
          className={clsx(classes.alignStartCenter, classes.capitalize)}
        >
          <Typography
            className={
              status === 'FAILED'
                ? classes.red
                : status === 'PENDING'
                ? classes.orange
                : classes.blue
            }
          >
            {status}
          </Typography>
        </Grid>
        <Grid item xs={2} className={classes.alignCenterCenter}>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={onShowMore}
          >
            Show More
          </Button>
        </Grid>
      </Grid>
    </Root>
  );
};

OneTransaction.propTypes = {
  date: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  walletName: PropTypes.string.isRequired,
  initial: PropTypes.string.isRequired,
  coinParent: PropTypes.string,
  amount: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  result: PropTypes.string.isRequired,
  decimal: PropTypes.number.isRequired,
  address: PropTypes.string.isRequired,
  onShowMore: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired
};

export default OneTransaction;
