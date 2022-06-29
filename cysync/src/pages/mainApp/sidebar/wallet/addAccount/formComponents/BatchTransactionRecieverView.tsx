import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

const PREFIX = 'WalletAddAccountBatchTxnReceiver';

const classes = {
  root: `${PREFIX}-root`,
  iconItem: `${PREFIX}-iconItem`,
  textItem: `${PREFIX}-textItem`,
  label: `${PREFIX}-label`,
  text: `${PREFIX}-text`,
  rightAligned: `${PREFIX}-rightAligned`
};

const Root = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    padding: `1.5rem 0px`
  },
  [`& .${classes.iconItem}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.textItem}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  [`& .${classes.label}`]: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary
  },
  [`& .${classes.text}`]: {
    fontSize: '1.1rem',
    color: theme.palette.info.main
  },
  [`& .${classes.rightAligned}`]: {
    alignItems: 'flex-end'
  }
}));

type BatchTransactionRecieverViewProps = {
  recieverAddress: string | undefined;
  amount: string | number;
  coin: string;
  icon?: JSX.Element | undefined;
};

const BatchTransactionRecieverView: React.FC<
  BatchTransactionRecieverViewProps
> = ({ recieverAddress, amount, icon, coin }) => {
  return (
    <Root container className={classes.root}>
      <Grid item xs={1} className={classes.iconItem}>
        {icon}
      </Grid>
      <Grid item xs={6} className={classes.textItem}>
        <Typography className={classes.label}>
          Receiver&apos;s Address
        </Typography>
        <Typography className={classes.text}>{recieverAddress}</Typography>
      </Grid>
      <Grid
        item
        xs={5}
        className={clsx(classes.textItem, classes.rightAligned)}
      >
        <Typography
          className={classes.label}
        >{`Amount (${coin.toUpperCase()})`}</Typography>
        <Typography
          className={classes.text}
        >{`${amount} ${coin.toUpperCase()}`}</Typography>
      </Grid>
    </Root>
  );
};

BatchTransactionRecieverView.propTypes = {
  recieverAddress: PropTypes.string,
  coin: PropTypes.string.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element
};

BatchTransactionRecieverView.defaultProps = {
  recieverAddress: undefined,
  icon: undefined
};

export default BatchTransactionRecieverView;
