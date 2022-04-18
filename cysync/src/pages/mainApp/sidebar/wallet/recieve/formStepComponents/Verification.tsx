import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import { useReceiveTransactionContext } from '../../../../../../store/provider';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: 'fit-content',
      padding: '3rem 10rem 3rem',
      marginLeft: 'auto',
      marginRight: 'auto'
    },
    addressContainer: {
      background: 'rgba(0,0,0,0.2)',
      minWidth: '92%',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      borderRadius: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    copyButton: {
      textTransform: 'none'
    }
  })
);

const Verification: React.FC<StepComponentProps> = ({ handleNext }) => {
  const classes = useStyles();

  const { receiveTransaction } = useReceiveTransactionContext();

  useEffect(() => {
    if (receiveTransaction.verified) {
      setTimeout(handleNext, 500);
    }
  }, [receiveTransaction.verified]);

  const address = receiveTransaction.receiveAddress;
  return (
    <div className={classes.root}>
      <div className={classes.addressContainer}>
        <Typography color="secondary" variant="h4">
          {address}
        </Typography>
      </div>
      <Typography color="textSecondary">Verify Address on Device</Typography>
      <TextView
        completed={receiveTransaction.verified}
        inProgress={!receiveTransaction.verified}
        text="Please Match the Address on CypherRock X1"
      />
    </div>
  );
};

Verification.propTypes = StepComponentPropTypes;

export default Verification;
