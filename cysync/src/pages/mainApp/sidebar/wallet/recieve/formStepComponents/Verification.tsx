import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import {
  useCustomAccountContext,
  useReceiveTransactionContext
} from '../../../../../../store/provider';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletReceiveVerification';

const classes = {
  root: `${PREFIX}-root`,
  addressContainer: `${PREFIX}-addressContainer`,
  copyButton: `${PREFIX}-copyButton`
};

const Root = styled('div')(() => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: 'fit-content',
    padding: '3rem 10rem 3rem',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  [`& .${classes.addressContainer}`]: {
    background: 'rgba(0,0,0,0.2)',
    minWidth: '92%',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.copyButton}`]: {
    textTransform: 'none'
  }
}));

const Verification: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { receiveTransaction } = useReceiveTransactionContext();
  const { customAccount } = useCustomAccountContext();

  useEffect(() => {
    if (receiveTransaction.verified) {
      setTimeout(handleNext, 500);
    }
  }, [receiveTransaction.verified]);

  const address = receiveTransaction.receiveAddress;
  return (
    <Root className={classes.root}>
      <div className={classes.addressContainer}>
        <Typography color="secondary" variant="h4">
          {customAccount ? customAccount.name : address}
        </Typography>
      </div>
      <Typography color="textSecondary">Verify Address on Device</Typography>
      <TextView
        completed={receiveTransaction.verified}
        inProgress={!receiveTransaction.verified}
        text="Please Match the Address on CypherRock X1"
      />
    </Root>
  );
};

Verification.propTypes = StepComponentPropTypes;

export default Verification;
