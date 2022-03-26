import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      padding: `1.5rem 0px`
    },
    iconItem: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    textItem: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start'
    },
    label: {
      fontSize: '0.8rem',
      color: theme.palette.text.secondary
    },
    text: {
      fontSize: '1.1rem',
      color: theme.palette.info.main
    },
    rightAligned: {
      alignItems: 'flex-end'
    }
  })
);

type BatchTransactionRecieverViewProps = {
  recieverAddress: string | undefined;
  amount: string | number;
  coin: string;
  icon?: JSX.Element | undefined;
};

const BatchTransactionRecieverView: React.FC<
  BatchTransactionRecieverViewProps
> = ({ recieverAddress, amount, icon, coin }) => {
  const classes = useStyles();
  return (
    <Grid container className={classes.root}>
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
    </Grid>
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
